import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AicteEmblem } from '../components/AicteEmblem';
import { useLanguage } from '../context/LanguageContext';

export const NotFoundPage: React.FC = () => {
  const { isHindi } = useLanguage();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#002147] to-[#082b59] flex items-center justify-center p-2.5 shadow-md border-2 border-[#FF9933]/50">
        <AicteEmblem size={44} className="brightness-125" />
      </div>
      <div className="space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#E65100]">
          {isHindi ? 'अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE) | Government of India' : 'ALL INDIA COUNCIL FOR TECHNICAL EDUCATION | GOVERNMENT OF INDIA'}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isHindi ? '404 — विनियामक रिकॉर्ड अथवा पृष्ठ नहीं मिला' : '404 — Regulatory Record or Page Not Found'}
        </h1>
      </div>
      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
        The requested portal endpoint, compliance docket, or gazetted document record does not exist or has been archived in compliance with National Record Retention Norms.
      </p>
      <div className="pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-semibold shadow-sm transition-all border border-[#FF9933]/30"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF9933]" />
          <span>Return to Central Scrutiny Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
