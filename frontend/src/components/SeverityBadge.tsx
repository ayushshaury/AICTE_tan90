import React from 'react';
import type { Severity } from '../types';

interface SeverityBadgeProps {
  severity: Severity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const getStyle = (sev: Severity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'LOW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INFO':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border uppercase tracking-wider font-medium ${getStyle(
        severity
      )}`}
    >
      {severity}
    </span>
  );
};
