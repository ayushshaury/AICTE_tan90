import React, { useState } from 'react';
import { Volume2, PhoneCall } from 'lucide-react';
import { EmblemOfIndia } from './EmblemOfIndia';
import { useLanguage } from '../context/LanguageContext';

interface GovUtilityBarProps {
  onFontSizeChange?: (delta: number) => void;
  onContrastToggle?: () => void;
}

export const GovUtilityBar: React.FC<GovUtilityBarProps> = ({
  onFontSizeChange,
  onContrastToggle,
}) => {
  const { language, setLanguage, isHindi, t } = useLanguage();
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);

  const handleFontChange = (delta: number) => {
    const nextLevel = Math.max(-1, Math.min(2, fontSizeLevel + delta));
    setFontSizeLevel(nextLevel);
    if (onFontSizeChange) onFontSizeChange(nextLevel);
    // Apply font size directly to document root
    const root = document.documentElement;
    if (nextLevel === -1) root.style.fontSize = '92%';
    else if (nextLevel === 0) root.style.fontSize = '100%';
    else if (nextLevel === 1) root.style.fontSize = '108%';
    else if (nextLevel === 2) root.style.fontSize = '116%';
  };

  const handleContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (onContrastToggle) onContrastToggle();
    document.documentElement.classList.toggle('high-contrast-mode', next);
  };

  return (
    <div className="w-full select-none text-xs border-b border-slate-200">
      {/* 1. Indian National Tricolor Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#FF9933]" title="Saffron" />
        <div className="w-1/3 bg-[#FFFFFF]" title="White" />
        <div className="w-1/3 bg-[#138808]" title="Green" />
      </div>

      {/* 2. Official Portal Utility Bar */}
      <div className="bg-[#0B1E36] text-slate-200 px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60">
        {/* Left: Government of India & Ministry */}
        <div className="flex items-center space-x-3 text-[11px] sm:text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-white shrink-0 shadow-xs flex items-center justify-center p-0.5 overflow-hidden border border-slate-300">
              <EmblemOfIndia size={20} className="h-5 w-auto" />
            </div>
            <div className="leading-tight">
              {isHindi ? (
                <>
                  <span className="font-semibold text-white tracking-wide">भारत सरकार</span>
                  <span className="text-slate-400 mx-1.5 hidden xs:inline">|</span>
                  <span className="text-slate-300 font-medium hidden xs:inline">Government of India</span>
                </>
              ) : (
                <span className="font-semibold text-white tracking-wide">Government of India</span>
              )}
            </div>
          </div>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <div className="leading-tight hidden sm:block">
            {isHindi ? (
              <>
                <span className="text-amber-300 font-semibold">शिक्षा मंत्रालय</span>
                <span className="text-slate-400 mx-1.5">|</span>
                <span className="text-slate-300">Ministry of Education</span>
              </>
            ) : (
              <span className="text-amber-300 font-semibold">Ministry of Education</span>
            )}
          </div>
        </div>

        {/* Right: Accessibility Controls & Government Helpline */}
        <div className="flex items-center space-x-2 sm:space-x-4 text-[11px]">
          {/* Skip to Main Content (GIGW) */}
          <a
            href="#main-content"
            className="hidden md:inline-block text-slate-300 hover:text-white hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 px-1.5 py-0.5 rounded"
          >
            Skip to Main Content
          </a>

          {/* Screen Reader Access */}
          <button
            onClick={() => alert('Screen Reader Optimization is active on all AICTE 90* portal forms and tables.')}
            className="hidden lg:flex items-center space-x-1 text-slate-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            title="Screen Reader Access"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Screen Reader</span>
          </button>

          {/* Text Resizing Controls: A- A A+ */}
          <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 px-1 py-0.5 space-x-1">
            <button
              onClick={() => handleFontChange(-1)}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors ${
                fontSizeLevel === -1 ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Decrease Font Size (A-)"
            >
              A-
            </button>
            <button
              onClick={() => handleFontChange(0 - fontSizeLevel)}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors ${
                fontSizeLevel === 0 ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Standard Font Size (A)"
            >
              A
            </button>
            <button
              onClick={() => handleFontChange(1)}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors ${
                fontSizeLevel > 0 ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Increase Font Size (A+)"
            >
              A+
            </button>
          </div>

          {/* High Contrast Mode Toggle */}
          <button
            onClick={handleContrastToggle}
            className={`px-2 py-0.5 rounded border transition-colors font-medium text-[10px] ${
              highContrast
                ? 'bg-amber-400 text-black border-amber-300 font-bold'
                : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle High Contrast Mode"
          >
            {highContrast ? 'High Contrast On' : 'Contrast'}
          </button>

          {/* Language Toggle: English / हिन्दी */}
          <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 p-0.5 text-[10px]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                language === 'en' ? 'bg-[#FF9933] text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Switch to Pure English Mode"
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                language === 'hi' ? 'bg-[#FF9933] text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="हिन्दी / English मिश्रित मोड"
            >
              हिन्दी
            </button>
          </div>

          {/* National Helpdesk Hotline */}
          <div className="hidden xl:flex items-center space-x-1.5 text-amber-300 pl-2 border-l border-slate-700">
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="font-mono font-semibold">{t('toll_free')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
