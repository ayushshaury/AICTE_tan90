import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, Info, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const VerificationPage: React.FC = () => {
  const { isHindi } = useLanguage();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const data = await api.getVerifications();
      setVerifications(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#E65100] font-mono">
            {isHindi ? 'स्रोत एवं निर्गमन प्राधिकारी सत्यापन गेटवे (Verification Gateway)' : 'ISSUER VERIFICATION GATEWAY'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147]">
            {isHindi ? 'स्रोत एवं विनियामक प्राधिकारी सत्यापन' : 'Source & Statutory Issuer Verification'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Independent checks against affiliating state universities, municipal fire directorates, and statutory land registries.
          </p>
        </div>
        <button
          onClick={fetchVerifications}
          className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#002147]" />
          <span>Refresh Records</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-start space-x-3 text-xs text-teal-900">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <strong>Prototype Simulation Disclosure:</strong> Source verification checks below are marked as <strong>SIMULATED</strong>. In production deployment, these adapters integrate with authorized REST APIs or DigiLocker institutional gateways. No restricted live portals are scraped.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading verifications...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No verifications conducted yet</h3>
            <p className="text-xs text-slate-400">Run issuer verifications from an application document workspace.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {verifications.map((v) => (
              <div key={v.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900 text-sm">{v.issuerName}</span>
                    <span className="text-xs text-slate-400">({v.verificationMethod})</span>
                  </div>
                  <div>
                    <StatusBadge status={v.status} />
                  </div>
                </div>

                <p className="text-xs text-slate-700">{v.resultSummary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Institution:</span>
                    <span className="font-medium text-slate-800">{v.application?.institution?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Document Checked:</span>
                    <span className="font-medium text-slate-800">{v.document?.originalFilename}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mode:</span>
                    <span className="font-mono text-teal-700 font-semibold">{v.providerMode}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Timestamp: {new Date(v.createdAt).toLocaleString()} • Requested by: {v.createdBy?.name}</span>
                  <Link
                    to={`/applications/${v.applicationId}`}
                    className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    <span>View Application</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
