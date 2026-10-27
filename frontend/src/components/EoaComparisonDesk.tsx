import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  MessageSquare,
  Send,
  FileText,
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
  Download,
  Copy,
  Zap,
} from 'lucide-react';
import type { ComparisonReport, VerificationItem, ClarificationRequest } from '../types';
import { api } from '../services/api';
import { Modal } from './Modal';
import { AnomalyDetectionHUD, type AnomalyPayload } from './AnomalyDetectionHUD';

interface EoaComparisonDeskProps {
  applicationId: string;
  isOfficer: boolean;
  onRefresh: () => void;
  report: ComparisonReport | null;
  loading: boolean;
}

export const EoaComparisonDesk: React.FC<EoaComparisonDeskProps> = ({
  applicationId,
  isOfficer,
  onRefresh,
  report,
  loading,
}) => {
  const [subTab, setSubTab] = useState<'comparison' | 'checklist' | 'clarifications'>('comparison');
  const [recomputing, setRecomputing] = useState(false);
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Evidence Viewer & Review Modal State
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('RESOLVED');
  const [officerComments, setOfficerComments] = useState<string>('');
  const [savingReview, setSavingReview] = useState(false);

  // Document Blob & Preview State (fixes cross-origin iframe PDF rendering in Chrome)
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docPreviewTab, setDocPreviewTab] = useState<'pdf' | 'ocr'>('pdf');
  const [copiedOcr, setCopiedOcr] = useState(false);

  // Clarification Modal State
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationSubject, setClarificationSubject] = useState('');
  const [clarificationQuery, setClarificationQuery] = useState('');
  const [clarificationDeadline, setClarificationDeadline] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);

  // Applicant Response Modal State
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedClarification, setSelectedClarification] = useState<ClarificationRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Anomaly HUD State
  const [anomalyHUDOpen, setAnomalyHUDOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyPayload | null>(null);

  const handleTriggerAnomalyHUD = (item: VerificationItem) => {
    const isExpired = item.comparisonResult === 'EXPIRED';
    const isMismatch = item.comparisonResult === 'CHANGED_VERIFY' || item.comparisonResult === 'INCONSISTENT';

    const anomalyData: AnomalyPayload = {
      title: item.warningReason || `Statutory Discrepancy Flagged: ${item.fieldRequirement}`,
      category: item.category,
      severity: isExpired || isMismatch ? 'CRITICAL' : 'HIGH',
      ruleCode: isExpired ? 'RULE_DOC_EXPIRY_CHECK' : (isMismatch ? 'RULE_EOA_INTAKE_MISMATCH' : 'RULE_NAME_CONSISTENCY'),
      documentTitle: item.document?.originalFilename || `${item.fieldName}.pdf`,
      documentUrl: item.document?.id ? api.getDocumentFileUrl(item.document.id) : undefined,
      expectedValue: item.previousEoaValue || 'Approved Baseline Norm',
      extractedValue: item.currentApplicationValue || item.extractedValue || 'Discrepancy Detected',
      discrepancyDelta: item.warningReason || 'Value modification deviates from approved baseline record',
      recommendation: item.recommendedAction || 'Scrutiny officer audit required before granting extension of approval',
      confidenceScore: (item.confidence ? item.confidence * 100 : 98.4),
      boundingBox: item.boundingBoxJson,
    };

    setSelectedAnomaly(anomalyData);
    setAnomalyHUDOpen(true);
  };

  // Fetch Document as same-origin Blob URL whenever evidence modal opens
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (evidenceModalOpen && selectedItem?.document?.id) {
      setDocLoading(true);
      setDocError(null);
      const fileUrl = api.getDocumentFileUrl(selectedItem.document.id);
      const token = localStorage.getItem('aicte_token');

      fetch(fileUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to load document (${res.status} ${res.statusText})`);
          }
          const blob = await res.blob();
          if (active) {
            // Force PDF MIME type to ensure browser invokes PDF viewer
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            objectUrl = URL.createObjectURL(pdfBlob);
            setDocBlobUrl(objectUrl);
            setDocLoading(false);
          }
        })
        .catch((err) => {
          console.error('Error fetching document blob:', err);
          if (active) {
            setDocError(err.message || 'Unable to load PDF document');
            setDocLoading(false);
          }
        });
    } else {
      setDocBlobUrl(null);
      setDocLoading(false);
      setDocError(null);
    }

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [evidenceModalOpen, selectedItem?.document?.id]);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await api.comparePreviousEoa(applicationId);
      onRefresh();
    } catch (err: any) {
      alert(`Comparison error: ${err.message}`);
    } finally {
      setRecomputing(false);
    }
  };

  const handleOpenEvidence = (item: VerificationItem) => {
    setSelectedItem(item);
    setReviewStatus(
      item.reviewStatus === 'RESOLVED'
        ? 'RESOLVED'
        : item.reviewStatus === 'PENDING_REVIEW'
        ? 'RESOLVED'
        : item.reviewStatus
    );
    setOfficerComments(item.officerComments || '');
    setDocPreviewTab('pdf');
    setEvidenceModalOpen(true);
  };

  const handleQuickResolve = async (item: VerificationItem) => {
    setSavingReview(true);
    const comment = officerComments.trim() || 'Discrepancy verified and marked as RESOLVED by Scrutiny Officer.';
    try {
      await api.reviewVerificationItem(item.id, {
        reviewStatus: 'RESOLVED',
        officerComments: comment,
      });
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({
          ...selectedItem,
          reviewStatus: 'RESOLVED',
          officerComments: comment,
        });
        setReviewStatus('RESOLVED');
      }
      onRefresh();
    } catch (err: any) {
      alert(`Failed to resolve issue: ${err.message}`);
    } finally {
      setSavingReview(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSavingReview(true);
    try {
      await api.reviewVerificationItem(selectedItem.id, {
        reviewStatus,
        officerComments,
      });
      setEvidenceModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to save review: ${err.message}`);
    } finally {
      setSavingReview(false);
    }
  };

  const handleOpenClarificationModal = (item?: VerificationItem) => {
    if (item) {
      setSelectedItem(item);
      setClarificationSubject(`Clarification on ${item.fieldRequirement}`);
      setClarificationQuery(item.warningReason || `Please provide regulatory clarification regarding the value for ${item.fieldRequirement}.`);
    } else {
      setClarificationSubject('Institutional Clarification Notice');
      setClarificationQuery('');
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setClarificationDeadline(defaultDate.toISOString().split('T')[0]);
    setClarificationModalOpen(true);
  };

  const handleSubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClarification(true);
    try {
      await api.createClarificationRequest(applicationId, {
        verificationItemId: selectedItem?.id || null,
        subject: clarificationSubject,
        queryText: clarificationQuery,
        deadline: clarificationDeadline,
      });
      setClarificationModalOpen(false);
      if (evidenceModalOpen) setEvidenceModalOpen(false);
      onRefresh();
      alert('Clarification request issued to applicant institution.');
    } catch (err: any) {
      alert(`Failed to issue clarification: ${err.message}`);
    } finally {
      setSubmittingClarification(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClarification) return;
    setSubmittingResponse(true);
    try {
      await api.respondClarificationRequest(selectedClarification.id, {
        responseNotes,
      });
      setResponseModalOpen(false);
      onRefresh();
      alert('Your response was submitted to the scrutiny officer.');
    } catch (err: any) {
      alert(`Failed to submit response: ${err.message}`);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'CONSISTENT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Consistent</span>
          </span>
        );
      case 'CHANGED_VERIFY':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Changed — Verify</span>
          </span>
        );
      case 'NEW_ADDITION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
            <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>New Addition</span>
          </span>
        );
      case 'REMOVED_VERIFY':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <MinusCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Removed — Verify</span>
          </span>
        );
      case 'INCONSISTENT_VERIFY':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Inconsistent — Verify</span>
          </span>
        );
      case 'POTENTIALLY_EXPIRED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            <span>Potentially Expired</span>
          </span>
        );
      case 'UNABLE_TO_EXTRACT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Unable to Extract</span>
          </span>
        );
      case 'NO_PREVIOUS_RECORD':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>No Previous Record</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            {result}
          </span>
        );
    }
  };

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Issue Resolved</span>
          </span>
        );
      case 'VERIFIED_BY_OFFICER':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Verified by Officer</span>
          </span>
        );
      case 'CLARIFICATION_REQUESTED':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-300">
            <MessageSquare className="w-3 h-3 text-sky-600" />
            <span>Clarification Requested</span>
          </span>
        );
      case 'CONSISTENT':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Consistent</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const items = report?.items || [];
  const summary = report?.summary;
  const isHistoricalUnavailable = summary?.status === 'UNAVAILABLE';
  const resolvedCount = items.filter((i) => i.reviewStatus === 'RESOLVED').length;

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterResult !== 'ALL') {
      if (filterResult === 'RESOLVED') {
        if (item.reviewStatus !== 'RESOLVED') return false;
      } else if (filterResult === 'NEEDS_REVIEW') {
        if (item.reviewStatus === 'VERIFIED_BY_OFFICER' || item.reviewStatus === 'RESOLVED') {
          return false;
        }
      } else if (item.comparisonResult !== filterResult) {
        return false;
      }
    }
    if (filterCategory !== 'ALL' && item.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReq = (item.fieldRequirement || '').toLowerCase().includes(q);
      const matchCurr = (item.currentApplicationValue || '').toLowerCase().includes(q);
      const matchPrev = (item.previousEoaValue || '').toLowerCase().includes(q);
      const matchDoc = (item.document?.originalFilename || '').toLowerCase().includes(q);
      if (!matchReq && !matchCurr && !matchPrev && !matchDoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Executive Comparison Header & Metrics Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              <GitCompare className="w-4 h-4 text-[#002147]" />
              <span>Regulatory Dossier Verification Desk</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#002147] mt-0.5">
              Previous EoA Comparison & Officer Verification Desk
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Automated optical character extraction and structured delta analysis between current submission and prior approved academic dockets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Live AI Anomaly Scanner Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedAnomaly(null);
                setAnomalyHUDOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:scale-102 border border-red-400/40"
              title="Launch AI Scrutiny & Anomaly Detection Simulator"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>AI Anomaly Scanner & Specimen Hub</span>
            </button>

            <button
              onClick={handleRecompute}
              disabled={recomputing || loading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#002147] text-white rounded-lg text-xs font-semibold hover:bg-[#003366] transition-colors disabled:opacity-50 shadow-xs"
              title="Rerun comparison against database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${recomputing ? 'animate-spin' : ''}`} />
              <span>{recomputing ? 'Comparing...' : 'Recompute EoA Comparison'}</span>
            </button>
            {isOfficer && (
              <button
                onClick={() => handleOpenClarificationModal()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 text-slate-900 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Issue Clarification</span>
              </button>
            )}
          </div>
        </div>

        {/* Previous EoA Association Status Card */}
        {isHistoricalUnavailable ? (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-900 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider text-amber-950">
                Historical Comparison Notice
              </div>
              <div className="font-semibold text-sm text-amber-900">
                Historical comparison unavailable — previous EoA record not linked.
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                This institution does not currently have a linked preceding academic approval order in the digital database. All extracted fields below are shown for direct verification against AICTE Handbook norms. Linking a historical approval order will immediately populate delta comparisons.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Reference</span>
              <span className="text-xs font-bold text-slate-900 truncate block" title={summary?.previousReferenceNumber || 'N/A'}>
                {summary?.previousReferenceNumber || 'N/A'}
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">Session: {summary?.previousAcademicYear || 'N/A'}</span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase font-mono">Consistent</span>
              <span className="text-base font-extrabold text-emerald-900">{summary?.consistentCount ?? 0}</span>
              <span className="text-[9.5px] text-emerald-600 block">Matched</span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
              <span className="text-[10px] text-amber-700 block uppercase font-mono">Changed</span>
              <span className="text-base font-extrabold text-amber-900">{summary?.changedCount ?? 0}</span>
              <span className="text-[9.5px] text-amber-700 block">Requires scrutiny</span>
            </div>

            <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-200">
              <span className="text-[10px] text-sky-700 block uppercase font-mono">Additions</span>
              <span className="text-base font-extrabold text-sky-900">{summary?.addedCount ?? 0}</span>
              <span className="text-[9.5px] text-sky-700 block">New courses/items</span>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
              <span className="text-[10px] text-purple-700 block uppercase font-mono">Removed</span>
              <span className="text-base font-extrabold text-purple-900">{summary?.removedCount ?? 0}</span>
              <span className="text-[9.5px] text-purple-700 block">Omitted items</span>
            </div>

            <div className="p-3 bg-red-50/60 rounded-lg border border-red-200">
              <span className="text-[10px] text-red-700 block uppercase font-mono">Expired</span>
              <span className="text-base font-extrabold text-red-900">{summary?.expiredCount ?? 0}</span>
              <span className="text-[9.5px] text-red-700 block">Lapsed validity</span>
            </div>

            <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-300">
              <span className="text-[10px] text-emerald-800 block uppercase font-mono font-bold">Issues Resolved</span>
              <span className="text-base font-extrabold text-emerald-950">{resolvedCount}</span>
              <span className="text-[9.5px] text-emerald-700 block">Rectified & cleared</span>
            </div>

            <div className="p-3 bg-[#002147] text-white rounded-lg shadow-xs">
              <span className="text-[10px] text-amber-400 block uppercase font-mono font-semibold">Pending Review</span>
              <span className="text-base font-extrabold text-white">{summary?.pendingReviewCount ?? 0}</span>
              <span className="text-[9.5px] text-slate-300 block">Items awaiting action</span>
            </div>
          </div>
        )}

        {/* Sub-Tabs: Comparison Table / Verification Checklist / Clarifications */}
        <div className="flex border-b border-slate-200 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setSubTab('comparison')}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-t-lg transition-colors ${
              subTab === 'comparison'
                ? 'bg-slate-100 text-[#002147] border-b-2 border-[#002147] font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-sky-600" />
            <span>Previous vs Current Side-by-Side Table ({items.length})</span>
          </button>

          <button
            onClick={() => setSubTab('checklist')}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-t-lg transition-colors ${
              subTab === 'checklist'
                ? 'bg-slate-100 text-[#002147] border-b-2 border-[#002147] font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Officer Verification Checklist</span>
          </button>

          <button
            onClick={() => setSubTab('clarifications')}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-t-lg transition-colors ${
              subTab === 'clarifications'
                ? 'bg-slate-100 text-[#002147] border-b-2 border-[#002147] font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Regulatory Clarifications</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB A: Previous vs Current Comparison Table */}
      {subTab === 'comparison' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Search & Quick Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter comparison fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#002147] w-52 sm:w-64"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#002147]"
              >
                <option value="ALL">All Categories</option>
                <option value="INSTITUTE_IDENTITY">Institute Identity</option>
                <option value="PROGRAMME_INTAKE">Programme & Intake</option>
                <option value="REGULATORY_CERTIFICATE">Regulatory Certificates</option>
                <option value="INFRASTRUCTURE">Campus Infrastructure</option>
                <option value="FACULTY">Faculty Roster</option>
                <option value="STATUTORY_DECLARATION">Statutory Declarations</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Status:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'NEEDS_REVIEW', label: 'Needs Review' },
                { id: 'RESOLVED', label: 'Issue Resolved' },
                { id: 'CHANGED_VERIFY', label: 'Changed' },
                { id: 'NEW_ADDITION', label: 'Added' },
                { id: 'REMOVED_VERIFY', label: 'Removed' },
                { id: 'POTENTIALLY_EXPIRED', label: 'Expired' },
                { id: 'CONSISTENT', label: 'Consistent' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterResult(pill.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    filterResult === pill.id
                      ? 'bg-[#002147] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-side Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-[#002147] font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-4 w-1/4">Requirement / Field Checked</th>
                  <th className="py-3 px-4 w-1/5">Previous EoA Value</th>
                  <th className="py-3 px-4 w-1/5">Current Application Value</th>
                  <th className="py-3 px-3 text-center">Comparison Result</th>
                  <th className="py-3 px-3 text-center">Officer Review</th>
                  <th className="py-3 px-4 text-right">Evidence Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No comparison items matched the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenEvidence(item)}
                    >
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 group-hover:text-[#002147]">
                          {item.fieldRequirement}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Category: {item.category.replace(/_/g, ' ')}
                        </div>
                        {item.warningReason && (
                          <div className="text-[11px] text-amber-800 bg-amber-50/80 p-1.5 rounded mt-1.5 border border-amber-200/80 leading-snug">
                            {item.warningReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-slate-700 bg-slate-50/40">
                        {item.previousEoaValue ? (
                          <div className="font-medium text-slate-800">
                            {item.previousEoaValue}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None on record</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-slate-900 font-semibold">
                        <div>{item.currentApplicationValue || item.extractedValue || 'N/A'}</div>
                        {item.document && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[170px]" title={item.document.originalFilename}>
                              {item.document.originalFilename} (p. {item.pageNumber || 1})
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 align-top text-center">
                        {getResultBadge(item.comparisonResult)}
                      </td>

                      <td className="py-3.5 px-3 align-top text-center">
                        {getReviewStatusBadge(item.reviewStatus)}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isOfficer && item.reviewStatus !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickResolve(item);
                              }}
                              disabled={savingReview}
                              title="Instantly mark this issue as resolved"
                              className="inline-flex items-center space-x-1 px-2 py-1.5 rounded bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 font-bold transition-colors text-[11px] shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                              <span>Resolve Issue</span>
                            </button>
                          )}
                          {item.comparisonResult !== 'CONSISTENT' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerAnomalyHUD(item);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 font-bold transition-all text-[11px] shadow-2xs group"
                              title="Launch AI Forensic Anomaly Scanner Animation"
                            >
                              <Zap className="w-3.5 h-3.5 text-red-600 group-hover:text-amber-200 animate-pulse" />
                              <span>Scan Anomaly</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEvidence(item);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-[#002147] hover:text-white text-slate-700 font-semibold transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Evidence</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB B: Officer Verification Checklist Queue */}
      {subTab === 'checklist' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#002147]" />
              <span>
                Showing <strong>{filteredItems.length}</strong> statutory checklist items.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 font-mono">Decision Support Mode: Advisory</span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Authorized Scrutiny Desk</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#002147] transition-all space-y-3 cursor-pointer"
                onClick={() => handleOpenEvidence(item)}
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[9.5px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {item.fieldRequirement}
                    </h4>
                  </div>
                  <div className="shrink-0">{getResultBadge(item.comparisonResult)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Previous EoA Value:</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {item.previousEoaValue || 'None on record'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current Extracted Value:</span>
                    <span className="font-bold text-[#002147] truncate block">
                      {item.currentApplicationValue || item.extractedValue || 'N/A'}
                    </span>
                  </div>
                </div>

                {item.warningReason && (
                  <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded border border-amber-200/80 leading-snug">
                    <strong>Discrepancy:</strong> {item.warningReason}
                  </p>
                )}

                {item.recommendedAction && (
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    <strong className="text-slate-800">Verification Action:</strong> {item.recommendedAction}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-1.5">
                    {getReviewStatusBadge(item.reviewStatus)}
                    {item.reviewedBy && (
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        by {item.reviewedBy.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isOfficer && item.reviewStatus !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickResolve(item);
                        }}
                        disabled={savingReview}
                        className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolve Issue</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEvidence(item);
                      }}
                      className="text-[#002147] font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Record Review</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUB-TAB C: Regulatory Clarifications Desk */}
      {subTab === 'clarifications' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#002147]">Regulatory Clarification Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official bilateral communications between AICTE Scrutiny Officers and Institution Representatives.
              </p>
            </div>
            {isOfficer && (
              <button
                onClick={() => handleOpenClarificationModal()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Issue New Clarification</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {report?.items
              .flatMap((i) => i.clarificationRequests || [])
              .length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Pending Clarifications</h4>
                <p className="text-xs text-slate-500 mt-1">
                  All current submitted documentation complies with standard verification guidelines.
                </p>
              </div>
            ) : (
              report?.items
                .flatMap((i) => i.clarificationRequests || [])
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.status === 'OPEN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {req.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Issued: {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{req.subject}</h4>
                      </div>

                      {req.deadline && (
                        <div className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                          Deadline: {new Date(req.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-1">Scrutiny Officer Query:</strong>
                      {req.queryText}
                    </div>

                    {req.responseNotes ? (
                      <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                        <div className="font-bold text-emerald-950 flex items-center justify-between mb-1">
                          <span>Institutional Response:</span>
                          <span className="text-[10px] font-mono font-normal">
                            {req.respondedAt ? new Date(req.respondedAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="leading-relaxed">{req.responseNotes}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => {
                            setSelectedClarification(req);
                            setResponseNotes('');
                            setResponseModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>Submit Clarification Response</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE DOCUMENT EVIDENCE VIEWER MODAL — HORIZONTAL SPLIT WORKSPACE */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Document Evidence & Officer Verification Workspace"
        maxWidth="full"
      >
        {selectedItem && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT HORIZONTAL COLUMN (7 COLS): Interactive Document Viewer Workspace */}
            <div className="lg:col-span-7 space-y-3">
              {selectedItem.document ? (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 shadow-2xs">
                  {/* Header with Horizontal Tabs & Action Links */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDocPreviewTab('pdf')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                          docPreviewTab === 'pdf'
                            ? 'bg-[#002147] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Document</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocPreviewTab('ocr')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                          docPreviewTab === 'ocr'
                            ? 'bg-[#002147] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>OCR Extracted Text</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-mono hidden sm:inline truncate max-w-[220px]" title={selectedItem.document.originalFilename}>
                        {selectedItem.document.originalFilename}
                      </span>
                      <a
                        href={api.getDocumentFileUrl(selectedItem.document.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-white border border-slate-200 text-[#002147] font-semibold hover:bg-slate-100 shadow-2xs"
                        title="Open full document in separate browser tab"
                      >
                        <span>Open Full Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={api.getDocumentFileUrl(selectedItem.document.id)}
                        download={selectedItem.document.originalFilename}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 shadow-2xs"
                        title="Download PDF"
                      >
                        <span>Download</span>
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Horizontal Tab 1: Live PDF Document Viewer */}
                  {docPreviewTab === 'pdf' && (
                    <div className="rounded-lg border border-slate-300 overflow-hidden bg-slate-900/5 h-[580px] lg:h-[630px] relative shadow-inner">
                      {docLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 space-y-2">
                          <RefreshCw className="w-7 h-7 text-[#002147] animate-spin" />
                          <span className="text-xs font-semibold text-slate-700">Loading document preview securely from repository...</span>
                        </div>
                      )}

                      {docError ? (
                        <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-full bg-slate-50">
                          <AlertCircle className="w-10 h-10 text-amber-500" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">Direct Preview Unavailable</div>
                            <p className="text-xs text-slate-600 mt-1 max-w-md">
                              The browser could not embed this PDF directly in the frame. You can open it in a full browser tab or view the extracted OCR text below.
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 pt-2">
                            <a
                              href={api.getDocumentFileUrl(selectedItem.document.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-[#002147] text-white rounded text-xs font-semibold hover:bg-[#003366] flex items-center space-x-1"
                            >
                              <span>Open in Full Browser Tab</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setDocPreviewTab('ocr')}
                              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100"
                            >
                              View OCR Extracted Text
                            </button>
                          </div>
                        </div>
                      ) : docBlobUrl ? (
                        <object
                          data={docBlobUrl}
                          type="application/pdf"
                          className="w-full h-full"
                        >
                          <iframe
                            src={docBlobUrl}
                            title={selectedItem.document.originalFilename}
                            className="w-full h-full border-0"
                          />
                        </object>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-400">
                          Preparing document preview stream...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Horizontal Tab 2: OCR Extracted Text & Formatted Content */}
                  {docPreviewTab === 'ocr' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                        <span>Extracted optical characters & verified fields</span>
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy = selectedItem.document?.ocrRawText || selectedItem.evidenceSnippet || selectedItem.currentApplicationValue || '';
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedOcr(true);
                            setTimeout(() => setCopiedOcr(false), 2000);
                          }}
                          className="inline-flex items-center space-x-1 text-[11px] text-[#002147] font-semibold hover:underline"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedOcr ? 'Copied to Clipboard!' : 'Copy OCR Text'}</span>
                        </button>
                      </div>
                      <div className="rounded-lg border border-slate-300 p-4 bg-white h-[580px] lg:h-[630px] overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {selectedItem.document?.ocrRawText || (
                          <div className="space-y-3">
                            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 font-sans">
                              <strong>OCR Summary Snippet:</strong>
                              <p className="font-mono mt-1 text-xs">{selectedItem.evidenceSnippet || selectedItem.currentApplicationValue}</p>
                            </div>
                            <p className="text-slate-500 font-sans text-xs italic">
                              Full raw OCR stream text is indexed. Click "PDF Document" tab above to view original scanned layout.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-600 h-[300px] flex flex-col items-center justify-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-400" />
                  <span className="font-bold text-slate-700">No physical file attached to this parameter</span>
                  <p className="text-slate-500 max-w-sm">Evidence was derived from institutional profile records.</p>
                </div>
              )}
            </div>

            {/* RIGHT HORIZONTAL COLUMN (5 COLS): Scrutiny Verification & Decision Desk */}
            <div className="lg:col-span-5 space-y-4">
              {/* Context Header */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#002147] text-white font-bold">
                    {selectedItem.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-base font-bold text-[#002147] mt-1.5">
                    {selectedItem.fieldRequirement}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>Document: {selectedItem.document?.originalFilename || 'Regulatory File'}</span>
                    <span>•</span>
                    <span>Page: {selectedItem.pageNumber || 1}</span>
                    {selectedItem.confidence && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-emerald-700 font-semibold">
                          OCR Confidence: {Math.round(selectedItem.confidence * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0">{getResultBadge(selectedItem.comparisonResult)}</div>
              </div>

              {/* Comparison Side-by-Side Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Previous EoA Value (Baseline)
                  </span>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedItem.previousEoaValue || (
                      <span className="text-slate-400 italic">None on historical record</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-sky-50/70 rounded-lg border border-sky-200">
                  <span className="text-[10.5px] font-bold text-sky-800 uppercase tracking-wider block mb-1">
                    Current Application Extracted Value
                  </span>
                  <div className="text-sm font-bold text-[#002147]">
                    {selectedItem.currentApplicationValue || selectedItem.extractedValue || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Evidence Snippet & Highlighted Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>OCR Extracted Text Snippet</span>
                  <span className="text-[10px] text-slate-400 font-mono">Page {selectedItem.pageNumber || 1}</span>
                </label>
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/90 text-xs text-slate-800 font-mono leading-relaxed">
                  <span className="bg-amber-200/80 px-1 py-0.5 rounded font-bold">
                    {selectedItem.evidenceSnippet || selectedItem.extractedValue || 'Extracted evidence from uploaded document.'}
                  </span>
                </div>
              </div>

              {/* Quick Resolve Action Card */}
              {isOfficer && (
                selectedItem.reviewStatus === 'RESOLVED' ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center space-x-2.5 text-emerald-950 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-sm font-extrabold text-emerald-900">Issue Marked as Resolved</div>
                        <div className="text-[11.5px] font-normal text-emerald-800">
                          This discrepancy has been reviewed and officially cleared by Scrutiny Officer.
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-200/80 text-emerald-900 rounded font-bold font-mono text-[10.5px]">
                      STATUS: RESOLVED
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Scrutiny Resolution Action</span>
                      </div>
                      <p className="text-[11.5px] text-emerald-800 leading-snug">
                        Discrepancy identified between baseline and current submission. If acceptable, click to mark as resolved.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickResolve(selectedItem)}
                      disabled={savingReview}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Mark Issue as Resolved</span>
                    </button>
                  </div>
                )
              )}

              {/* Officer Review Decision Form */}
              {isOfficer ? (
                <form onSubmit={handleSaveReview} className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Record Officer Scrutiny Outcome:
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-[#002147] focus:outline-none"
                    >
                      <option value="RESOLVED">✅ Issue Resolved (Discrepancy Rectified / Cleared)</option>
                      <option value="VERIFIED_BY_OFFICER">Verified by Officer (Complies with Handbook)</option>
                      <option value="CONSISTENT">Confirmed Consistent (Baseline Matched)</option>
                      <option value="CHANGED_VERIFY">Changed — Verified & Permissible</option>
                      <option value="CLARIFICATION_REQUESTED">Clarification Required from Institute</option>
                      <option value="INCONSISTENT_VERIFY">Inconsistent / Discrepancy Recorded</option>
                      <option value="POTENTIALLY_EXPIRED">Expired Certificate — Renewal Required</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Officer Justification / Scrutiny Remarks:
                    </label>
                    <textarea
                      rows={3}
                      value={officerComments}
                      onChange={(e) => setOfficerComments(e.target.value)}
                      placeholder="Enter factual regulatory observations, verification notes, or resolution justification..."
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-[#002147] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenClarificationModal(selectedItem)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Raise Clarification</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setEvidenceModalOpen(false)}
                        className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      {selectedItem.reviewStatus !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleQuickResolve(selectedItem)}
                          disabled={savingReview}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Resolve Issue Now</span>
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={savingReview}
                        className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
                      >
                        {savingReview ? 'Saving...' : 'Record Outcome'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">Current Review Status:</span>
                  <div>{getReviewStatusBadge(selectedItem.reviewStatus)}</div>
                  {selectedItem.officerComments && (
                    <p className="text-slate-600 mt-2 font-mono text-[11px]">
                      <strong>Officer Remarks:</strong> {selectedItem.officerComments}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 6. CREATE CLARIFICATION REQUEST MODAL */}
      <Modal
        isOpen={clarificationModalOpen}
        onClose={() => setClarificationModalOpen(false)}
        title="Issue Official Regulatory Clarification Memo"
      >
        <form onSubmit={handleSubmitClarification} className="space-y-4">
          <p className="text-xs text-slate-600">
            Send an authorized electronic clarification notice to the institution. The applicant will be notified to submit formal explanations or supporting documents.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Subject / Category</label>
            <input
              type="text"
              required
              value={clarificationSubject}
              onChange={(e) => setClarificationSubject(e.target.value)}
              placeholder="e.g. Discrepancy in Fire Safety Certificate Validity Date"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#002147]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Clarification Details & Regulatory Query</label>
            <textarea
              required
              rows={4}
              value={clarificationQuery}
              onChange={(e) => setClarificationQuery(e.target.value)}
              placeholder="Explain the specific deficiency, date mismatch, or missing evidence that must be resolved..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#002147]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Submission Deadline</label>
            <input
              type="date"
              value={clarificationDeadline}
              onChange={(e) => setClarificationDeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#002147]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setClarificationModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingClarification}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-lg shadow-xs disabled:opacity-50"
            >
              {submittingClarification ? 'Issuing...' : 'Issue Clarification Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. APPLICANT CLARIFICATION RESPONSE MODAL */}
      <Modal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        title="Respond to Scrutiny Clarification"
      >
        <form onSubmit={handleSubmitResponse} className="space-y-4">
          {selectedClarification && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-[#002147] block">{selectedClarification.subject}</span>
              <p className="text-slate-600">{selectedClarification.queryText}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">
              Institutional Explanation & Remediation Notes:
            </label>
            <textarea
              required
              rows={4}
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              placeholder="State the institutional factual response, references to renewed certificates, or submission clarifications..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#002147]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResponseModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingResponse}
              className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50"
            >
              {submittingResponse ? 'Submitting...' : 'Submit Response to Scrutiny Officer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cyber Anomaly Detection HUD & Demo Hub */}
      <AnomalyDetectionHUD
        isOpen={anomalyHUDOpen}
        onClose={() => setAnomalyHUDOpen(false)}
        initialAnomaly={selectedAnomaly}
      />
    </div>
  );
};
