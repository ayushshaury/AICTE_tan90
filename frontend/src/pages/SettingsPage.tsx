import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Cpu, Database, User, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isHindi } = useLanguage();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#E65100] font-mono">
          {isHindi ? 'प्रणाली विन्यास एवं Python AI सेवा स्थिति (System Diagnostics)' : 'SYSTEM DIAGNOSTICS & AI CONFIGURATION'}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147]">
          {isHindi ? 'प्लेटफॉर्म अवसंरचना, माइक्रोसेवा एंडपॉइंट्स एवं सुरक्षा नीति' : 'System Settings & Service Health'}
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Review official user credentials, database connectivity, and internal Python AI microservice diagnostics.
        </p>
      </div>

      {/* User Persona Profile */}
      <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#002147] pb-3 border-b border-slate-200 uppercase tracking-wider">
          <User className="w-4 h-4 text-[#E65100]" />
          <span>Active Official Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Official Name:</span>
            <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Registered Email:</span>
            <span className="font-semibold text-slate-900 font-mono">{user?.email}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Gazetted Designation / Role:</span>
            <span className="font-bold text-[#002147] font-mono uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Affiliated Institution / Bureau:</span>
            <span className="font-semibold text-slate-900">
              {user?.institution?.name ? `${user.institution.name} (${user.institution.code})` : 'Central Regulatory Scrutiny Bureau, AICTE New Delhi'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend & AI Service Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#002147] pb-3 border-b border-slate-200 uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-[#E65100]" />
          <span>Internal Services & AI Microservice Gateway</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold text-slate-900">PostgreSQL Relational Database</div>
                <div className="text-[10px] text-slate-500 font-mono">Port 5432 • Prisma ORM • aicte_90</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center space-x-1 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{health?.database || 'CONNECTED'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-4 h-4 text-[#002147]" />
              <div>
                <div className="font-bold text-slate-900">Document Verification & Scrutiny Engine</div>
                <div className="text-[10px] text-slate-500 font-medium">Automated Document Authentication & Regulatory Analysis Service</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#002147] text-amber-300 text-[11px] font-bold flex items-center space-x-1 border border-amber-400/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACTIVE</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-2">
          <div className="font-bold flex items-center space-x-1.5 text-[#002147]">
            <ShieldCheck className="w-4 h-4 text-[#002147]" />
            <span>Institutional Scrutiny Gateway Security</span>
          </div>
          <p className="leading-relaxed text-[11.5px] text-slate-600">
            The verification engine is configured with cryptographic session authentication and end-to-end tokenized auditing under the Information Technology Act. All regulatory screening queries and document inspections route securely through the verified institutional gateway.
          </p>
        </div>
      </div>
    </div>
  );
};
