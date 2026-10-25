import React from 'react';
import { Outlet } from 'react-router-dom';
import { GovUtilityBar } from './GovUtilityBar';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GovFooter } from './GovFooter';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900 font-sans antialiased">
      {/* 1. Official Government Utility Bar with Tricolor & Accessibility */}
      <GovUtilityBar />

      {/* 2. Official AICTE & Ministry of Education Portal Navbar */}
      <Navbar />

      {/* 3. Portal Main Layout: Sidebar & Content */}
      <div className="flex flex-1">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl outline-none">
          <Outlet />
        </main>
      </div>

      {/* 5. Official GIGW 2.0 Compliant Footer */}
      <GovFooter />
    </div>
  );
};
