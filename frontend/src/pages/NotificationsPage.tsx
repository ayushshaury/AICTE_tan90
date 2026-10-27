import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, Check, CheckCheck, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { AicteEmblem } from '../components/AicteEmblem';
import { useLanguage } from '../context/LanguageContext';

export const NotificationsPage: React.FC = () => {
  const { isHindi } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await fetchNotifications();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await fetchNotifications();
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="space-y-6">
      {/* Official Government Dispatch Header */}
      <div className="bg-gradient-to-r from-[#002147] via-[#082b59] to-[#001733] text-white p-6 rounded-xl border-t-4 border-[#FF9933] shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
              <AicteEmblem size={38} className="brightness-125" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-[#FFB366] uppercase">
                {isHindi ? 'अखिल भारतीय तकनीकी शिक्षा परिषद | Regulatory Communications' : 'All India Council for Technical Education | Regulatory Communications'}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {isHindi ? 'वैधानिक सूचनाएँ एवं संवीक्षा Dispatches' : 'Statutory Notices & Scrutiny Dispatches'}
              </h1>
              <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                Official electronic communications regarding automated document analysis findings, deficiency memos, hearing notices, and approval status updates under APH 2026-27.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded bg-[#E65100] text-white text-[11px] font-bold shadow-sm">
                {unreadCount} Unread Notice{unreadCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>Acknowledge All</span>
            </button>
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-200" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#002147]" />
            <span>Official Gazette Bulletins & Dispatch Log</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-normal">
            Total Dispatches: {notifications.length}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#002147] animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Retrieving official gazette dispatches...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Dispatch Inbox Cleared</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No outstanding deficiency memos or scrutiny dispatches require your immediate attention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const isUnread = !n.readAt;
              const isAlert = n.title?.toLowerCase().includes('critical') || n.title?.toLowerCase().includes('fail');
              return (
                <div
                  key={n.id}
                  className={`p-5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4 ${
                    isUnread ? 'bg-amber-50/20 border-l-4 border-l-[#FF9933]' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                      isAlert ? 'bg-rose-100 text-rose-700' : isUnread ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAlert ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="px-2 py-0.5 rounded bg-[#E65100]/10 text-[#E65100] text-[10px] font-bold border border-[#E65100]/20 uppercase">
                            Action Pending
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          DISPATCH #{n.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                        {n.message}
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                        <span>Filing Date: {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</span>
                        <span>•</span>
                        <span className="text-slate-500">Statutory Scrutiny Module</span>
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 text-xs shrink-0 shadow-sm transition-colors"
                      title="Mark as Acknowledged"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
