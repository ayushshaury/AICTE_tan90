const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  public code: string;
  public details?: any[];
  public status: number;

  constructor(message: string, status: number, code = 'API_ERROR', details?: any[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('aicte_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errData: any = {};
    try {
      errData = await response.json();
    } catch {
      // Body not JSON
    }
    const message = errData?.error?.message || response.statusText || 'Request failed';
    const code = errData?.error?.code || 'HTTP_ERROR';
    const details = errData?.error?.details;
    throw new ApiError(message, response.status, code, details);
  }

  // Handle blob responses (e.g. CSV exports)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as any;
  }

  const resJson = await response.json();
  return resJson.data !== undefined ? resJson.data : resJson;
}

export const api = {
  // Auth
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Dashboard
  getDashboardSummary: () => apiRequest('/dashboard/summary'),
  getDashboardTrends: () => apiRequest('/dashboard/trends'),
  getAttentionQueue: () => apiRequest('/dashboard/attention-queue'),

  // Institutions
  getInstitutions: () => apiRequest('/institutions'),
  getInstitution: (id: string) => apiRequest(`/institutions/${id}`),

  // Applications
  getApplications: (params: string = '') => apiRequest(`/applications?${params}`),
  getApplication: (id: string) => apiRequest(`/applications/${id}`),
  createApplication: (data: any) => apiRequest('/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id: string, data: any) => apiRequest(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  submitApplication: (id: string) => apiRequest(`/applications/${id}/submit`, { method: 'POST' }),
  assignOfficer: (id: string, officerId: string) => apiRequest(`/applications/${id}/assign`, { method: 'POST', body: JSON.stringify({ officerId }) }),
  transitionStatus: (id: string, targetStatus: string, reason: string) =>
    apiRequest(`/applications/${id}/transition`, { method: 'POST', body: JSON.stringify({ targetStatus, reason }) }),
  triggerValidation: (id: string) => apiRequest(`/applications/${id}/validate`, { method: 'POST' }),
  getApplicationActivity: (id: string) => apiRequest(`/applications/${id}/activity`),
  getApplicationReport: (id: string) => apiRequest(`/applications/${id}/report`),
  comparePreviousEoa: (id: string) => apiRequest(`/applications/${id}/compare-previous-eoa`, { method: 'POST' }),
  getComparison: (id: string) => apiRequest(`/applications/${id}/comparison`),
  getVerificationChecklist: (id: string, params: string = '') => apiRequest(`/applications/${id}/verification-checklist?${params}`),
  reviewVerificationItem: (itemId: string, data: { reviewStatus: string; officerComments?: string }) =>
    apiRequest(`/verification-items/${itemId}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
  getClarificationRequests: (id: string) => apiRequest(`/applications/${id}/clarification-requests`),
  createClarificationRequest: (id: string, data: any) =>
    apiRequest(`/applications/${id}/clarification-requests`, { method: 'POST', body: JSON.stringify(data) }),
  respondClarificationRequest: (reqId: string, data: any) =>
    apiRequest(`/clarification-requests/${reqId}/respond`, { method: 'PATCH', body: JSON.stringify(data) }),
  getApplicationAuditTrail: (id: string) => apiRequest(`/applications/${id}/audit-trail`),

  // Documents
  getDocuments: (applicationId: string) => apiRequest(`/applications/${applicationId}/documents`),
  uploadDocument: (applicationId: string, formData: FormData) =>
    apiRequest(`/applications/${applicationId}/documents`, { method: 'POST', body: formData }),
  getDocument: (docId: string) => apiRequest(`/documents/${docId}`),
  deleteDocument: (docId: string) => apiRequest(`/documents/${docId}`, { method: 'DELETE' }),
  analyzeDocument: (docId: string) => apiRequest(`/documents/${docId}/analyze`, { method: 'POST' }),
  getDocumentAnalysis: (docId: string) => apiRequest(`/documents/${docId}/analysis`),
  updateExtractedField: (docId: string, fieldId: string, data: any) =>
    apiRequest(`/documents/${docId}/fields/${fieldId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Findings
  getFindings: (applicationId: string) => apiRequest(`/applications/${applicationId}/findings`),
  reviewFinding: (findingId: string, status: string, reviewReason: string) =>
    apiRequest(`/findings/${findingId}/review`, { method: 'POST', body: JSON.stringify({ status, reviewReason }) }),
  resolveFinding: (findingId: string, resolutionNotes: string) =>
    apiRequest(`/findings/${findingId}/resolve`, { method: 'POST', body: JSON.stringify({ resolutionNotes }) }),

  // Verifications
  getVerifications: () => apiRequest('/verifications'),
  verifyDocument: (docId: string, data: any) =>
    apiRequest(`/documents/${docId}/verifications`, { method: 'POST', body: JSON.stringify(data) }),

  // Rules
  getRules: () => apiRequest('/rules'),
  createRule: (data: any) => apiRequest('/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (ruleId: string, data: any) => apiRequest(`/rules/${ruleId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Audit
  getAuditEvents: (params: string = '') => apiRequest(`/audit?${params}`),

  // File Download / Streaming URL builder with authentication query token
  getDocumentFileUrl: (docId: string) => {
    const token = localStorage.getItem('aicte_token');
    return `${API_BASE}/documents/${docId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};
