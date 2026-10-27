import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Inbox, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ReviewQueuePage: React.FC = () => {
  const { isHindi } = useLanguage();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getAttentionQueue();
      setQueue(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF9933] font-mono flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
            <span>{isHindi ? 'संवीक्षा कार्य कतार (Gazetted Officer Work Queue)' : 'GAZETTED OFFICER WORK QUEUE'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147] mt-0.5">
            {isHindi ? 'राजपत्रित अधिकारी संवीक्षा कार्य कतार' : 'Scrutiny Officer Work Queue'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Prioritized institutional submissions under active scrutiny, awaiting rectification, or flagged with critical compliance findings.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#002147]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading scrutiny queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">Queue is clear</h3>
            <p className="text-xs text-slate-400">No applications currently require urgent scrutiny action.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((app) => (
              <div key={app.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">{app.referenceNumber}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="text-sm font-bold text-slate-900">{app.institution.name}</div>
                  <div className="text-xs text-slate-500">
                    Category: <strong>{app.category.replace(/_/g, ' ')}</strong> • Code: <span className="font-mono text-sky-700">{app.institution.institutionCode}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {(app._count?.findings ?? 0) > 0 && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{app._count?.findings} Open Findings</span>
                    </span>
                  )}
                  <Link
                    to={`/applications/${app.id}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Start Scrutiny</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
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
