export type Role = 'APPLICANT' | 'OFFICER' | 'SENIOR_REVIEWER' | 'ADMIN' | 'DEMO_VIEWER';

export type ApplicationCategory =
  | 'EOA'
  | 'NEW_PROGRAMME'
  | 'INTAKE_CHANGE'
  | 'INSTITUTION_DETAIL_CHANGE'
  | 'OTHER';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'UNDER_SCRUTINY'
  | 'ACTION_REQUIRED'
  | 'RESUBMITTED'
  | 'ESCALATED'
  | 'COMPLETED_IN_PROTOTYPE';

export type DocumentCategory =
  | 'AFFIDAVIT'
  | 'ACCREDITATION_CERTIFICATE'
  | 'NOC_LAND_USE'
  | 'FACULTY_LIST_EVIDENCE'
  | 'INFRASTRUCTURE_PLAN'
  | 'PREVIOUS_EOA'
  | 'TER_FEE_RECEIPT'
  | 'FIRE_SAFETY_CERTIFICATE'
  | 'BUILDING_STABILITY_CERTIFICATE'
  | 'OTHER_SUPPORTING';

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'DISMISSED'
  | 'RESOLVED'
  | 'NEEDS_MORE_EVIDENCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionId?: string | null;
  institution?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface Institution {
  id: string;
  institutionCode: string;
  name: string;
  institutionType: string;
  address: string;
  state: string;
}

export interface DocumentItem {
  id: string;
  applicationId: string;
  uploadedById: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  category: DocumentCategory;
  processingStatus: string;
  verificationStatus: string;
  reviewStatus: string;
  pageCount?: number | null;
  languageHint?: string | null;
  ocrRawText?: string | null;
  ocrConfidence?: number | null;
  createdAt: string;
  extractedFields?: ExtractedField[];
}

export interface ExtractedField {
  id: string;
  documentId: string;
  fieldName: string;
  valueText: string | null;
  normalizedValue?: string | null;
  confidence?: number | null;
  pageNumber?: number | null;
  evidenceText?: string | null;
  source: 'AI' | 'MANUAL';
  reviewStatus: string;
}

export interface Finding {
  id: string;
  applicationId: string;
  documentId?: string | null;
  findingCode: string;
  title: string;
  description: string;
  severity: Severity;
  status: FindingStatus;
  evidenceJson?: any;
  confidence?: number | null;
  recommendedAction: string;
  reviewer?: { id: string; name: string } | null;
  reviewReason?: string | null;
  createdAt: string;
  document?: {
    id: string;
    originalFilename: string;
    category: DocumentCategory;
    storageKey: string;
  } | null;
}

export interface VerificationItem {
  id: string;
  applicationId: string;
  documentId?: string | null;
  category: string;
  fieldRequirement: string;
  fieldName: string;
  extractedValue?: string | null;
  normalizedValue?: string | null;
  previousEoaValue?: string | null;
  currentApplicationValue?: string | null;
  comparisonResult: string; // 'CONSISTENT' | 'CHANGED_VERIFY' | 'NEW_ADDITION' | 'REMOVED_VERIFY' | 'INCONSISTENT_VERIFY' | 'POTENTIALLY_EXPIRED' | 'UNABLE_TO_EXTRACT' | 'NOT_APPLICABLE' | 'NO_PREVIOUS_RECORD'
  warningReason?: string | null;
  recommendedAction?: string | null;
  pageNumber?: number | null;
  evidenceSnippet?: string | null;
  boundingBoxJson?: any;
  confidence?: number | null;
  conditionType: string;
  reviewStatus: string; // 'PENDING_REVIEW' | 'CONSISTENT' | 'CHANGED_VERIFY' | 'MISSING_VERIFY' | 'INCONSISTENT_VERIFY' | 'POTENTIALLY_EXPIRED' | 'UNABLE_TO_EXTRACT' | 'VERIFIED_BY_OFFICER' | 'CLARIFICATION_REQUESTED' | 'RESOLVED'
  officerComments?: string | null;
  reviewedById?: string | null;
  reviewedBy?: { id: string; name: string; role: string; email?: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  document?: DocumentItem | null;
  clarificationRequests?: ClarificationRequest[];
}

export interface ClarificationRequest {
  id: string;
  applicationId: string;
  verificationItemId?: string | null;
  requestedById: string;
  requestedBy?: { id: string; name: string; role: string };
  subject: string;
  queryText: string;
  deadline?: string | null;
  status: 'OPEN' | 'RESPONDED' | 'RESOLVED' | 'CLOSED';
  responseNotes?: string | null;
  responseDocumentId?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  verificationItem?: VerificationItem | null;
}

export interface ComparisonSummary {
  status: 'AVAILABLE' | 'UNAVAILABLE';
  message: string;
  previousApplicationId: string | null;
  previousAcademicYear: string | null;
  previousReferenceNumber: string | null;
  currentApplicationId: string;
  currentAcademicYear: string;
  currentReferenceNumber: string;
  institutionName: string;
  institutionCode: string;
  totalItems: number;
  consistentCount: number;
  changedCount: number;
  addedCount: number;
  removedCount: number;
  inconsistentCount: number;
  expiredCount: number;
  unableToExtractCount: number;
  pendingReviewCount: number;
  verifiedCount: number;
}

export interface ComparisonReport {
  summary: ComparisonSummary;
  items: VerificationItem[];
}

export interface Application {
  id: string;
  referenceNumber: string;
  institutionId: string;
  category: ApplicationCategory;
  academicYear: string;
  status: ApplicationStatus;
  submissionNotes?: string | null;
  submittedAt?: string | null;
  previousApplicationId?: string | null;
  previousEoaReference?: string | null;
  previousAcademicYear?: string | null;
  createdAt: string;
  updatedAt: string;
  institution: Institution;
  assignedOfficer?: { id: string; name: string; email: string } | null;
  _count?: {
    documents: number;
    findings: number;
  };
  documents?: DocumentItem[];
  findings?: Finding[];
  sourceVerifications?: any[];
  validationRuns?: any[];
  verificationItems?: VerificationItem[];
  clarificationRequests?: ClarificationRequest[];
}

