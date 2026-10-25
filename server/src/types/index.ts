import { Role, ApplicationCategory, ApplicationStatus, DocumentCategory, Severity, FindingStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionId?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId?: string;
    details?: any[];
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Request parameters passed from controller to AiServiceClient
export interface AiDocumentAnalysisRequest {
  request_id: string;
  application_id: string;
  document_id: string;
  document_category: DocumentCategory;
  language_hint?: string;
  file_name: string;
  content_sha256: string;
  file_reference: string;
  file_path?: string;
  mime_type?: string;
}

// Exact Python AI service schema from verifyai_service.py
export interface VerifyAiFinding {
  code: string;
  severity: string; // "info", "low", "medium", "high"
  message: string;
  evidence?: string | null;
  recommendation?: string | null;
}

export interface VerifyAiAnalysisResponse {
  request_id: string;
  filename: string;
  sha256: string;
  document_type: string;
  document_type_keyword_score?: number;
  extracted_text: string;
  extracted_fields: {
    dates?: string[];
    emails?: string[];
    phone_numbers?: string[];
    postal_codes?: string[];
    reference_numbers?: Array<{ label: string; value: string }>;
    name_or_entity_line_candidates?: string[];
  };
  page_count: number;
  findings: VerifyAiFinding[];
  review_required: boolean;
  authenticity_status: string;
  pdf_metadata?: Record<string, any>;
  ocr_language_configured?: string;
  processing_time_seconds?: number;
  disclaimer: string;
}

// Normalized UI-ready analysis result
export interface AiExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  page_number: number;
  evidence_text?: string;
}

export interface AiAnomaly {
  code: string;
  severity: Severity;
  title: string;
  reason: string;
  page_number?: number;
  evidence_text?: string | null;
  confidence: number;
  requires_human_review: boolean;
}

export interface AiDocumentAnalysisResponse {
  request_id: string;
  document_id: string;
  service_mode: 'mock' | 'fastapi';
  document_type: {
    label: string;
    confidence: number;
  };
  language: {
    label: string;
    confidence: number;
  };
  extracted_fields: AiExtractedField[];
  anomalies: AiAnomaly[];
  raw_ai_response?: VerifyAiAnalysisResponse;
  warnings: string[];
  processing_time_ms: number;
}
