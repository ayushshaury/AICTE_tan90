"""
AICTE VerifyAI — standalone AI document analysis service
Problem statement: SIH 2026 PS 26261

What this service does:
- OCR for scanned/image/PDF documents using PaddleOCR
- Basic document-type classification from extracted text
- Heuristic field extraction (names, dates, IDs, registration numbers)
- Expiry-date and required-field checks
- Exact-file duplicate detection during the current process lifetime
- Advisory visual/PDF metadata warnings
- FastAPI endpoints for health and document analysis

Important limitations:

- OCR output and visual heuristics do not prove authenticity.
- Issuer verification must be performed through authorized issuing-authority systems.
- Findings are advisory and must be reviewed by a competent human.
- Duplicate history is in memory only and resets when this process restarts.
- PaddleOCR language support depends on the installed model. This file defaults to English.
  Configure and test suitable language models for Hindi/other Indian languages before use.

Recommended Python: 3.10 or 3.11
"""

from __future__ import annotations

import hashlib
import io
import json
import logging
import os
import re
import tempfile
import threading
import time
from datetime import date, datetime
from pathlib import Path
from typing import Any, Optional

import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass



APP_NAME = "AICTE VerifyAI AI Service"
APP_VERSION = "0.1.0"


API_TOKEN = os.getenv("VERIFYAI_API_TOKEN", "").strip()


OCR_LANG = os.getenv("VERIFYAI_OCR_LANG", "en").strip() or "en"

MAX_UPLOAD_MB = int(os.getenv("VERIFYAI_MAX_UPLOAD_MB", "20"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
MAX_PDF_PAGES = int(os.getenv("VERIFYAI_MAX_PDF_PAGES", "25"))
OCR_USE_ANGLE_CLS = os.getenv("VERIFYAI_USE_ANGLE_CLS", "true").lower() in {
    "1", "true", "yes", "y"
}

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/tiff",
    "image/bmp",
    "image/webp",
    "application/octet-stream",
}

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("verifyai")

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "OCR and advisory document screening. Results are not a legal finding "
        "of authenticity or regulatory compliance."
    ),
)


_seen_hashes: dict[str, dict[str, Any]] = {}
_seen_hashes_lock = threading.Lock()

_ocr_engine = None
_ocr_lock = threading.Lock()



class Finding(BaseModel):
    code: str
    severity: str = Field(description="info, low, medium, or high")
    message: str
    evidence: Optional[str] = None
    recommendation: Optional[str] = None


class DocumentAnalysisResponse(BaseModel):
    request_id: str
    filename: str
    sha256: str
    document_type: str
    extracted_text: str
    extracted_fields: dict[str, Any]
    page_count: int
    findings: list[Finding]
    review_required: bool = True
    authenticity_status: str = "not_verified"
    disclaimer: str = (
        "Automated screening only. This result does not establish authenticity "
        "or regulatory compliance; human and authorized issuer review is required."
    )


def get_ocr_engine():
    """
    Lazily load PaddleOCR once. This avoids downloading/loading the model
    until the first document is analyzed.
    """
    global _ocr_engine
    if _ocr_engine is not None:
        return _ocr_engine

    with _ocr_lock:
        if _ocr_engine is not None:
            return _ocr_engine

        try:
            from paddleocr import PaddleOCR
        except ImportError as exc:
            raise RuntimeError(
                "PaddleOCR is not installed. Install requirements from requirements.txt."
            ) from exc

        logger.info("Loading PaddleOCR model (lang=%s)...", OCR_LANG)
        try:
            
            _ocr_engine = PaddleOCR(
                use_angle_cls=OCR_USE_ANGLE_CLS,
                lang=OCR_LANG,
                show_log=False,
            )
            logger.info("PaddleOCR model loaded successfully.")
            return _ocr_engine
        except Exception as exc:
            logger.exception("Failed to initialize or download PaddleOCR model: %s", exc)
            raise RuntimeError(f"PaddleOCR model initialization failed: {exc}") from exc




def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_upload(filename: str, content_type: Optional[str], data: bytes) -> None:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file extension '{suffix}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported content type: {content_type}")
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_UPLOAD_MB} MB upload limit.",
        )


def pdf_to_images(data: bytes) -> tuple[list[np.ndarray], int, dict[str, Any]]:
    """Render a PDF into RGB numpy arrays, enforcing a page limit."""
    images: list[np.ndarray] = []
    metadata: dict[str, Any] = {}
    digital_texts: list[str] = []
    try:
        with fitz.open(stream=data, filetype="pdf") as pdf:
            page_count = len(pdf)
            if page_count == 0:
                raise HTTPException(status_code=400, detail="PDF contains no pages.")
            if page_count > MAX_PDF_PAGES:
                raise HTTPException(
                    status_code=413,
                    detail=f"PDF has {page_count} pages; maximum allowed is {MAX_PDF_PAGES}.",
                )
            metadata = {
                "pdf_title": pdf.metadata.get("title") or None,
                "pdf_author": pdf.metadata.get("author") or None,
                "pdf_creator": pdf.metadata.get("creator") or None,
                "pdf_producer": pdf.metadata.get("producer") or None,
                "pdf_creation_date": pdf.metadata.get("creationDate") or None,
                "pdf_modification_date": pdf.metadata.get("modDate") or None,
                "pdf_page_count": page_count,
                "pdf_encrypted": bool(pdf.is_encrypted),
            }
            if pdf.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="Encrypted PDFs are not supported. Upload an authorized readable copy.",
                )
           
            matrix = fitz.Matrix(1.7, 1.7)
            for page in pdf:
                page_text = page.get_text()
                if page_text and page_text.strip():
                    digital_texts.append(page_text.strip())
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                arr = np.frombuffer(pix.samples, dtype=np.uint8)
                arr = arr.reshape(pix.height, pix.width, pix.n)
                if pix.n == 4:
                    arr = arr[:, :, :3]
                images.append(arr)
            metadata["digital_text"] = "\n\n".join(digital_texts)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF processing failed")
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc
    return images, page_count, metadata


def image_file_to_array(data: bytes) -> np.ndarray:
    try:
        with Image.open(io.BytesIO(data)) as im:
            im = im.convert("RGB")
            return np.asarray(im)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read image: {exc}") from exc


def _normalize_ocr_result(raw_result: Any) -> tuple[str, list[dict[str, Any]]]:
    """
    Convert PaddleOCR's nested output to text lines and confidence records.
    PaddleOCR 2.x typically returns:
      [[ [box, (text, confidence)], ... ]]
    """
    lines: list[str] = []
    details: list[dict[str, Any]] = []
    if not raw_result:
        return "", details

    try:
        for page_result in raw_result:
            if not page_result:
                continue
            for item in page_result:
                if not item or len(item) < 2:
                    continue
                text_info = item[1]
                if isinstance(text_info, (list, tuple)) and text_info:
                    text = str(text_info[0]).strip()
                    confidence = None
                    if len(text_info) > 1:
                        try:
                            confidence = float(text_info[1])
                        except (TypeError, ValueError):
                            confidence = None
                    if text:
                        lines.append(text)
                        details.append({"text": text, "confidence": confidence})
    except (TypeError, ValueError):
        logger.exception("Unexpected OCR result format")
    return "\n".join(lines), details


def run_ocr_on_images(images: list[np.ndarray]) -> tuple[str, list[dict[str, Any]]]:
    engine = get_ocr_engine()
    all_lines: list[str] = []
    all_details: list[dict[str, Any]] = []

    for page_index, image_array in enumerate(images, start=1):
       
        bgr = image_array[:, :, ::-1].copy()
        try:
            raw = engine.ocr(bgr, cls=OCR_USE_ANGLE_CLS)
        except Exception as exc:
            logger.exception("OCR failed on page %s", page_index)
            all_lines.append(f"[OCR_ERROR_PAGE_{page_index}: {type(exc).__name__}]")
            continue

        page_text, details = _normalize_ocr_result(raw)
        all_lines.append(f"--- PAGE {page_index} ---\n{page_text}".strip())
        for record in details:
            record["page"] = page_index
            all_details.append(record)

    return "\n\n".join(all_lines).strip(), all_details




DOCUMENT_KEYWORDS: dict[str, list[str]] = {
    "registration_certificate": [
        "registration certificate", "certificate of registration", "registered under",
        "registration no", "registration number", "society registration",
    ],
    "approval_letter": [
        "approval letter", "approval", "approved by", "approval number",
        "letter of approval", "extension of approval",
    ],
    "affidavit": ["affidavit", "solemnly affirm", "deponent", "notary"],
    "land_document": [
        "land deed", "sale deed", "lease deed", "land ownership", "plot number",
        "khasra", "khata", "patta",
    ],
    "financial_document": [
        "balance sheet", "income and expenditure", "audited statement",
        "bank statement", "financial statement", "chartered accountant",
    ],
    "identity_document": [
        "identity card", "identity proof", "date of birth", "government of india",
        "passport", "driving licence", "voter",
    ],
    "fire_safety_certificate": ["fire safety", "fire certificate", "fire noc", "no objection certificate"],
    "building_document": ["building plan", "completion certificate", "occupancy certificate", "structural stability"],
    "unknown": [],
}


def classify_document(text: str) -> tuple[str, float]:
    lower = text.lower()
    scores: list[tuple[str, int]] = []
    for label, keywords in DOCUMENT_KEYWORDS.items():
        if label == "unknown":
            continue
        score = sum(1 for keyword in keywords if keyword in lower)
        scores.append((label, score))
    if not scores:
        return "unknown", 0.0
    label, score = max(scores, key=lambda item: item[1])
    if score <= 0:
        return "unknown", 0.0
    
    confidence = min(0.95, 0.35 + score * 0.12)
    return label, round(confidence, 3)


DATE_PATTERNS = [
    r"\b(0?[1-9]|[12][0-9]|3[01])[-/.](0?[1-9]|1[0-2])[-/.]((?:19|20)\d{2})\b",
    r"\b((?:19|20)\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12][0-9]|3[01])\b",
]
EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
PHONE_RE = re.compile(r"(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)")
PIN_RE = re.compile(r"(?<!\d)[1-9]\d{5}(?!\d)")
ID_LABEL_RE = re.compile(
    r"(?im)^\s*(registration\s*(?:no\.?|number)|application\s*(?:no\.?|number)|"
    r"certificate\s*(?:no\.?|number)|reference\s*(?:no\.?|number)|file\s*(?:no\.?|number))"
    r"\s*[:#\-]?\s*([A-Z0-9][A-Z0-9/_\-]{2,})"
)


def parse_date(value: str) -> Optional[date]:
    value = value.strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y", "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    return None


def extract_dates(text: str) -> list[str]:
    found: list[str] = []
    for pattern in DATE_PATTERNS:
        for match in re.finditer(pattern, text):
            candidate = match.group(0)
            if parse_date(candidate) and candidate not in found:
                found.append(candidate)
    return found


def extract_fields(text: str) -> dict[str, Any]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    emails = sorted(set(EMAIL_RE.findall(text)))
    phones = sorted(set(PHONE_RE.findall(text)))
    pins = sorted(set(PIN_RE.findall(text)))
    ids: list[dict[str, str]] = []
    for match in ID_LABEL_RE.finditer(text):
        ids.append({"label": match.group(1).strip(), "value": match.group(2).strip(" .,:;")})

    
    name_candidates = []
    for line in lines[:80]:
        lower = line.lower()
        if any(term in lower for term in ("name", "applicant", "institution", "college", "society", "trust")):
            if len(line) <= 160:
                name_candidates.append(line)

    return {
        "dates": extract_dates(text),
        "emails": emails,
        "phone_numbers": phones,
        "postal_codes": pins,
        "reference_numbers": ids,
        "name_or_entity_line_candidates": name_candidates[:15],
    }




def add_finding(
    findings: list[Finding],
    code: str,
    severity: str,
    message: str,
    evidence: Optional[str] = None,
    recommendation: Optional[str] = None,
) -> None:
    findings.append(
        Finding(
            code=code,
            severity=severity,
            message=message,
            evidence=evidence,
            recommendation=recommendation,
        )
    )


def check_expiry_and_dates(text: str, fields: dict[str, Any], findings: list[Finding]) -> None:
    lower = text.lower()
    expiry_terms = ("valid until", "valid till", "expiry date", "expires on", "date of expiry", "valid up to")
    expiry_context_present = any(term in lower for term in expiry_terms)

    if expiry_context_present:
       
        for line in text.splitlines():
            if any(term in line.lower() for term in expiry_terms):
                dates = extract_dates(line)
                if not dates:
                    add_finding(
                        findings,
                        "EXPIRY_DATE_NOT_EXTRACTED",
                        "medium",
                        "An expiry/validity phrase was found, but a date could not be confidently extracted.",
                        evidence=line.strip()[:300],
                        recommendation="Check the original document and enter the validity date during human review.",
                    )
                else:
                    expiry = parse_date(dates[-1])
                    if expiry and expiry < date.today():
                        add_finding(
                            findings,
                            "POSSIBLY_EXPIRED",
                            "high",
                            "The extracted validity date appears to be in the past.",
                            evidence=f"Line: {line.strip()[:250]} | Parsed date: {expiry.isoformat()}",
                            recommendation="Verify the date on the original document and confirm applicable validity rules.",
                        )
                    elif expiry:
                        add_finding(
                            findings,
                            "EXPIRY_DATE_FOUND",
                            "info",
                            "A validity date was extracted; its meaning should be confirmed by a reviewer.",
                            evidence=f"Line: {line.strip()[:250]} | Parsed date: {expiry.isoformat()}",
                            recommendation="Confirm the validity period against the relevant regulatory checklist.",
                        )
    elif fields.get("dates"):
        add_finding(
            findings,
            "DATES_FOUND_NO_EXPIRY_LABEL",
            "info",
            "Dates were found, but no explicit expiry/validity label was recognized.",
            evidence=", ".join(fields["dates"][:10]),
            recommendation="Review dates in context; do not assume the latest date is an expiry date.",
        )


def check_required_fields(document_type: str, fields: dict[str, Any], findings: list[Finding]) -> None:
   
    required_by_type = {
        "registration_certificate": ["dates", "reference_numbers"],
        "approval_letter": ["dates", "reference_numbers"],
        "affidavit": ["dates"],
        "financial_document": ["dates"],
        "fire_safety_certificate": ["dates"],
        "building_document": ["dates"],
        "land_document": ["dates"],
        "identity_document": ["dates"],
    }
    for field_name in required_by_type.get(document_type, []):
        if not fields.get(field_name):
            add_finding(
                findings,
                "POSSIBLE_MISSING_FIELD",
                "medium",
                f"No '{field_name.replace('_', ' ')}' value was extracted for document type '{document_type}'.",
                evidence=f"Document type was assigned using keyword rules; extracted field '{field_name}' was empty.",
                recommendation="Check whether this field is actually required for this document and whether OCR missed it.",
            )


def check_ocr_quality(ocr_details: list[dict[str, Any]], findings: list[Finding]) -> None:
    confidences = [
        item["confidence"]
        for item in ocr_details
        if isinstance(item.get("confidence"), (int, float))
    ]
    if not confidences:
        add_finding(
            findings,
            "OCR_CONFIDENCE_UNAVAILABLE",
            "medium",
            "OCR did not return usable confidence values.",
            recommendation="Review the scan manually or rerun OCR with a supported language model.",
        )
        return
    avg = float(np.mean(confidences))
    low_ratio = sum(c < 0.55 for c in confidences) / len(confidences)
    if avg < 0.65 or low_ratio > 0.35:
        add_finding(
            findings,
            "LOW_OCR_QUALITY",
            "medium",
            f"OCR text may be unreliable (mean confidence {avg:.2f}; {low_ratio:.0%} of text lines below 0.55).",
            evidence=f"OCR line count: {len(confidences)}",
            recommendation="Inspect the original scan. OCR confidence measures text recognition quality, not document authenticity.",
        )


def check_visual_quality(images: list[np.ndarray], findings: list[Finding]) -> None:
    for page_num, arr in enumerate(images, start=1):
        if arr.size == 0:
            continue
        
        gray = np.mean(arr[:, :, :3], axis=2)
        std = float(np.std(gray))
        if std < 22:
            add_finding(
                findings,
                "LOW_VISUAL_CONTRAST",
                "low",
                f"Page {page_num} has low overall visual contrast.",
                evidence=f"Grayscale intensity standard deviation: {std:.1f}",
                recommendation="Review the page image; low contrast can reduce OCR quality.",
            )


def check_pdf_metadata(metadata: dict[str, Any], findings: list[Finding]) -> None:
    if not metadata:
        return
    created = metadata.get("pdf_creation_date")
    modified = metadata.get("pdf_modification_date")
    if created and modified and created != modified:
        add_finding(
            findings,
            "PDF_METADATA_DATES_DIFFER",
            "low",
            "PDF creation and modification metadata differ.",
            evidence=f"Creation metadata: {created}; modification metadata: {modified}",
            recommendation="Metadata differences can be normal. Verify provenance through an authorized source if needed.",
        )
    if not any(metadata.get(key) for key in ("pdf_title", "pdf_author", "pdf_creator", "pdf_producer")):
        add_finding(
            findings,
            "PDF_METADATA_SPARSE",
            "info",
            "PDF metadata fields are sparse or absent.",
            recommendation="Sparse metadata is common and is not evidence of tampering.",
        )


def check_exact_duplicate(file_hash: str, filename: str, findings: list[Finding]) -> None:
    with _seen_hashes_lock:
        prior = _seen_hashes.get(file_hash)
        if prior:
            add_finding(
                findings,
                "EXACT_FILE_DUPLICATE_IN_SESSION",
                "medium",
                "An identical file hash was previously processed by this running service.",
                evidence=f"Previously seen filename: {prior.get('filename')}; first seen: {prior.get('first_seen')}",
                recommendation="Check whether the repeated upload is expected. A duplicate is not proof of fraud.",
            )
        else:
            _seen_hashes[file_hash] = {
                "filename": filename,
                "first_seen": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            }


def check_text_presence(text: str, findings: list[Finding]) -> None:
    if len(re.sub(r"\s+", "", text)) < 20:
        add_finding(
            findings,
            "VERY_LITTLE_TEXT_EXTRACTED",
            "high",
            "Very little readable text was extracted from this file.",
            evidence=f"Extracted non-whitespace character count: {len(text.replace(' ', '').replace(chr(10), '').replace(chr(13), '').replace(chr(9), ''))}",
            recommendation="Check that the file is legible and use the correct OCR language. This does not indicate forgery.",
        )



def analyze_document_bytes(
    data: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> dict[str, Any]:
    start = time.perf_counter()
    validate_upload(filename, content_type, data)
    file_hash = sha256_bytes(data)
    suffix = Path(filename).suffix.lower()
    metadata: dict[str, Any] = {}

    if suffix == ".pdf":
        images, page_count, metadata = pdf_to_images(data)
    else:
        images = [image_file_to_array(data)]
        page_count = 1

    findings: list[Finding] = []
    ocr_details = []
    try:
        extracted_text, ocr_details = run_ocr_on_images(images)
    except Exception as exc:
        logger.warning("OCR processing error or model loading: %s", exc)
        digital_text = metadata.get("digital_text", "")
        if digital_text:
            logger.info("Falling back to embedded PDF digital text layer.")
            extracted_text = digital_text
            add_finding(
                findings,
                "OCR_FALLBACK_TEXT_USED",
                "low",
                "PaddleOCR model is downloading weights or unavailable; text was extracted directly from the document's digital text stream.",
                evidence=f"Extracted {len(extracted_text)} characters from document text stream.",
                recommendation="Review the scan manually or rerun OCR when model weights are fully loaded."
            )
        else:
            raise RuntimeError(f"OCR model execution failed and no digital text available: {exc}") from exc

    document_type, type_match_score = classify_document(extracted_text)
    fields = extract_fields(extracted_text)

    check_exact_duplicate(file_hash, filename, findings)
    check_text_presence(extracted_text, findings)
    check_ocr_quality(ocr_details, findings)
    check_visual_quality(images, findings)
    check_pdf_metadata(metadata, findings)
    check_expiry_and_dates(extracted_text, fields, findings)
    check_required_fields(document_type, fields, findings)

    if document_type == "unknown":
        add_finding(
            findings,
            "DOCUMENT_TYPE_UNCERTAIN",
            "medium",
            "The document type could not be classified from the configured keywords.",
            recommendation="Select the correct document type manually or configure a validated classifier.",
        )
    else:
        add_finding(
            findings,
            "DOCUMENT_TYPE_KEYWORD_MATCH",
            "info",
            f"Document type candidate: {document_type}.",
            evidence=f"Keyword-match score: {type_match_score}; this is not a calibrated confidence.",
            recommendation="Confirm the document type during review.",
        )

    
    result = {
        "request_id": hashlib.sha256(
            f"{file_hash}:{time.time_ns()}".encode("utf-8")
        ).hexdigest()[:16],
        "filename": Path(filename).name,
        "sha256": file_hash,
        "document_type": document_type,
        "document_type_keyword_score": type_match_score,
        "extracted_text": extracted_text,
        "extracted_fields": fields,
        "page_count": page_count,
        "findings": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in findings],
        "review_required": True,
        "authenticity_status": "not_verified",
        "pdf_metadata": metadata,
        "ocr_language_configured": OCR_LANG,
        "processing_time_seconds": round(time.perf_counter() - start, 3),
        "disclaimer": (
            "Automated screening only. This result does not establish authenticity or regulatory "
            "compliance. OCR, duplicate, metadata, and visual findings are advisory. Human review "
            "and authorized issuer verification are required."
        ),
    }
    return result



def verify_token(provided_token: Optional[str]) -> None:
    if not API_TOKEN:
        
        return
    if not provided_token or provided_token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Missing or invalid AI service token.")


@app.get("/health")
@app.get("/api/v1/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": APP_VERSION,
        "ocr_model_loaded": _ocr_engine is not None,
        "ocr_language_configured": OCR_LANG,
        "token_auth_enabled": bool(API_TOKEN),
        "note": "Health does not initialize the OCR model.",
    }


@app.post("/api/v1/analyze-document", response_model=DocumentAnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    x_ai_service_token: Optional[str] = Header(default=None, alias="X-AI-Service-Token"),
):
    verify_token(x_ai_service_token)
    filename = file.filename or "uploaded_document"
    content_type = file.content_type
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_UPLOAD_MB} MB upload limit.",
        )
    try:
        result = analyze_document_bytes(data, filename, content_type)
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except RuntimeError as exc:
        logger.exception("AI model initialization failed")
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Document analysis failed")
        raise HTTPException(status_code=500, detail="Document analysis failed. Check service logs.") from exc


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": APP_NAME,
        "docs": "/docs",
        "health": "/health",
        "analysis_endpoint": "/api/v1/analyze-document",
    }




if __name__ == "__main__":
    import uvicorn

    host = os.getenv("VERIFYAI_HOST", "127.0.0.1")
    port = int(os.getenv("VERIFYAI_PORT", "8001"))
    uvicorn.run("verifyai_service:app", host=host, port=port, reload=False)


"""
INSTALLATION (run in a terminal, not in Python):

    py -3.11 -m venv .venv
    # Windows:
    .venv\\Scripts\\activate
    # macOS/Linux:
    source .venv/bin/activate

    python -m pip install --upgrade pip
    python -m pip install "paddlepaddle>=2.6,<3.0" "paddleocr==2.10.0" \
        fastapi uvicorn python-multipart "pydantic>=2,<3" pymupdf pillow numpy

    # Windows PowerShell example:
    $env:VERIFYAI_API_TOKEN = "replace-with-a-long-random-secret"
    $env:VERIFYAI_OCR_LANG = "en"
    python verifyai_service.py

Then open:
    http://127.0.0.1:8001/docs
    http://127.0.0.1:8001/health

Example API request:
    curl -X POST "http://127.0.0.1:8001/api/v1/analyze-document" ^
      -H "X-AI-Service-Token: replace-with-a-long-random-secret" ^
      -F "file=@sample.pdf"

For local development only, you may omit VERIFYAI_API_TOKEN; if set, the token
must be sent in the X-AI-Service-Token header. Do not expose this service publicly
without authentication, HTTPS, rate limits, file scanning, and persistent audit logs.

Node/Express integration:
    POST http://127.0.0.1:8001/api/v1/analyze-document
    multipart field name: file
    header: X-AI-Service-Token: <same token>
"""
