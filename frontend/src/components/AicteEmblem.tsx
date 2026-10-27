import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface AicteEmblemProps {
  size?: number;
  className?: string;
}

export const AicteEmblem: React.FC<AicteEmblemProps> = ({ size = 48, className = '' }) => {
  let isHindi = false;
  try {
    const lang = useLanguage();
    isHindi = lang.isHindi;
  } catch {
    isHindi = false;
  }
  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      title={isHindi ? "अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE)" : "All India Council for Technical Education (AICTE)"}
    >
      <img
        src="/aicte-logo.png"
        alt={isHindi ? "एआईसीटीई आधिकारिक लोगो" : "AICTE Official Logo"}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="object-contain drop-shadow-sm select-none"
        loading="eager"
      />
    </div>
  );
};
