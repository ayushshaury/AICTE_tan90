import React from 'react';
import { ExternalLink, Clock, Phone, Mail, MapPin } from 'lucide-react';
import { EmblemOfIndia } from './EmblemOfIndia';
import { AicteEmblem } from './AicteEmblem';
import { useLanguage } from '../context/LanguageContext';

export const GovFooter: React.FC = () => {
  const { isHindi } = useLanguage();
  return (
    <footer className="bg-[#0B1E36] text-slate-300 border-t-4 border-[#FF9933] text-xs">
      {/* Top Banner inside Footer */}
      <div className="bg-[#081526] py-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <AicteEmblem size={44} />
              <div>
                <div className="text-white font-bold text-sm tracking-wide">
                  {isHindi ? 'अखिल भारतीय तकनीकी शिक्षा परिषद | All India Council for Technical Education' : 'All India Council for Technical Education'}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {isHindi ? '(शिक्षा मंत्रालय, भारत सरकार के अधीन एक संविधिक निकाय)' : '(A Statutory Body Under Ministry of Education, Government of India)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: National Portals */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-semibold uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Government of India Portals
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>National Portal of India (india.gov.in)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.aicte-india.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>AICTE Central Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.education.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>Ministry of Education (MoE)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.digitalindia.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>Digital India Programme</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.digilocker.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>DigiLocker Document Verification</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Regulatory Guidelines */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-semibold uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Regulatory Framework & Scrutiny
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li>
                <span className="text-slate-400">Approval Process Handbook (APH 2026-27)</span>
              </li>
              <li>
                <span className="text-slate-400">Mandatory Land & Building Stability Norms</span>
              </li>
              <li>
                <span className="text-slate-400">Fire Safety Certificate Regulatory Mandates</span>
              </li>
              <li>
                <span className="text-slate-400">Affidavit of Stamp Paper Authenticity</span>
              </li>
              <li>
                <a
                  href="https://pgportal.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>CPGRAMS Centralized Grievance Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: GIGW Legal & Accessibility Policies */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-semibold uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Policies & Compliance
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li>
                <button
                  onClick={() => alert('Terms & Conditions: This portal is for official AICTE institutional scrutiny. All actions are cryptographically logged.')}
                  className="hover:text-white text-left transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Privacy Policy: Uploaded institutional documents are privately stored and never indexed by public search engines.')}
                  className="hover:text-white text-left transition-colors"
                >
                  Privacy & Data Retention Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Copyright Policy: Content published on this portal is under Government of India Open Data / AICTE copyright.')}
                  className="hover:text-white text-left transition-colors"
                >
                  Copyright Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Accessibility Statement: Built adhering to Guidelines for Indian Government Websites (GIGW 2.0).')}
                  className="hover:text-white text-left transition-colors"
                >
                  Website Accessibility Statement
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Audit Guarantee: Every analysis event produces an append-only SHA-256 HMAC record.')}
                  className="hover:text-white text-left transition-colors"
                >
                  Cryptographic Audit Guarantee
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: National Council Secretariat & Helpdesk */}
          <div className="space-y-3">
            <h4 className="text-amber-300 font-semibold uppercase tracking-wider text-xs border-b border-slate-700 pb-1.5">
              Council Secretariat & Contact
            </h4>
            <div className="space-y-2.5 text-[11px] text-slate-300">
              <div className="flex items-start space-x-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Nelson Mandela Marg, Vasant Kunj, New Delhi – 110070</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Toll-Free Helpline: <strong className="font-mono text-white">1800-11-2244</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Email: <span className="font-mono text-white">helpdesk@aicte-india.org</span></span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                Operating Hours: 09:00 AM – 05:30 PM (IST), Monday to Friday
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="bg-[#050D18] py-4 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-white shrink-0 shadow-xs flex items-center justify-center p-0.5 overflow-hidden">
              <EmblemOfIndia size={18} className="h-4.5 w-auto" />
            </div>
            <span>
              © 2026 All India Council for Technical Education (AICTE), New Delhi. All Rights Reserved.
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[10px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Last Updated: 25-10-2026</span>
            </span>
            <span>•</span>
            <span>Certified GIGW 2.0 Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
