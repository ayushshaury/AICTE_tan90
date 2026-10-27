import fs from 'fs';
import path from 'path';
import { DocumentCategory, Severity } from '@prisma/client';
import {
  AiDocumentAnalysisRequest,
  AiDocumentAnalysisResponse,
  VerifyAiAnalysisResponse,
  AiExtractedField,
  AiAnomaly,
} from '../types/index.js';
import { normalizeDate, normalizeProgrammeName } from '../utils/normalizer.js';

export class AiServiceClient {
  private mode: 'mock' | 'fastapi';
  private serviceUrl: string;
  private serviceToken: string;

  constructor() {
    this.mode = (process.env.AI_SERVICE_MODE as 'mock' | 'fastapi') || 'fastapi';
    this.serviceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
    this.serviceToken = process.env.AI_SERVICE_TOKEN || 'aicte_verifyai_internal_token_secret';
  }

  public getMode(): string {
    return this.mode;
  }

  public setMode(mode: 'mock' | 'fastapi') {
    this.mode = mode;
  }

  public async checkHealth(): Promise<{ status: string; details?: any }> {
    try {
      const response = await fetch(`${this.serviceUrl}/api/v1/health`, {
        method: 'GET',
        headers: this.serviceToken ? { 'X-AI-Service-Token': this.serviceToken } : {},
      });
      if (response.ok) {
        const data = await response.json();
        return { status: 'UP', details: data };
      }
      return { status: 'DEGRADED', details: { statusCode: response.status } };
    } catch (err: any) {
      return { status: 'DOWN', details: { error: err.message } };
    }
  }

  public async analyzeDocument(request: AiDocumentAnalysisRequest): Promise<AiDocumentAnalysisResponse> {
    if (this.mode === 'fastapi') {
      try {
        return await this.callFastApi(request);
      } catch (err: any) {
        console.warn(`[AI SERVICE WARNING] FastAPI call failed (${err.message}). Falling back to deterministic mock adapter to maintain operational resilience.`);
        const fallback = this.generateMockAnalysis(request);
        fallback.warnings.push(`FastAPI service note: ${err.message}. Served by fallback screening adapter.`);
        return fallback;
      }
    }
    return this.generateMockAnalysis(request);
  }

  private async callFastApi(request: AiDocumentAnalysisRequest): Promise<AiDocumentAnalysisResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s timeout for deep OCR processing

    try {
      if (!request.file_path || !fs.existsSync(request.file_path)) {
        throw new Error(`Document file not found on disk at: ${request.file_path}`);
      }

      // Read file binary and construct multipart/form-data payload with field 'file'
      const fileBuffer = fs.readFileSync(request.file_path);
      const mimeType = request.mime_type || 'application/pdf';
      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', fileBlob, request.file_name);

      const headers: Record<string, string> = {
        'X-Request-ID': request.request_id,
      };
      if (this.serviceToken) {
        headers['X-AI-Service-Token'] = this.serviceToken;
      }

      const response = await fetch(`${this.serviceUrl}/api/v1/analyze-document`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP status ${response.status}: ${response.statusText}`;
        try {
          const errJson = (await response.json()) as any;
          errMessage = errJson?.detail || JSON.stringify(errJson);
        } catch {
          // Body not json
        }
        throw new Error(`Python AI Service error: ${errMessage}`);
      }

      const rawAiResponse = (await response.json()) as VerifyAiAnalysisResponse;

      // Transform raw Python AI output into normalized fields and findings
      return this.normalizeVerifyAiResponse(request, rawAiResponse);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('AI analysis service timed out after 35 seconds. Document is safely preserved.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  public normalizeVerifyAiResponse(
    request: AiDocumentAnalysisRequest,
    raw: VerifyAiAnalysisResponse
  ): AiDocumentAnalysisResponse {
    const fields: AiExtractedField[] = [];
    const anomalies: AiAnomaly[] = [];

    // 1. Detected Document Type
    fields.push({
      field_name: 'detected_document_type',
      value: raw.document_type.replace(/_/g, ' ').toUpperCase(),
      confidence: raw.document_type_keyword_score || 0.9,
      page_number: 1,
      evidence_text: `Classified as ${raw.document_type} (Score: ${raw.document_type_keyword_score ?? 'N/A'})`,
      bounding_box: { x: 50, y: 40, width: 350, height: 30 },
    });

    // 2. Extracted Dates & Validity
    if (raw.extracted_fields?.dates && raw.extracted_fields.dates.length > 0) {
      raw.extracted_fields.dates.forEach((d, idx) => {
        const isLikelyExpiry = idx === 0 || d.includes('2025') || d.includes('2026') || d.includes('2027');
        fields.push({
          field_name: isLikelyExpiry ? 'valid_until' : `extracted_date_${idx + 1}`,
          value: normalizeDate(d) || d,
          confidence: 0.92,
          page_number: 1,
          evidence_text: `Extracted date: ${d}`,
          bounding_box: { x: 80, y: 120 + idx * 30, width: 200, height: 22 },
        });
      });
    }

    // 3. Extracted IDs / Registration Numbers
    if (raw.extracted_fields?.reference_numbers && raw.extracted_fields.reference_numbers.length > 0) {
      raw.extracted_fields.reference_numbers.forEach((ref, idx) => {
        fields.push({
          field_name: ref.label.replace(/\s+/g, '_').toLowerCase(),
          value: ref.value,
          confidence: 0.95,
          page_number: 1,
          evidence_text: `${ref.label}: ${ref.value}`,
          bounding_box: { x: 80, y: 180 + idx * 30, width: 300, height: 24 },
        });
      });
    }

    // 4. Extracted Emails & Contacts
    if (raw.extracted_fields?.emails && raw.extracted_fields.emails.length > 0) {
      raw.extracted_fields.emails.forEach((email, idx) => {
        fields.push({
          field_name: idx === 0 ? 'contact_email' : `contact_email_${idx + 1}`,
          value: email,
          confidence: 0.98,
          page_number: 1,
          evidence_text: `Email: ${email}`,
          bounding_box: { x: 80, y: 260 + idx * 25, width: 280, height: 20 },
        });
      });
    }

    // 5. Extracted Institution / Entity Candidates
    if (raw.extracted_fields?.name_or_entity_line_candidates && raw.extracted_fields.name_or_entity_line_candidates.length > 0) {
      raw.extracted_fields.name_or_entity_line_candidates.slice(0, 3).forEach((candidate, idx) => {
        fields.push({
          field_name: idx === 0 ? 'institution_name' : `entity_candidate_${idx + 1}`,
          value: candidate,
          confidence: 0.88,
          page_number: 1,
          evidence_text: candidate,
          bounding_box: { x: 50, y: 70 + idx * 35, width: 450, height: 28 },
        });
      });
    }

    // 6. Map Findings from Python service to Anomalies
    if (raw.findings && raw.findings.length > 0) {
      raw.findings.forEach((f) => {
        let mappedSeverity: Severity = Severity.MEDIUM;
        const sevLower = (f.severity || '').toLowerCase();
        if (sevLower === 'high' || sevLower === 'critical') mappedSeverity = Severity.HIGH;
        else if (sevLower === 'low' || sevLower === 'info') mappedSeverity = Severity.LOW;

        anomalies.push({
          code: f.code,
          severity: mappedSeverity,
          title: f.message,
          reason: f.message,
          page_number: 1,
          evidence_text: f.evidence || null,
          confidence: 0.9,
          requires_human_review: true,
        });
      });
    }

    return {
      request_id: raw.request_id || request.request_id,
      document_id: request.document_id,
      service_mode: 'fastapi',
      document_type: {
        label: raw.document_type,
        confidence: raw.document_type_keyword_score || 0.9,
      },
      language: {
        label: raw.ocr_language_configured || 'en',
        confidence: 0.95,
      },
      extracted_fields: fields,
      anomalies,
      raw_ai_response: raw,
      warnings: [raw.disclaimer || 'Advisory screening only.'],
      processing_time_ms: Math.round((raw.processing_time_seconds || 0.5) * 1000),
    };
  }

  /**
   * Deterministic mock extractor fallback with full Schemas A - F
   */
  public generateMockAnalysis(request: AiDocumentAnalysisRequest): AiDocumentAnalysisResponse {
    const fields: AiExtractedField[] = [];
    const anomalies: AiAnomaly[] = [];
    const warnings: string[] = ['Simulated AI result — advisory screening aid.'];

    switch (request.document_category) {
      case DocumentCategory.AFFIDAVIT:
        fields.push(
          {
            field_name: 'document_title',
            value: 'AFFIDAVIT ON NON-JUDICIAL STAMP PAPER',
            confidence: 0.98,
            page_number: 1,
            evidence_text: 'BEFORE THE HON’BLE ALL INDIA COUNCIL FOR TECHNICAL EDUCATION',
            bounding_box: { x: 50, y: 60, width: 480, height: 35 },
          },
          {
            field_name: 'deponent_name',
            value: 'Dr. Arvind Patel',
            confidence: 0.94,
            page_number: 1,
            evidence_text: 'I, Dr. Arvind Patel, son of Shri Ramesh Patel, do hereby solemnly affirm...',
            bounding_box: { x: 70, y: 140, width: 440, height: 30 },
          },
          {
            field_name: 'institution_name',
            value: 'Apex Institute of Technology & Management',
            confidence: 0.96,
            page_number: 1,
            evidence_text: 'Chairman / Secretary, Apex Institute of Technology & Management, Pune',
            bounding_box: { x: 70, y: 190, width: 460, height: 32 },
          },
          {
            field_name: 'notary_registration',
            value: 'MH-9481/2022',
            confidence: 0.92,
            page_number: 3,
            evidence_text: 'Notary Public Seal & Registration No. MH-9481/2022',
            bounding_box: { x: 300, y: 650, width: 220, height: 40 },
          },
          {
            field_name: 'affidavit_stamp_no',
            value: 'MH-STAMP-2026-8819',
            confidence: 0.95,
            page_number: 1,
            evidence_text: 'Stamp Paper Serial No: MH-STAMP-2026-8819 (Val: Rs. 100)',
            bounding_box: { x: 60, y: 25, width: 380, height: 28 },
          }
        );
        break;

      case DocumentCategory.FIRE_SAFETY_CERTIFICATE:
        fields.push(
          {
            field_name: 'certificate_number',
            value: 'PMC/FB/NOC/2025/481',
            confidence: 0.95,
            page_number: 1,
            evidence_text: 'Certificate Ref No: PMC/FB/NOC/2025/481',
            bounding_box: { x: 60, y: 80, width: 320, height: 26 },
          },
          {
            field_name: 'institution_name',
            value: 'Apex Institute of Technology & Management',
            confidence: 0.96,
            page_number: 1,
            evidence_text: 'Issued to: Apex Institute of Technology & Management, Pune',
            bounding_box: { x: 60, y: 130, width: 460, height: 28 },
          },
          {
            field_name: 'fire_noc_validity',
            value: '2026-03-31',
            confidence: 0.93,
            page_number: 1,
            evidence_text: 'Valid up to: 31-03-2026',
            bounding_box: { x: 120, y: 380, width: 240, height: 24 },
          },
          {
            field_name: 'valid_until',
            value: '2026-03-31',
            confidence: 0.93,
            page_number: 1,
            evidence_text: 'Valid up to: 31-03-2026',
            bounding_box: { x: 120, y: 380, width: 240, height: 24 },
          }
        );
        anomalies.push({
          code: 'POSSIBLY_EXPIRED',
          severity: Severity.HIGH,
          title: 'Document Validity Date Has Passed',
          reason: 'The extracted validity date (31-03-2026) precedes the scrutiny cycle deadline.',
          page_number: 1,
          evidence_text: 'Valid up to: 31-03-2026',
          confidence: 0.93,
          requires_human_review: true,
        });
        break;

      case DocumentCategory.PREVIOUS_EOA:
        fields.push(
          {
            field_name: 'ai_approval_reference',
            value: 'F.No. Western/1-10142981/2025/EOA',
            confidence: 0.97,
            page_number: 1,
            evidence_text: 'Extension of Approval (EoA) for Academic Year 2025-26',
            bounding_box: { x: 60, y: 70, width: 440, height: 30 },
          },
          {
            field_name: 'institution_name',
            value: 'Apex Institute of Technology & Management',
            confidence: 0.98,
            page_number: 1,
            evidence_text: 'Name of the Institution: Apex Institute of Technology & Management',
            bounding_box: { x: 60, y: 110, width: 480, height: 28 },
          },
          {
            field_name: 'registered_address',
            value: 'Plot 42, Knowledge Park III, Pune, Maharashtra - 411057',
            confidence: 0.94,
            page_number: 1,
            evidence_text: 'Address: Plot 42, Knowledge Park III, Pune, Maharashtra - 411057',
            bounding_box: { x: 60, y: 150, width: 490, height: 28 },
          },
          {
            field_name: 'total_intake',
            value: '360',
            confidence: 0.95,
            page_number: 2,
            evidence_text: 'Total Approved Intake: 360 Seats',
            bounding_box: { x: 180, y: 410, width: 250, height: 26 },
          },
          {
            field_name: 'programme_cse',
            value: 'B.Tech Computer Science & Engineering (Intake: 120)',
            confidence: 0.96,
            page_number: 2,
            evidence_text: '1. Computer Science & Engineering | Level: UG | Approved Intake: 120',
            bounding_box: { x: 50, y: 220, width: 500, height: 26 },
          },
          {
            field_name: 'programme_ece',
            value: 'B.Tech Electronics & Communication Engineering (Intake: 60)',
            confidence: 0.94,
            page_number: 2,
            evidence_text: '2. Electronics & Communication Engineering | Level: UG | Approved Intake: 60',
            bounding_box: { x: 50, y: 250, width: 500, height: 26 },
          },
          {
            field_name: 'programme_me',
            value: 'B.Tech Mechanical Engineering (Intake: 60)',
            confidence: 0.93,
            page_number: 2,
            evidence_text: '3. Mechanical Engineering | Level: UG | Approved Intake: 60',
            bounding_box: { x: 50, y: 280, width: 500, height: 26 },
          },
          {
            field_name: 'programme_it',
            value: 'B.Tech Information Technology (Intake: 120)',
            confidence: 0.95,
            page_number: 2,
            evidence_text: '4. Information Technology | Level: UG | Approved Intake: 120',
            bounding_box: { x: 50, y: 310, width: 500, height: 26 },
          }
        );
        break;

      case DocumentCategory.BUILDING_STABILITY_CERTIFICATE:
        fields.push(
          {
            field_name: 'building_stability_no',
            value: 'PWD-STR-2025-942',
            confidence: 0.95,
            page_number: 1,
            evidence_text: 'Structural Fitness Certificate Ref: PWD-STR-2025-942',
            bounding_box: { x: 70, y: 90, width: 360, height: 28 },
          },
          {
            field_name: 'institution_name',
            value: 'Apex Institute of Technology & Management',
            confidence: 0.96,
            page_number: 1,
            evidence_text: 'Institutional Premises: Apex Institute of Technology & Management, Pune',
            bounding_box: { x: 70, y: 135, width: 460, height: 28 },
          },
          {
            field_name: 'valid_until',
            value: '2028-06-30',
            confidence: 0.92,
            page_number: 1,
            evidence_text: 'Fitness Certified Period: Up to 30-06-2028',
            bounding_box: { x: 100, y: 260, width: 280, height: 24 },
          }
        );
        break;

      case DocumentCategory.FACULTY_LIST_EVIDENCE:
        fields.push(
          {
            field_name: 'faculty_count',
            value: '92',
            confidence: 0.94,
            page_number: 1,
            evidence_text: 'Total Regular Teaching Faculty on Muster Roll: 92',
            bounding_box: { x: 80, y: 100, width: 380, height: 26 },
          },
          {
            field_name: 'cadre_professors',
            value: '12 Professors',
            confidence: 0.91,
            page_number: 1,
            evidence_text: 'Professors: 12, Associate Professors: 24, Assistant Professors: 56',
            bounding_box: { x: 80, y: 140, width: 440, height: 26 },
          }
        );
        break;

      case DocumentCategory.INFRASTRUCTURE_PLAN:
        fields.push(
          {
            field_name: 'land_area',
            value: '5.2 Acres',
            confidence: 0.96,
            page_number: 1,
            evidence_text: 'Total Contiguous Campus Land Area: 5.2 Acres (21,043.6 Sq. Meters)',
            bounding_box: { x: 80, y: 110, width: 460, height: 28 },
          },
          {
            field_name: 'built_up_area',
            value: '18,500 Sq. Meters',
            confidence: 0.93,
            page_number: 1,
            evidence_text: 'Total Approved Built-up Carpet Area: 18,500 Sq. Mtr.',
            bounding_box: { x: 80, y: 150, width: 420, height: 28 },
          }
        );
        break;

      default:
        fields.push({
          field_name: 'document_category_classified',
          value: request.document_category,
          confidence: 0.89,
          page_number: 1,
          evidence_text: `Classified as ${request.document_category} by simulated screening adapter.`,
          bounding_box: { x: 50, y: 80, width: 400, height: 30 },
        });
    }

    return {
      request_id: request.request_id,
      document_id: request.document_id,
      service_mode: 'mock',
      document_type: {
        label: request.document_category,
        confidence: 0.93,
      },
      language: {
        label: request.language_hint || 'en',
        confidence: 0.96,
      },
      extracted_fields: fields,
      anomalies,
      warnings,
      processing_time_ms: Math.floor(Math.random() * 300) + 200,
    };
  }
}

export const aiServiceClient = new AiServiceClient();
