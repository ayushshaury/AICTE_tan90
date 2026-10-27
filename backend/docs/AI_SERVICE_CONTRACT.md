# AICTE VerifyAI — AI Service Contract & Integration Specification

This document defines the interface boundary between the **AICTE VerifyAI Express Backend** and the external **FastAPI Python ML/OCR Service** (developed separately in Google Colab).

---

## 1. Architecture & Protocol Boundary

- **Transport:** HTTP / HTTPS
- **Format:** JSON (`application/json`)
- **Authentication:** Bearer Service Token passed via `Authorization: Bearer <AI_SERVICE_TOKEN>`
- **Correlation:** Every request includes an `X-Request-ID: <uuid>` header for distributed tracing.
- **Client Timeout:** Express applies a strict 12-second client timeout (`AbortController`). If the AI service does not respond within 12 seconds, the document remains safely stored on disk and the job is marked `FAILED` with retry capability.

---

## 2. Document Analysis Endpoint

### `POST /api/v1/analyze-document`

Analyzes an uploaded institutional compliance document, performs OCR text extraction, classifies the certificate, extracts structured key-value parameters, and flags potential anomalies.

#### Request Headers
```http
POST /api/v1/analyze-document HTTP/1.1
Host: your-fastapi-service:8001
Content-Type: application/json
Authorization: Bearer <AI_SERVICE_TOKEN>
X-Request-ID: c56a4180-65aa-42ec-a945-5fd2dec05382
```

#### Request Payload
```json
{
  "request_id": "c56a4180-65aa-42ec-a945-5fd2dec05382",
  "application_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "document_category": "FIRE_SAFETY_CERTIFICATE",
  "language_hint": "en",
  "file_name": "fire_safety_noc_pune_municipal.pdf",
  "content_sha256": "b2c3d4e5f6a7890123456789abcdef0123456789abcdef0123456789abcdef1",
  "file_reference": "uuid-storage-key.pdf"
}
```

#### Successful Response (`200 OK`)
```json
{
  "request_id": "c56a4180-65aa-42ec-a945-5fd2dec05382",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "service_mode": "fastapi",
  "document_type": {
    "label": "FIRE_SAFETY_CERTIFICATE",
    "confidence": 0.95
  },
  "language": {
    "label": "en",
    "confidence": 0.94
  },
  "extracted_fields": [
    {
      "field_name": "institution_name",
      "value": "Apex Institute of Technology & Management",
      "confidence": 0.97,
      "page_number": 1,
      "evidence_text": "Issued to: Apex Institute of Technology & Management, Pune",
      "bounding_box": {
        "x": 120,
        "y": 340,
        "width": 450,
        "height": 28
      }
    },
    {
      "field_name": "valid_until",
      "value": "2026-03-31",
      "confidence": 0.93,
      "page_number": 1,
      "evidence_text": "Valid up to: 31-03-2026",
      "bounding_box": {
        "x": 120,
        "y": 480,
        "width": 210,
        "height": 22
      }
    }
  ],
  "anomalies": [
    {
      "code": "DOCUMENT_EXPIRATION_DETECTED",
      "severity": "HIGH",
      "title": "Document Validity Date Has Passed",
      "reason": "The extracted validity date (31-03-2026) precedes the scrutiny date.",
      "page_number": 1,
      "evidence_text": "Valid up to: 31-03-2026",
      "confidence": 0.93,
      "requires_human_review": true
    }
  ],
  "warnings": [],
  "processing_time_ms": 1150
}
```

---

## 3. Connecting Google Colab / FastAPI Service

When your model pipeline is ready:

1. Expose your FastAPI service (e.g. using `ngrok`, Cloudflare Tunnel, or a VPS).
2. In `server/.env`, switch the configuration:
```dotenv
AI_SERVICE_MODE=fastapi
AI_SERVICE_URL=https://your-model-endpoint.ngrok-free.app
AI_SERVICE_TOKEN=your_shared_secret_service_token
```
3. Restart the Express server. The typed `AiServiceClient` will immediately begin dispatching analysis requests to the Python service.
4. **No frontend changes are required.** The React UI receives the same typed responses and highlights fields and anomalies identically.
