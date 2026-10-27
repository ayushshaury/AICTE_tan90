import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Interactive2DVisualizer } from '../components/Interactive2DVisualizer';
import { AicteEmblem } from '../components/AicteEmblem';
import { EmblemOfIndia } from '../components/EmblemOfIndia';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  Inbox,
  RefreshCw,
  ShieldCheck,
  Upload,
  Calendar,
  BookOpen,
  Scale,
  Users,
  Activity,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const isAdminOrOfficer =
    user?.role === 'ADMIN' || user?.role === 'SENIOR_REVIEWER' || user?.role === 'OFFICER';
  const isApplicant = user?.role === 'APPLICANT';

  // Role-based view state: applicants see the institutional applicant desk, admins see council command center
  // Admins can also toggle to preview the applicant view
  const [activeView, setActiveView] = useState<'ADMIN' | 'APPLICANT'>(
    isApplicant ? 'APPLICANT' : 'ADMIN'
  );

  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveView(isApplicant ? 'APPLICANT' : 'ADMIN');
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, trendData, queueData, appsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
        api.getAttentionQueue(),
        api.getApplications('limit=10'),
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setQueue(queueData);
      setMyApplications(appsData?.items || []);

      if (user?.institutionId) {
        try {
          const instData = await api.getInstitution(user.institutionId);
          setInstitution(instData);
        } catch {
          // Fallback to user context institution
        }
      }

      if (isAdminOrOfficer) {
        try {
          const auditRes = await api.getAuditEvents('limit=6');
          setAuditEvents(auditRes?.items || []);
        } catch {
          // Non-critical
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#002147] animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          {activeView === 'APPLICANT'
            ? 'Loading institutional compliance records...'
            : 'Aggregating national scrutiny command metrics...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        <div className="flex items-center space-x-2 font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Error loading scrutiny dashboard</span>
        </div>
        <p className="text-sm mt-1 text-rose-700">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const instName =
    institution?.name ||
    user?.institution?.name ||
    myApplications[0]?.institution?.name ||
    'Authorized Technical Institution';
  const instCode =
    institution?.institutionCode ||
    user?.institution?.code ||
    myApplications[0]?.institution?.institutionCode ||
    'AICTE-DEMO-101';
  const instType =
    institution?.institutionType ||
    myApplications[0]?.institution?.institutionType ||
    'Engineering & Technology';
  const instState =
    institution?.state || myApplications[0]?.institution?.state || 'Maharashtra';
  const instAddress =
    institution?.address ||
    myApplications[0]?.institution?.address ||
    'Campus Institutional Area';

  // Calculate Applicant Scrutiny Readiness score
  const totalMyDocs = summary?.totalDocuments ?? 0;
  const openIssuesCount =
    (summary?.criticalFindingsCount ?? 0) + (summary?.highFindingsCount ?? 0);
  const applicantReadinessScore = Math.max(
    30,
    Math.min(
      98,
      Math.round(
        (totalMyDocs > 0 ? 50 : 20) +
          (openIssuesCount === 0 ? 40 : 15) +
          (myApplications.length > 0 ? 8 : 0)
      )
    )
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Role-View Toggle (Only available for Admins to preview Applicant Desk) */}
      {isAdminOrOfficer && (
        <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 pl-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-600 font-semibold">Logged in as Council Administrator:</span>
            <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium px-2">Dashboard Persona:</span>
            <button
              onClick={() => setActiveView('ADMIN')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                activeView === 'ADMIN'
                  ? 'bg-[#002147] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              🏛️ Central Admin Command
            </button>
            <button
              onClick={() => setActiveView('APPLICANT')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                activeView === 'APPLICANT'
                  ? 'bg-[#FF9933] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              🎓 Institutional Applicant Desk
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎓 VIEW A: INSTITUTIONAL APPLICANT DASHBOARD                               */}
      {/* ========================================================================= */}
      {activeView === 'APPLICANT' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Institutional Dossier Header Banner with Tricolor Accent */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden">
            {/* National Tricolor Top Strip */}
            <div className="h-1.5 w-full flex">
              <div className="w-1/3 bg-[#FF9933]" />
              <div className="w-1/3 bg-[#FFFFFF] border-y border-slate-200" />
              <div className="w-1/3 bg-[#138808]" />
            </div>

            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Institutional Particulars */}
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-inner">
                    <AicteEmblem size={44} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                        <span>Institutional Applicant Desk — AICTE 90*</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        AICTE ID: {instCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Approved Technical Institute
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147]">
                      {instName}
                    </h1>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
                      <span>{instType}</span>
                      <span>•</span>
                      <span>{instAddress}, {instState}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">
                        AICTE Scrutiny Cycle 2026-27
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Fast Action Buttons & Readiness Gauge */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Readiness Ring Card */}
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center space-x-3 text-xs">
                    <div className="w-10 h-10 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {applicantReadinessScore}%
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Scrutiny Readiness</div>
                      <div className="text-[11px] text-slate-500">
                        {openIssuesCount === 0 ? 'Documentation Cleared' : `${openIssuesCount} Issue Pending`}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/applications/new"
                    className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all border border-[#FF9933]/30"
                  >
                    <span>+ New Regulatory Filing</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Applicant 4 Key Institutional KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#002147]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Active EoA Filings
                </span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#002147]">
                  {myApplications.length}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  Academic Session 2026-27
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#002147]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Current Scrutiny Stage
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold text-indigo-950 truncate">
                  {myApplications[0] ? (
                    <StatusBadge status={myApplications[0].status} size="sm" />
                  ) : (
                    <span className="text-slate-400">Not Initiated</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  {myApplications[0]?.referenceNumber || 'AICTE-APH-2026'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#002147]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Verified Documents Filed
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
                  {summary?.totalDocuments ?? 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  SHA-256 Cryptographic Records
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#002147]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Action Required / Remarks
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    openIssuesCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {openIssuesCount}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  {openIssuesCount > 0 ? 'Deficiencies to rectify' : 'All requirements clear'}
                </span>
              </div>
            </div>
          </div>

          {/* Applicant: Institutional Applications Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002147] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#002147]">
                    My Institution's Regulatory Filings & Approval Tracking
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official Extension of Approval (EoA) dockets filed with AICTE Council for scrutiny.
                  </p>
                </div>
              </div>

              <Link
                to="/applications/new"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#002147] hover:text-[#001733] hover:underline"
              >
                <span>+ Create Additional Filing</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Docket Reference</th>
                    <th className="py-3 px-4">Approval Category</th>
                    <th className="py-3 px-4">Academic Session</th>
                    <th className="py-3 px-4">Documents Filed</th>
                    <th className="py-3 px-4">Scrutiny Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {myApplications.length > 0 ? (
                    myApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                          {app.referenceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {app.category.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                          {app.academicYear}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="inline-flex items-center space-x-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>{app._count?.documents ?? 0} Documents</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Link
                            to={`/applications/${app.id}?tab=documents`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                          >
                            <span>Documents</span>
                          </Link>
                          <Link
                            to={`/applications/${app.id}?tab=comparison`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#002147] text-xs font-semibold transition-colors border border-blue-200"
                          >
                            <span>OCR Scrutiny</span>
                          </Link>
                          <Link
                            to={`/applications/${app.id}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          >
                            <span>Open Docket</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No applications filed yet.{' '}
                        <Link to="/applications/new" className="text-[#002147] font-bold underline">
                          Initiate your 2026-27 EoA filing now.
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deficiency & Notice Board (What this institution needs to rectify) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deficiency Center */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Deficiencies & Action Required Notice Board
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {openIssuesCount} Outstanding
                </span>
              </div>

              {queue.length > 0 ? (
                <div className="space-y-3">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#002147]">
                          Docket: {item.referenceNumber}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                      <p className="text-slate-700">
                        Institutional docket flagged with {item._count?.findings ?? 0} discrepancy parameter(s) requiring evidentiary clarification before regulatory approval.
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
                        <span className="text-[11px] text-amber-800 font-medium">
                          Clause 2.1 & 7.2 APH 2026-27
                        </span>
                        <Link
                          to={`/applications/${item.id}?tab=comparison`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-[#002147] hover:underline"
                        >
                          <span>Rectify & Inspect Evidence</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-emerald-950 text-sm">
                    No Outstanding Institutional Deficiencies
                  </div>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    All submitted regulatory filings, affidavits, and safety certificates are aligned with AICTE Approval Process Handbook (APH 2026-27) norms.
                  </p>
                </div>
              )}
            </div>

            {/* AICTE Regulatory Cycle 2026-27 Timeline & Roadmap */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#002147]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    AICTE National Scrutiny Cycle 2026-27 Timeline
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">Gazette Cycle</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      Phase 1: Institutional Data & Statutory Affidavit Filing
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Submission of Form AICTE-SCR-26 on ₹100 stamp paper with institutional particulars.
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold">Completed / Active</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      Phase 2: Automated AI OCR Scrutiny & Cross-Document Anomaly Audit
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Deterministic comparison of intake capacity, faculty roster, and NOC validity against previous EoA.
                    </p>
                    <span className="text-[10px] text-[#E65100] font-semibold">Active Scrutiny Desk</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      Phase 3: Scrutiny Committee & Regional Hearing (If Deficient)
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Designated scrutiny officers verify discrepancies and provide opportunity to rectify.
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">Target: Dec 2026</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      Phase 4: Official AICTE Extension of Approval Order Issuance
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Final regulatory gazette sanction letter issued for academic year 2026-27.
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">Target: Jan 2027</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Downloads & Compliance Guidance */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <BookOpen className="w-4 h-4 text-[#002147]" />
              <span>Mandatory Institutional Downloads & Regulatory Formats (APH 2026-27)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Affidavit on ₹100 Stamp Paper</span>
                  <Scale className="w-3.5 h-3.5 text-[#002147]" />
                </div>
                <p className="text-slate-500 text-[11px]">
                  Prescribed legal format under IPC Sec 193 affirming faculty and land norms.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Fire & Building NOC Guidelines</span>
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <p className="text-slate-500 text-[11px]">
                  National Building Code (NBC Part IV) safety requirements & structural soundness certificates.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Faculty Cadre Ratio (1:2:6)</span>
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-slate-500 text-[11px]">
                  7th CPC salary disbursement evidence guidelines and biometric cadre roster requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏛️ VIEW B: ADMIN / COUNCIL REGULATORY COMMAND CENTER                     */}
      {/* ========================================================================= */}
      {activeView === 'ADMIN' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Executive Header Banner */}
          <div className="bg-gradient-to-r from-[#002147] via-[#082b59] to-[#001733] text-white p-6 rounded-xl border-t-4 border-[#FF9933] shadow-md relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 p-1.5 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                  <EmblemOfIndia size={44} className="brightness-125" />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-[#FFB366] uppercase flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF9933]" />
                    <span>AICTE 90* — National Regulatory Scrutiny & Governance Directorate</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                    Central Regulatory Scrutiny & Audit Command Center
                  </h1>
                  <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                    National real-time command overview of technical education institutional filings, automated OCR cross-document verifications, and regulatory non-compliance detection.
                  </p>
                </div>
              </div>

              {/* Admin Governance Quick Operations Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-colors shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-200" />
                  <span>Sync Metrics</span>
                </button>
                <Link
                  to="/rules"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-colors shadow-2xs"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                  <span>Rules Engine</span>
                </Link>
                <Link
                  to="/verification"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-colors shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Verifications</span>
                </Link>
                <Link
                  to="/review-queue"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#E65100] hover:bg-[#BF360C] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  <Inbox className="w-3.5 h-3.5 text-amber-200" />
                  <span>Review Queue</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Admin KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total National Filings
                </span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#002147] tracking-tight">
                  {summary?.totalApplications ?? 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  Institutions across India
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Under Active Scrutiny
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-900 tracking-tight">
                  {summary?.scrutinyCount ?? 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  In officer review desks
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Action Required
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
                  {summary?.actionRequiredCount ?? 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  Pending applicant action
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  High / Critical Anomalies
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">
                  {(summary?.criticalFindingsCount ?? 0) + (summary?.highFindingsCount ?? 0)}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  Severe regulatory risk
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Completed & Cleared
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
                  {summary?.completedCount ?? 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1 font-medium">
                  Sanctioned for EoA
                </span>
              </div>
            </div>
          </div>

          {/* Interactive 2D Regulatory Intelligence Analytics Desk */}
          <Interactive2DVisualizer
            findingsBySeverity={trends?.findingsBySeverity || []}
            applicationsByStatus={trends?.applicationsByStatus || []}
            totalFindings={summary?.totalFindings || 0}
            totalApplications={summary?.totalApplications || 0}
          />

          {/* Admin Operations 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Rail (7 cols): Immediate Attention Queue */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#002147]">
                      National Applications Requiring Attention
                    </h2>
                    <p className="text-xs text-slate-500">
                      Prioritized queue based on unresolved high-severity findings and pending corrections.
                    </p>
                  </div>
                </div>
                <Link
                  to="/applications"
                  className="text-xs font-semibold text-[#002147] hover:text-[#003366] flex items-center space-x-1 hover:underline"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
                  <thead className="bg-slate-50/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Open Issues</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {queue.length > 0 ? (
                      queue.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 text-xs">
                            {app.referenceNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-xs">
                              {app.institution.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {app.institution.institutionCode} • {app.institution.state}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                            {app.category.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {app._count?.findings ?? 0} open
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/applications/${app.id}`}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#002147] hover:text-white border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">
                          No high-priority applications currently in attention queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Rail (5 cols): Live Regulatory Audit Trail & Council Activity Ledger */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#002147]" />
                    <h3 className="text-sm font-bold text-[#002147] uppercase tracking-wider">
                      Live Regulatory Audit Ledger
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    IT Act Sec 43A Audited
                  </span>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {auditEvents.length > 0 ? (
                    auditEvents.map((evt) => (
                      <div key={evt.id} className="p-3 hover:bg-slate-50 rounded-lg transition-colors text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-mono text-[11px]">
                            {evt.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px] flex items-center space-x-2">
                          <span>By: <strong>{evt.actor?.name || 'Council AI Engine'}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{evt.entityType}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      Audit ledger actively recording council activity.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500">Cryptographically Chained Audit Stream</span>
                <Link to="/review-queue" className="font-bold text-[#002147] hover:underline flex items-center space-x-1">
                  <span>Open Full Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

