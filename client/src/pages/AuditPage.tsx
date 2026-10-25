import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { History, RefreshCw, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AuditPage: React.FC = () => {
  const { isHindi } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditEvents();
      setEvents(data.items);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#E65100] font-mono">
            {isHindi ? 'अपरिवर्तनीय संवीक्षा एवं शासन ऑडिट लॉग (Audit Trail)' : 'IMMUTABLE CRYPTOGRAPHIC AUDIT LOG'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147]">
            {isHindi ? 'राष्ट्रीय संवीक्षा कस्टडी श्रृंखला एवं सिस्टम इवेंट लेजर' : 'Statutory Audit & Governance Trail'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Immutable, append-only chronological log of all gazetted officer reviews, AI scrutiny dispatches, and workflow transitions (Sec 43A IT Act).
          </p>
        </div>
        <button
          onClick={fetchAuditEvents}
          className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#002147]" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading audit trail...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No events recorded</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{e.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-medium text-slate-800">{e.actor?.name || 'System Auto-Engine'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{e.actor?.role || 'SYSTEM'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {e.entityType} ({e.entityId.substring(0, 8)}...)
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono max-w-xs truncate">
                      {e.metadataJson ? JSON.stringify(e.metadataJson) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500 font-mono">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
