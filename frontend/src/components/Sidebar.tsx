import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Inbox,
  ShieldCheck,
  Scale,
  BarChart3,
  Bell,
  History,
  Settings,
  Landmark,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Role } from '../types';

interface NavSection {
  title: string;
  items: {
    name: string;
    path: string;
    icon: React.ElementType;
    badge?: string;
    roles?: Role[];
  }[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { isHindi } = useLanguage();

  const sections: NavSection[] = [
    {
      title: isHindi ? 'केंद्रीय पंजीका (Central Registry)' : 'Registry & Applications',
      items: [
        { name: isHindi ? 'संवीक्षा डैशबोर्ड (Dashboard)' : 'Scrutiny Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: isHindi ? 'आवेदन पंजीका (Applications Register)' : 'Application Registry', path: '/applications', icon: FileText },
        {
          name: isHindi ? 'नया आवेदन (New Filing)' : 'New Regulatory Filing',
          path: '/applications/new',
          icon: PlusCircle,
          roles: ['APPLICANT', 'ADMIN'],
        },
      ],
    },
    {
      title: isHindi ? 'संवीक्षा एवं अनुपालन (Scrutiny & Compliance)' : 'Scrutiny & Compliance',
      items: [
        {
          name: isHindi ? 'अधिकारी कार्य कतार (Review Queue)' : 'Officer Review Queue',
          path: '/review-queue',
          icon: Inbox,
          roles: ['OFFICER', 'SENIOR_REVIEWER', 'ADMIN'],
        },
        { name: isHindi ? 'स्रोत सत्यापन गेटवे (Source Verification)' : 'Source Verification', path: '/verification', icon: ShieldCheck },
        {
          name: isHindi ? 'APH अनुपालन नियम (Compliance Rules)' : 'Compliance Rules (APH)',
          path: '/rules',
          icon: Scale,
          roles: ['ADMIN', 'SENIOR_REVIEWER'],
        },
      ],
    },
    {
      title: isHindi ? 'ऑडिट एवं रिकॉर्ड्स (Audit & Records)' : 'Audit & Records',
      items: [
        {
          name: isHindi ? 'राजपत्र प्रतिवेदन (Scrutiny Reports)' : 'Scrutiny Reports',
          path: '/reports',
          icon: BarChart3,
          roles: ['OFFICER', 'SENIOR_REVIEWER', 'ADMIN', 'DEMO_VIEWER'],
        },
        {
          name: isHindi ? 'ऑडिट टाइमलाइन (Audit Trail)' : 'Audit Timeline',
          path: '/audit',
          icon: History,
          roles: ['OFFICER', 'SENIOR_REVIEWER', 'ADMIN'],
        },
        { name: isHindi ? 'आधिकारिक बुलेटिन (Official Bulletins)' : 'Official Bulletins', path: '/notifications', icon: Bell },
      ],
    },
    {
      title: isHindi ? 'सिस्टम प्रबंधन (System Management)' : 'System Management',
      items: [
        { name: isHindi ? 'सिस्टम स्थिति एवं AI (System & AI)' : 'System Status & AI', path: '/settings', icon: Settings },
      ],
    },
  ];

  const filterItem = (item: { roles?: Role[] }) => {
    if (!item.roles) return true;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return item.roles.includes(user.role);
  };

  return (
    <aside className="w-64 bg-[#002147] text-slate-200 border-r border-slate-700/60 flex flex-col shrink-0 min-h-[calc(100vh-8.5rem)] shadow-md select-none">
      {/* Sidebar Header */}
      <div className="p-4 bg-[#001733] border-b border-slate-700/80 flex items-center space-x-2.5">
        <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <div className="text-[11px] font-bold tracking-wider text-white uppercase">
            {isHindi ? 'आधिकारिक पोर्टल डेस्क (Official Desk)' : 'OFFICIAL DESK NAVIGATION'}
          </div>
          <div className="text-[9px] text-amber-300 font-mono">
            {user?.role ? user.role.replace(/_/g, ' ') : 'AUTHORIZED SESSION'}
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {sections.map((section, sIdx) => {
          const visibleItems = section.items.filter(filterItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 border-b border-slate-700/50 mb-1.5 flex items-center justify-between">
                <span>{section.title}</span>
                <span className="text-[8px] font-mono text-slate-400">SEC {sIdx + 1}</span>
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#003366] text-white border-l-[3px] border-[#FF9933] font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-slate-300 group-hover:text-amber-300 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer Security Seal */}
      <div className="p-3 bg-[#001733] border-t border-slate-700/80 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>AICTE 90* — OFFICIAL ACCESS ONLY</span>
        </div>
        <p className="text-[9px] text-slate-400 leading-tight">
          All actions are audited under Sec 43A of the IT Act, 2000.
        </p>
      </div>
    </aside>
  );
};
