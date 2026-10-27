import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { Scale, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RulesPage: React.FC = () => {
  const { user } = useAuth();
  const { isHindi } = useLanguage();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await api.updateRule(ruleId, { enabled: !currentEnabled });
      await fetchRules();
    } catch (err: any) {
      alert(`Failed to update rule state: ${err.message}`);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#E65100] font-mono">
            {isHindi ? 'संविधिक अनुपालन नियम विन्यास (APH 2026-27 Compliance Rules)' : 'AICTE APH 2026-27 COMPLIANCE HEURISTICS'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147]">
            {isHindi ? 'वैधानिक विनियामक अनुपालन नियम इंजन' : 'Regulatory Compliance Rule Engine'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Statutory validation rules evaluated against institutional submissions. Rule state transitions are cryptographically versioned and audited.
          </p>
        </div>
        <button
          onClick={fetchRules}
          className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#002147]" />
          <span>Refresh Rules</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading regulatory rules...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-sky-600" />
                    <span className="font-mono text-xs font-semibold text-slate-500">{rule.ruleCode}</span>
                    <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={rule.severity} />
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      v{rule.version}
                    </span>
                    {rule.enabled ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{rule.description}</p>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div><strong>Remediation Guidance:</strong> {rule.remediationText}</div>
                  <div><strong>Applicable Scope:</strong> {Array.isArray(rule.applicationCategories) ? rule.applicationCategories.join(', ') : 'ALL'}</div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.enabled)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        rule.enabled
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {rule.enabled ? 'Deactivate Rule' : 'Activate Rule'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
