import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface EmblemProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

export const EmblemOfIndia: React.FC<EmblemProps> = ({ className = 'h-12 w-auto', size = 48, monochrome = false }) => {
  let isHindi = false;
  try {
    const lang = useLanguage();
    isHindi = lang.isHindi;
  } catch {
    isHindi = false;
  }
  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none shrink-0 ${className}`}
      title={isHindi ? "भारत का राज्य प्रतीक (सत्यमेव जयते)" : "State Emblem of India"}
    >
      <img
        src="/emblem-of-india.png"
        alt={isHindi ? "भारत का राज्य प्रतीक" : "State Emblem of India"}
        style={{ height: `${size}px`, width: 'auto' }}
        className={`object-contain select-none ${monochrome ? 'opacity-90' : ''}`}
        loading="eager"
      />
    </div>
  );
};
