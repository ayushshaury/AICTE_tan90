import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Application, Finding, ExtractedField, DocumentCategory } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  Cpu,
  Eye,
  Trash2,
  Edit3,
  RefreshCw,
  RotateCw,
  Info,
  Clock,
  UserCheck,
  Send,
  ExternalLink,
  GitCompare,
} from 'lucide-react';
import { EoaComparisonDesk } from '../components/EoaComparisonDesk';
import type { ComparisonReport } from '../types';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isHindi } = useLanguage();

  const tabParam = searchParams.get('tab');
  const resolvedTab = (tabParam === 'comparison' || tabParam === 'previous-eoa')
    ? 'comparison'
    : (['overview', 'documents', 'extracted', 'findings', 'verification', 'activity'].includes(tabParam || '') ? (tabParam as any) : 'overview');

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'documents' | 'extracted' | 'findings' | 'verification' | 'activity'>(resolvedTab);
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'comparison' || tab === 'previous-eoa') {
      setActiveTab('comparison');
    } else if (tab && ['overview', 'documents', 'extracted', 'findings', 'verification', 'activity'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Modals & Action States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('AFFIDAVIT');
  const [uploading, setUploading] = useState(false);

  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [transitioning, setTransitioning] = useState(false);

  const [reviewFindingModalOpen, setReviewFindingModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [reviewStatusChoice, setReviewStatusChoice] = useState<'CONFIRMED' | 'DISMISSED' | 'NEEDS_MORE_EVIDENCE'>('CONFIRMED');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [reviewingFinding, setReviewingFinding] = useState(false);

  const [editFieldModalOpen, setEditFieldModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(null);
  const [editFieldValue, setEditFieldValue] = useState<string>('');
  const [savingField, setSavingField] = useState(false);

  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrModalContent, setOcrModalContent] = useState('');
  const [ocrModalFilename, setOcrModalFilename] = useState('');
  const [fieldFilterDocId, setFieldFilterDocId] = useState<string>('ALL');

  const [aiAnalyzingDocId, setAiAnalyzingDocId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const fetchApplication = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getApplication(id);
      setApplication(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load application workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    if (!id) return;
    setLoadingComparison(true);
    try {
      const data = await api.getComparison(id);
      setComparisonReport(data);
    } catch (err) {
      console.warn('Could not fetch comparison report:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    fetchApplication();
    fetchComparison();
  }, [id]);

  // Document Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('category', uploadCategory);

    try {
      await api.uploadDocument(id, formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      await fetchApplication();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Run AI Analysis on Document
  const handleAnalyzeDocument = async (docId: string) => {
    setAiAnalyzingDocId(docId);
    try {
      await api.analyzeDocument(docId);
      await fetchApplication();
    } catch (err: any) {
      alert(`AI analysis note: ${err.message}`);
    } finally {
      setAiAnalyzingDocId(null);
    }
  };

  // Trigger Compliance Validation Run
  const handleRunValidation = async () => {
    if (!id) return;
    setValidating(true);
    try {
      await api.triggerValidation(id);
      await fetchApplication();
      setActiveTab('findings');
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  // Submit Application
  const handleSubmitApplication = async () => {
    if (!id || !confirm('Are you sure you want to formally submit this application for preliminary scrutiny?')) return;
    try {
      await api.submitApplication(id);
      await fetchApplication();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  // Workflow State Transition
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !targetStatus) return;

    setTransitioning(true);
    try {
      await api.transitionStatus(id, targetStatus, transitionReason);
      setTransitionModalOpen(false);
      setTransitionReason('');
      await fetchApplication();
    } catch (err: any) {
      alert(`Transition failed: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  // Finding Review (Confirm/Dismiss with reason)
  const handleReviewFindingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setReviewingFinding(true);
    try {
      await api.reviewFinding(selectedFinding.id, reviewStatusChoice, reviewReason);
      setReviewFindingModalOpen(false);
      setSelectedFinding(null);
      setReviewReason('');
      await fetchApplication();
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setReviewingFinding(false);
    }
  };

  // Edit Extracted Field
  const handleEditFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;

    setSavingField(true);
    try {
      await api.updateExtractedField(selectedField.documentId, selectedField.id, {
        valueText: editFieldValue,
        reviewStatus: 'MODIFIED',
      });
      setEditFieldModalOpen(false);
      setSelectedField(null);
      await fetchApplication();
    } catch (err: any) {
      alert(`Field update failed: ${err.message}`);
    } finally {
      setSavingField(false);
    }
  };

  // Soft Delete Document
  const handleDeleteDocument = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to remove "${filename}" from this application?`)) return;
    try {
      await api.deleteDocument(docId);
      await fetchApplication();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Opening Application Workspace...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="font-bold">Failed to load application</h3>
        <p className="text-xs text-rose-700 mt-1">{error || 'Record does not exist or access forbidden.'}</p>
        <Link to="/applications" className="inline-block mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold">
          Return to Registry
        </Link>
      </div>
    );
  }

  const isApplicant = user?.role === 'APPLICANT';
  const isOfficerOrAdmin = user?.role === 'OFFICER' || user?.role === 'SENIOR_REVIEWER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs: Official Government Dossier */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4 relative overflow-hidden">
        {/* Subtle Top Tricolor Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-[#FFFFFF]" />
          <div className="w-1/3 bg-[#138808]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link to="/applications" className="hover:underline font-medium text-[#002147]">Application Registry</Link>
              <span>/</span>
              <span className="font-mono text-[#002147] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                DOCKET: {application.referenceNumber}
              </span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF9933] font-mono flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
              <span>{isHindi ? 'संस्थागत संवीक्षा मिसिल (Institutional Compliance Dossier)' : 'INSTITUTIONAL COMPLIANCE DOSSIER'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147] mt-0.5">
              {application.institution.name}
            </h1>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
              <span>Code: <strong className="font-mono text-[#002147] bg-slate-100 px-1.5 py-0.5 rounded">{application.institution.institutionCode}</strong></span>
              <span>•</span>
              <span>Type: <strong>{application.institution.institutionType}</strong></span>
              <span>•</span>
              <span>State: <strong>{application.institution.state}</strong></span>
              <span>•</span>
              <span>Session: <strong className="text-[#002147]">{application.academicYear}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-[#002147]">{application.category.replace(/_/g, ' ')}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={application.status} size="md" />

            {/* Validation Trigger */}
            <button
              onClick={handleRunValidation}
              disabled={validating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50 border border-amber-500/30"
              title="Evaluate APH 2026-27 heuristic rules"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>{validating ? 'Evaluating...' : 'Evaluate Rules (APH)'}</span>
            </button>

            {/* Applicant Submit Draft Action */}
            {isApplicant && (application.status === 'DRAFT' || application.status === 'ACTION_REQUIRED') && (
              <button
                onClick={handleSubmitApplication}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#E65100] hover:bg-[#BF360C] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Dossier</span>
              </button>
            )}

            {/* Officer Workflow Transition Button */}
            {isOfficerOrAdmin && (
              <button
                onClick={() => setTransitionModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-[#002147] rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 transition-colors shadow-2xs"
                title="Transition regulatory status"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#002147]" />
                <span>Advance Workflow</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-200 pt-3 flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { key: 'overview', label: 'Dossier Overview', icon: FileText },
            {
              key: 'comparison',
              label: `Previous EoA Comparison (${comparisonReport?.summary?.totalItems ?? 0})`,
              icon: GitCompare,
            },
            { key: 'documents', label: `Documents Desk (${application.documents?.length ?? 0})`, icon: Upload },
            { key: 'extracted', label: 'Extracted OCR Fields', icon: Cpu },
            { key: 'findings', label: `Compliance Findings (${application.findings?.length ?? 0})`, icon: AlertTriangle },
            { key: 'verification', label: `Source Verification (${application.sourceVerifications?.length ?? 0})`, icon: ShieldCheck },
            { key: 'activity', label: 'Audit Timeline', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setSearchParams({ tab: tab.key });
                }}
                className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#002147] text-white shadow-sm border-b-2 border-[#FF9933]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: PREVIOUS EOA COMPARISON & OFFICER VERIFICATION */}
      {activeTab === 'comparison' && (
        <EoaComparisonDesk
          applicationId={application.id}
          isOfficer={user?.role === 'OFFICER' || user?.role === 'SENIOR_REVIEWER' || user?.role === 'ADMIN'}
          onRefresh={() => {
            fetchApplication();
            fetchComparison();
          }}
          report={comparisonReport}
          loading={loadingComparison}
        />
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Application Briefing
              </h3>
              <div className="text-sm text-slate-700 leading-relaxed">
                {application.submissionNotes || (
                  <span className="text-slate-400 italic">No submission remarks provided by applicant.</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Created On:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(application.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Submission Date:</span>
                  <span className="font-semibold text-slate-800">
                    {application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'Not formally submitted'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Scrutiny Officer:</span>
                  <span className="font-semibold text-sky-800">
                    {application.assignedOfficer?.name || 'Pending assignment'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Officer Email:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {application.assignedOfficer?.email || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist & Readiness */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Scrutiny Checklist Status
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 font-medium">1. Mandatory Regulatory Affidavit</span>
                  {application.documents?.some(d => d.category === 'AFFIDAVIT') ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Missing</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 font-medium">2. Previous Session EoA Letter</span>
                  {application.documents?.some(d => d.category === 'PREVIOUS_EOA') ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Pending / Not Found</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 font-medium">3. Unresolved High Priority Findings</span>
                  {application.findings?.filter(f => f.status === 'OPEN' && (f.severity === 'CRITICAL' || f.severity === 'HIGH')).length === 0 ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Clean</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>
                        {application.findings?.filter(f => f.status === 'OPEN' && (f.severity === 'CRITICAL' || f.severity === 'HIGH')).length} Issues
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail: Official Government Memo & Gazette Cards */}
          <div className="space-y-6">
            <div className="bg-[#002147] text-white p-6 rounded-xl border border-amber-500/30 shadow-md space-y-4 relative overflow-hidden">
              <div className="flex items-center space-x-2 border-b border-slate-700/80 pb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {isHindi ? 'संवीक्षा समिति विनियामक आदेश (Regulatory Decision Notice)' : 'REGULATORY DECISION NOTICE'}
                </h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                In strict compliance with the <strong>AICTE Approval Process Handbook (APH 2026-27)</strong>, automated AI scrutiny outputs serve strictly as advisory evidence. Formal regulatory sanctions, deficiencies, and approvals require designated scrutiny officer review.
              </p>
              <div className="pt-3 border-t border-slate-700/80 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Compliance Engine:</span>
                <strong className="font-mono text-amber-300">APH 2026-27 (Statutory)</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#002147] uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#E65100]" />
                <h4>Consolidated Scrutiny Gazette Report</h4>
              </div>
              <p className="text-xs text-slate-600">
                Generate the official AICTE Scrutiny Dossier Summary containing document checksums, finding justifications, and officer signatures.
              </p>
              <a
                href={`http://localhost:4000/api/v1/applications/${application.id}/report`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex justify-center items-center space-x-1.5 py-2 px-3 bg-[#002147] hover:bg-[#081526] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
              >
                <span>Download Official Gazette Report (JSON)</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Submitted Compliance Documents</h2>
              <p className="text-xs text-slate-500">
                Upload PDFs or high-resolution certificates. Files are privately stored and hashed with SHA-256.
              </p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size & Checksum</th>
                    <th className="py-3 px-4">AI Extraction Status</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {application.documents && application.documents.length > 0 ? (
                    application.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                            <span>{doc.originalFilename}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          <div>{doc.category.replace(/_/g, ' ')}</div>
                          {doc.pageCount && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}
                            </div>
                          )}
                          {(() => {
                            const detected = doc.extractedFields?.find(f => f.fieldName === 'DOCUMENT_CLASSIFICATION');
                            if (detected?.valueText) {
                              return (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-mono">
                                  AI: {detected.valueText.replace(/_/g, ' ')}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          <div>{(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
                          <div className="font-mono text-[10px] text-slate-400" title={doc.sha256}>
                            SHA: {doc.sha256.substring(0, 12)}...
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={doc.processingStatus} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={doc.verificationStatus} />
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {/* Stream preview link */}
                          <a
                            href={api.getDocumentFileUrl(doc.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#002147]/5 hover:bg-[#002147]/15 text-[#002147] text-xs font-bold transition-colors border border-[#002147]/20 shadow-xs"
                            title="Open Original Uploaded PDF Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View PDF</span>
                          </a>

                          {/* Raw OCR Text Viewer Button */}
                          {(() => {
                            const ocrField = doc.extractedFields?.find(
                              f => f.fieldName === 'OCR_FULL_TEXT_PREVIEW' || f.fieldName === 'OCR_SAMPLE_PREVIEW'
                            );
                            if (ocrField?.valueText) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOcrModalFilename(doc.originalFilename);
                                    setOcrModalContent(ocrField.valueText || '');
                                    setOcrModalOpen(true);
                                  }}
                                  className="inline-flex items-center p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
                                  title="View Raw OCR Extracted Text"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              );
                            }
                            return null;
                          })()}

                          {/* Trigger / Retry AI Scrutiny */}
                          <button
                            onClick={() => handleAnalyzeDocument(doc.id)}
                            disabled={aiAnalyzingDocId === doc.id || doc.processingStatus === 'PROCESSING'}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                              doc.processingStatus === 'FAILED'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                : doc.processingStatus === 'SUCCEEDED' || doc.processingStatus === 'REQUIRES_REVIEW'
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                            }`}
                            title={
                              doc.processingStatus === 'FAILED'
                                ? 'Retry AI document extraction & scrutiny'
                                : 'Run AI document extraction & scrutiny'
                            }
                          >
                            {aiAnalyzingDocId === doc.id || doc.processingStatus === 'PROCESSING' ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Analyzing...</span>
                              </>
                            ) : doc.processingStatus === 'FAILED' ? (
                              <>
                                <RotateCw className="w-3.5 h-3.5 text-rose-600" />
                                <span>Retry Scrutiny</span>
                              </>
                            ) : doc.processingStatus === 'SUCCEEDED' || doc.processingStatus === 'REQUIRES_REVIEW' ? (
                              <>
                                <Cpu className="w-3.5 h-3.5" />
                                <span>Re-analyze</span>
                              </>
                            ) : (
                              <>
                                <Cpu className="w-3.5 h-3.5" />
                                <span>AI Scrutiny</span>
                              </>
                            )}
                          </button>

                          {/* Delete Document */}
                          {(application.status === 'DRAFT' || application.status === 'ACTION_REQUIRED' || user?.role === 'ADMIN') && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.originalFilename)}
                              className="inline-flex items-center p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs italic">
                        No documents uploaded for this application yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXTRACTED FIELDS */}
      {activeTab === 'extracted' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Extracted Document Data & OCR Metadata</h2>
              <p className="text-xs text-slate-500">
                Structured parameters parsed from uploaded certificates and undertakings by the AI scrutiny adapter.
              </p>
            </div>
            {application.documents && application.documents.length > 1 && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Filter Document:</span>
                <select
                  value={fieldFilterDocId}
                  onChange={(e) => setFieldFilterDocId(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Documents ({application.documents.length})</option>
                  {application.documents.map(d => (
                    <option key={d.id} value={d.id}>{d.originalFilename}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Field Name</th>
                    <th className="py-3 px-4">Extracted Value</th>
                    <th className="py-3 px-4">Page & Confidence</th>
                    <th className="py-3 px-4">Evidence Excerpt</th>
                    <th className="py-3 px-4">Review State</th>
                    {isOfficerOrAdmin && <th className="py-3 px-4 text-right">Correct</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    const allFields = application.documents?.flatMap(d =>
                      (d.extractedFields || []).map(f => ({ ...f, docFilename: d.originalFilename }))
                    ) || [];
                    const filteredFields = fieldFilterDocId === 'ALL'
                      ? allFields
                      : allFields.filter(f => f.documentId === fieldFilterDocId);

                    if (filteredFields.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 text-xs italic">
                            No fields extracted yet. Click "AI Scrutiny" on documents in the Documents tab.
                          </td>
                        </tr>
                      );
                    }

                    return filteredFields.map((field) => (
                      <tr key={field.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700 max-w-[150px] truncate" title={field.docFilename}>
                          <div className="flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{field.docFilename}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 text-xs">
                          {field.fieldName}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 text-xs">
                          {field.fieldName === 'OCR_FULL_TEXT_PREVIEW' || field.fieldName === 'OCR_SAMPLE_PREVIEW' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOcrModalFilename(field.docFilename);
                                setOcrModalContent(field.valueText || '');
                                setOcrModalOpen(true);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View Raw OCR Text ({field.valueText?.length || 0} chars)</span>
                            </button>
                          ) : (
                            field.valueText || <span className="text-slate-400 italic">null</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          <div>Page {field.pageNumber ?? 1}</div>
                          {field.confidence && (
                            <div className="text-[11px] font-semibold text-emerald-600">
                              {(field.confidence * 100).toFixed(0)}% confidence
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate" title={field.evidenceText || ''}>
                          "{field.evidenceText || 'N/A'}"
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={field.reviewStatus} />
                        </td>
                        {isOfficerOrAdmin && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedField(field);
                                setEditFieldValue(field.valueText || '');
                                setEditFieldModalOpen(true);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINDINGS */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Notice to Scrutiny Committee:</strong> Automated findings are preliminary and require authorized human review. They are not a final determination of forgery or regulatory non-compliance.
            </div>
          </div>

          <div className="space-y-3">
            {application.findings && application.findings.length > 0 ? (
              application.findings.map((f) => (
                <div
                  key={f.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <span className="font-mono text-xs text-slate-400">{f.findingCode}</span>
                      <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                      {f.documentId && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-mono">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>
                            {application.documents?.find(d => d.id === f.documentId)?.originalFilename || 'Document Attachment'}
                          </span>
                        </span>
                      )}
                    </div>
                    <div>
                      <StatusBadge status={f.status} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{f.description}</p>

                  {/* Evidence Excerpt Box */}
                  {f.evidenceJson && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Supporting Evidence Reference:
                      </div>
                      <pre className="font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(f.evidenceJson, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 text-xs gap-3">
                    <div className="text-slate-600">
                      <strong>Recommended Action:</strong> {f.recommendedAction}
                    </div>

                    {isOfficerOrAdmin && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedFinding(f);
                            setReviewStatusChoice('CONFIRMED');
                            setReviewFindingModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                        >
                          Review Finding
                        </button>
                      </div>
                    )}
                  </div>

                  {f.reviewReason && (
                    <div className="p-2.5 bg-sky-50 border border-sky-100 rounded text-xs text-sky-900">
                      <strong>Officer Review Note ({f.reviewer?.name || 'Reviewer'}):</strong> {f.reviewReason}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Regulatory Findings</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Evaluate Rules" above to run the deterministic compliance engine against uploaded certificates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SOURCE VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Independent Source Verification</h2>
              <p className="text-xs text-slate-500">
                Cross-reference certificates with affiliating universities, state authorities, and statutory portals.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {application.sourceVerifications && application.sourceVerifications.length > 0 ? (
              application.sourceVerifications.map((v: any) => (
                <div key={v.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{v.issuerName}</h4>
                      <div className="text-xs text-slate-500">Method: {v.verificationMethod}</div>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>

                  <p className="text-xs text-slate-700">{v.resultSummary}</p>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs font-mono text-slate-600">
                    <div>Request Reference: {v.referenceNumber || 'N/A'}</div>
                    <div>Recorded: {new Date(v.createdAt).toLocaleString()}</div>
                    <div>Channel: Statutory Verification Gateway ({v.providerMode || 'DIRECT'})</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Verifications Conducted</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Source verification results will appear here once initiated for uploaded certificates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Immutable Audit Timeline</h2>
          <p className="text-xs text-slate-500">
            Cryptographically logged record of all user, officer, AI, and workflow actions on this application.
          </p>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 pt-2">
            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-sky-600 border-2 border-white ring-2 ring-sky-200" />
              <div className="text-xs font-bold text-slate-900">Current Application State: {application.status}</div>
              <div className="text-[11px] text-slate-400">Last updated: {new Date(application.updatedAt).toLocaleString()}</div>
            </div>

            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
              <div className="text-xs font-bold text-slate-900">Application Initialized in Registry</div>
              <div className="text-[11px] text-slate-400">Created: {new Date(application.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT UPLOAD */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Supporting Document"
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="AFFIDAVIT">Regulatory Affidavit / Undertaking</option>
              <option value="ACCREDITATION_CERTIFICATE">NBA / NAAC Accreditation Certificate</option>
              <option value="FIRE_SAFETY_CERTIFICATE">Municipal Fire Safety Certificate / NOC</option>
              <option value="BUILDING_STABILITY_CERTIFICATE">Structural Building Stability Certificate</option>
              <option value="PREVIOUS_EOA">Previous Academic Session EoA Letter</option>
              <option value="FACULTY_LIST_EVIDENCE">Faculty Cadre Ratio & Muster Evidence</option>
              <option value="INFRASTRUCTURE_PLAN">Architectural Master Building & Floor Plan</option>
              <option value="NOC_LAND_USE">Government Land Use & Title NOC</option>
              <option value="TER_FEE_RECEIPT">TER / Processing Fee Payment Receipt</option>
              <option value="OTHER_SUPPORTING">Other Supporting Regulatory Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Document File (PDF, JPEG, PNG)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Maximum file size: 20MB. Checksum calculated immediately upon upload.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {uploading ? 'Encrypting & Storing...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: WORKFLOW STATE TRANSITION */}
      <Modal
        isOpen={transitionModalOpen}
        onClose={() => setTransitionModalOpen(false)}
        title="Advance Scrutiny Workflow Status"
      >
        <form onSubmit={handleTransitionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Target Status
            </label>
            <select
              value={targetStatus}
              required
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Select Target Workflow Stage...</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny (Active Officer Review)</option>
              <option value="ACTION_REQUIRED">Action Required (Request Applicant Correction)</option>
              <option value="ESCALATED">Escalated (Senior Authority Verification)</option>
              <option value="COMPLETED_IN_PROTOTYPE">Completed in Prototype (Preliminary Scrutiny Passed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Documented Justification / Reviewer Reason
            </label>
            <textarea
              required
              rows={3}
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Record the official rationale for this workflow transition..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTransitionModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transitioning}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {transitioning ? 'Recording Transition...' : 'Apply Transition'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REVIEW FINDING */}
      <Modal
        isOpen={reviewFindingModalOpen}
        onClose={() => setReviewFindingModalOpen(false)}
        title="Review Regulatory Finding"
      >
        <form onSubmit={handleReviewFindingSubmit} className="space-y-4">
          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>Finding:</strong> {selectedFinding?.title}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Officer Determination
            </label>
            <select
              value={reviewStatusChoice}
              onChange={(e) => setReviewStatusChoice(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="CONFIRMED">CONFIRM Finding (Valid Non-Compliance)</option>
              <option value="DISMISSED">DISMISS Finding (False Positive / Accepted Exception)</option>
              <option value="NEEDS_MORE_EVIDENCE">Needs More Evidence (Request Clarification)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mandatory Reviewer Rationale
            </label>
            <textarea
              required
              rows={3}
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="State the regulatory evidence or handbook provision supporting your decision..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewFindingModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewingFinding}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {reviewingFinding ? 'Recording...' : 'Submit Determination'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT EXTRACTED FIELD */}
      <Modal
        isOpen={editFieldModalOpen}
        onClose={() => setEditFieldModalOpen(false)}
        title="Manual Correction of Extracted Field"
      >
        <form onSubmit={handleEditFieldSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Field: {selectedField?.fieldName}
            </label>
            <input
              type="text"
              required
              value={editFieldValue}
              onChange={(e) => setEditFieldValue(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Manual correction will be audited and marked as manually reviewed.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditFieldModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingField}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {savingField ? 'Saving...' : 'Save Correction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: OCR TEXT VIEWER */}
      <Modal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        title={`Extracted Raw OCR Text — ${ocrModalFilename}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <strong>Inspection Text Stream:</strong> Below is the unedited optical character recognition text extracted from this submitted document for regulatory scrutiny.
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 max-h-[60vh] overflow-y-auto">
            <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {ocrModalContent || 'No text extracted from document.'}
            </pre>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Character Count: <strong className="text-slate-800">{ocrModalContent.length}</strong>
            </div>
            <button
              type="button"
              onClick={() => setOcrModalOpen(false)}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
