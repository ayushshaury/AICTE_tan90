import React from 'react';
import type { ApplicationStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'NOT_REQUESTED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'QUEUED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PROCESSING':
        return 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse';
      case 'REQUIRES_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'SUCCEEDED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'FAILED':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNDER_SCRUTINY':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'ACTION_REQUIRED':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'RESUBMITTED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ESCALATED':
        return 'bg-red-50 text-red-800 border-red-300 font-semibold';
      case 'COMPLETED_IN_PROTOTYPE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'SIMULATED':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatText = (st: string) => {
    switch (st) {
      case 'NOT_REQUESTED':
        return 'Uploaded';
      case 'REQUIRES_REVIEW':
        return 'Review Required';
      case 'SUCCEEDED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      default:
        return st.replace(/_/g, ' ');
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md capitalize tracking-wide ${sizeClasses} ${getBadgeStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
};
