import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Search,
  Filter,
  PlusCircle,
  Download,
  ArrowRight,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const { isHindi } = useLanguage();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (severity) params.append('severity', severity);
      params.append('page', String(page));
      params.append('limit', '10');

      const data = await api.getApplications(params.toString());
      setApplications(data.items);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, category, status, severity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('aicte_token');
      const response = await fetch('http://localhost:4000/api/v1/reports/applications.csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aicte_applications_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions: Central Application Registry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF9933] font-mono flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
            <span>{isHindi ? 'संस्थागत आवेदन पंजीका (Central Scrutiny Registry)' : 'CENTRAL SCRUTINY REGISTRY'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147] mt-0.5">
            {isHindi ? 'संस्थागत अनुमोदन आवेदन मास्टर पंजीका' : 'Institutional Application Registry'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            AICTE Approval Process Handbook (APH 2026-27) • Official Scrutiny & Regulatory Verification Desk
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {(user?.role === 'OFFICER' || user?.role === 'SENIOR_REVIEWER' || user?.role === 'ADMIN') && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
              title="Export official scrutiny records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#002147]" />
              <span>Export Gazette (CSV)</span>
            </button>
          )}

          {(user?.role === 'APPLICANT' || user?.role === 'ADMIN') && (
            <Link
              to="/applications/new"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border border-amber-500/40"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>New Submission</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, institution name or code..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Categories</option>
            <option value="EOA">Extension of Approval (EoA)</option>
            <option value="NEW_PROGRAMME">New Programme / Course</option>
            <option value="INTAKE_CHANGE">Intake Change</option>
            <option value="INSTITUTION_DETAIL_CHANGE">Detail Change</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PROCESSING">Processing</option>
            <option value="UNDER_SCRUTINY">Under Scrutiny</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="ESCALATED">Escalated</option>
            <option value="COMPLETED_IN_PROTOTYPE">Completed in Prototype</option>
          </select>

          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Any Finding Severity</option>
            <option value="CRITICAL">Has Critical Findings</option>
            <option value="HIGH">Has High Findings</option>
            <option value="MEDIUM">Has Medium Findings</option>
          </select>

          {(category || status || severity || search) && (
            <button
              onClick={() => {
                setCategory('');
                setStatus('');
                setSeverity('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
            <p className="text-xs text-slate-500">Loading applications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 text-sm">
            <p>{error}</p>
            <button
              onClick={fetchApplications}
              className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No institutional submissions match your active filter criteria. Try resetting filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4 text-center">Docs</th>
                  <th className="py-3 px-4 text-center">Findings</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 text-xs">
                      {app.referenceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 text-xs sm:text-sm">
                        {app.institution.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {app.institution.institutionCode} • {app.institution.state}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {app.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {app.assignedOfficer?.name || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                      {app._count?.documents ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {(app._count?.findings ?? 0) > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {app._count?.findings} open
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Clean</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition-colors"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{applications.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.total}</span> submissions
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
