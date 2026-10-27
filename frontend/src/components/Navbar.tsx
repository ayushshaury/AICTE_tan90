import React, { useState, useEffect } from 'react';
import { Bell, LogOut, UserCheck, CheckCircle2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { EmblemOfIndia } from './EmblemOfIndia';
import { AicteEmblem } from './AicteEmblem';
import { AnomalyDetectionHUD } from './AnomalyDetectionHUD';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isHindi } = useLanguage();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [anomalyHubOpen, setAnomalyHubOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((items: any[]) => {
          const unread = items.filter(n => !n.readAt).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user]);

  const getRoleBadgeLabel = (role: string) => {
    if (isHindi) {
      switch (role) {
        case 'OFFICER':
          return 'संवीक्षा अधिकारी (Gazetted Officer)';
        case 'SENIOR_REVIEWER':
          return 'क्षेत्रीय निदेशक (Regional Director)';
        case 'APPLICANT':
          return 'अधिकृत आवेदक (Institute Principal)';
        case 'ADMIN':
          return 'राष्ट्रीय पोर्टल प्रशासक (National Admin)';
        case 'DEMO_VIEWER':
          return 'अधिकृत ऑडिट प्रेक्षक (Audit Observer)';
        default:
          return role.replace(/_/g, ' ');
      }
    } else {
      switch (role) {
        case 'OFFICER':
          return 'Scrutiny Officer (Gazetted)';
        case 'SENIOR_REVIEWER':
          return 'Regional Director / Senior Reviewer';
        case 'APPLICANT':
          return 'Institutional Applicant';
        case 'ADMIN':
          return 'National Portal Administrator';
        case 'DEMO_VIEWER':
          return 'Authorized Audit Observer';
        default:
          return role.replace(/_/g, ' ');
      }
    }
  };

  return (
    <header className="bg-white text-slate-800 border-b-[3px] border-[#FF9933] sticky top-0 z-40 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Institutional Branding: AICTE Crest + State Emblem + Hierarchy */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Link to="/dashboard" className="flex items-center space-x-3 sm:space-x-4 group">
              {/* AICTE Official Cogwheel Crest */}
              <div className="shrink-0 flex items-center justify-center">
                <AicteEmblem size={46} className="transition-transform group-hover:scale-102" />
              </div>

              {/* Dignified Vertical Divider */}
              <div className="hidden sm:block h-10 w-px bg-slate-200 shrink-0" />

              {/* State Emblem of India (Lion Capital with Satyameva Jayate) */}
              <div className="shrink-0 flex items-center justify-center">
                <EmblemOfIndia size={44} className="h-11 w-auto transition-transform group-hover:scale-102" />
              </div>

              {/* Institutional Typography & Department Hierarchy */}
              <div className="text-left min-w-0">
                {isHindi ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="text-[13px] sm:text-[15px] font-bold text-[#002147] tracking-tight leading-tight group-hover:text-[#B45309] transition-colors">
                        अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE 90*)
                      </div>
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#002147] text-amber-300 tracking-wider border border-amber-400/40 shrink-0">
                        AICTE 90*
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-[#B45309] uppercase tracking-wide leading-tight">
                      ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium pt-0.5">
                      शिक्षा मंत्रालय, भारत सरकार के अधीन सांविधिक निकाय
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="text-[13px] sm:text-[16px] font-bold text-[#002147] tracking-tight leading-tight group-hover:text-[#003366] transition-colors uppercase">
                        ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                      </div>
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#002147] text-amber-300 tracking-wider border border-amber-400/40 shrink-0">
                        AICTE 90*
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-600 tracking-normal leading-tight pt-0.5">
                      Statutory Body under Ministry of Education, Government of India
                    </div>
                  </>
                )}
              </div>
            </Link>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Demo Specimen & Anomaly Scanner Button */}
            <button
              onClick={() => setAnomalyHubOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-700 hover:to-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:scale-102 border border-red-400/40"
              title="Open AICTE Demo Certificates & Anomaly Scanner Hub"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span className="hidden sm:inline">Demo Files & Anomaly Scanner</span>
              <span className="sm:hidden">Demo Hub</span>
            </button>

            {/* Official Scrutiny Notifications */}
            <Link
              to="/notifications"
              className="relative p-2 text-slate-600 hover:text-[#002147] rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title="Official Scrutiny Alerts & Bulletins"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E65100] text-[10px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Official Session Profile */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#002147] text-amber-300 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-[#002147] flex items-center space-x-1">
                      <span>{user.name}</span>
                      <span title="Authorized Official">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-800 font-semibold leading-tight">
                      {getRoleBadgeLabel(user.role)}
                    </div>
                    {user.institution && (
                      <div className="text-[9.5px] text-slate-500 font-mono leading-tight">
                        {user.institution.name} ({user.institution.code})
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                  title="Sign out of Official Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cyber Anomaly Detection HUD & Demo Hub */}
      <AnomalyDetectionHUD
        isOpen={anomalyHubOpen}
        onClose={() => setAnomalyHubOpen(false)}
      />
    </header>
  );
};
