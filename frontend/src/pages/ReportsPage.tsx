import React from 'react';
import { Download, FileSpreadsheet, ShieldAlert, BarChart3 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ReportsPage: React.FC = () => {
  const { isHindi } = useLanguage();
  const downloadReport = async (filename: string, endpoint: string) => {
    try {
      const token = localStorage.getItem('aicte_token');
      const response = await fetch(`http://localhost:4000/api/v1/reports/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export generation failed.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#E65100] font-mono">
          {isHindi ? 'राजपत्र एवं संवीक्षा प्रतिवेदन (Official Gazette & Extracts)' : 'OFFICIAL GAZETTE & AUDIT EXTRACTS'}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002147]">
          {isHindi ? 'केंद्रीय संवीक्षा प्रतिवेदन एवं राजपत्र मिसिलें' : 'Scrutiny Reports & Gazette Analytics'}
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Export standardized AICTE regulatory audit extracts, institutional compliance dossiers, and finding matrices in CSV format.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Applications Registry Export</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consolidated master report of all institutional applications, workflow statuses, assigned officers, submission dates, and open findings.
            </p>
          </div>
          <button
            onClick={() => downloadReport('aicte_applications_export.csv', 'applications.csv')}
            className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Applications CSV</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Findings & Non-Compliance Matrix</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Detailed export of all automated rule findings, severity classifications, document citations, reviewer notes, and resolution actions.
            </p>
          </div>
          <button
            onClick={() => downloadReport('aicte_findings_export.csv', 'findings.csv')}
            className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Findings CSV</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
        <BarChart3 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>Security Notice on CSV Exports:</strong> Data exported through AICTE 90* incorporates automatic CSV formula sanitization to safeguard spreadsheet applications against DDE / formula injection attacks.
        </div>
      </div>
    </div>
  );
};
