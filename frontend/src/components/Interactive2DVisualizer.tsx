import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  Info,
  ArrowRight,
} from 'lucide-react';

interface SeverityData {
  severity: string;
  count: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface Interactive2DVisualizerProps {
  findingsBySeverity?: SeverityData[];
  applicationsByStatus?: StatusData[];
  totalFindings?: number;
  totalApplications?: number;
}

const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; desc: string; action: string }
> = {
  CRITICAL: {
    label: 'Critical Priority',
    color: '#e11d48',
    bg: '#ffe4e6',
    border: '#f43f5e',
    desc: 'High regulatory jeopardy. Deficiencies in statutory land, safety, or forged documentation.',
    action: 'Mandatory scrutiny committee review required before any approval.',
  },
  HIGH: {
    label: 'High Priority',
    color: '#ea580c',
    bg: '#ffedd5',
    border: '#fb923c',
    desc: 'Substantial non-compliance. Deficiencies in faculty cadre ratio, expired certificates, or unverified intake.',
    action: 'Issue formal clarification memo with strict 7-day compliance window.',
  },
  MEDIUM: {
    label: 'Medium Priority',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fcd34d',
    desc: 'Moderate variance. Minor deviations in laboratory equipment, infrastructure declarations, or notary seals.',
    action: 'Recommend conditional acceptance subject to formal undertaking.',
  },
  LOW: {
    label: 'Low / Advisory',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#7dd3fc',
    desc: 'Advisory observation. Minor formatting anomalies, OCR clarity warnings, or non-critical declarations.',
    action: 'Advisory clearance. Note in permanent regulatory audit trail.',
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; order: number; desc: string }> = {
  DRAFT: { label: 'Draft Submission', color: '#64748b', order: 1, desc: 'Initial dossier preparation by applicant.' },
  SUBMITTED: { label: 'Pending Scrutiny', color: '#0284c7', order: 2, desc: 'Awaiting primary scrutiny officer allocation.' },
  UNDER_SCRUTINY: { label: 'Active Scrutiny', color: '#4f46e5', order: 3, desc: 'AI OCR validation and officer verification underway.' },
  DEFICIENCIES_FOUND: { label: 'Clarification Issued', color: '#d97706', order: 4, desc: 'Discrepancy notice issued to institution.' },
  ACTION_REQUIRED: { label: 'Action Required', color: '#dc2626', order: 5, desc: 'Critical regulatory non-compliance flagged.' },
  APPROVED: { label: 'Scrutiny Cleared', color: '#059669', order: 6, desc: 'All requirements verified against Approval Process Handbook.' },
  COMPLETED_IN_PROTOTYPE: { label: 'Completed (Archive)', color: '#10b981', order: 7, desc: 'Archived statutory order of record.' },
};

export const Interactive2DVisualizer: React.FC<Interactive2DVisualizerProps> = ({
  findingsBySeverity = [],
  applicationsByStatus = [],
  totalFindings = 0,
  totalApplications = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'severity' | 'pipeline' | 'radar'>('severity');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<any | null>(null);

  // Normalize findings data
  const severityChartData = useMemo(() => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const total = totalFindings || findingsBySeverity.reduce((acc, curr) => acc + curr.count, 0) || 1;

    return severities.map((sev) => {
      const found = findingsBySeverity.find((f) => f.severity.toUpperCase() === sev);
      const count = found ? found.count : 0;
      const cfg = SEVERITY_CONFIG[sev];
      return {
        severity: sev,
        name: cfg.label,
        count,
        percentage: Math.round((count / total) * 100),
        color: cfg.color,
        desc: cfg.desc,
        action: cfg.action,
      };
    });
  }, [findingsBySeverity, totalFindings]);

  // Normalize pipeline status data
  const pipelineChartData = useMemo(() => {
    const list = [...applicationsByStatus]
      .filter((item) => item.count > 0 || ['DRAFT', 'SUBMITTED', 'UNDER_SCRUTINY', 'APPROVED'].includes(item.status))
      .sort((a, b) => {
        const orderA = STATUS_CONFIG[a.status]?.order ?? 99;
        const orderB = STATUS_CONFIG[b.status]?.order ?? 99;
        return orderA - orderB;
      });

    return list.map((item) => {
      const cfg = STATUS_CONFIG[item.status] || {
        label: item.status.replace(/_/g, ' '),
        color: '#64748b',
        desc: 'Application status stage',
      };
      return {
        status: item.status,
        name: cfg.label,
        count: item.count,
        color: cfg.color,
        desc: cfg.desc,
      };
    });
  }, [applicationsByStatus]);

  // Category Compliance Sample Breakdown
  const categoryComplianceData = useMemo(() => [
    { category: 'Affidavit & Identity', compliant: 92, nonCompliant: 8, totalDocs: 142 },
    { category: 'Fire Safety NOC', compliant: 74, nonCompliant: 26, totalDocs: 118 },
    { category: 'Building Stability', compliant: 88, nonCompliant: 12, totalDocs: 124 },
    { category: 'Course Intake Limits', compliant: 81, nonCompliant: 19, totalDocs: 196 },
    { category: 'Land & Lease Title', compliant: 95, nonCompliant: 5, totalDocs: 110 },
  ], []);

  // Summary Metrics
  const criticalCount = severityChartData.find((s) => s.severity === 'CRITICAL')?.count || 0;
  const highCount = severityChartData.find((s) => s.severity === 'HIGH')?.count || 0;
  const totalIssues = severityChartData.reduce((acc, curr) => acc + curr.count, 0);
  const clearanceRate = totalFindings > 0 ? Math.max(0, 100 - Math.round(((criticalCount + highCount) / totalFindings) * 100)) : 100;

  // Custom Bar Chart Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#002147] text-white p-3 rounded-lg shadow-lg border border-slate-700 text-xs max-w-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
              <span>{data.name}</span>
            </span>
            <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {data.count} ({data.percentage}%)
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">{data.desc}</p>
          <div className="border-t border-white/10 pt-1 text-amber-300 text-[10px] font-medium">
            Action: {data.action}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pipeline Tooltip
  const CustomPipelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#002147] text-white p-3 rounded-lg shadow-lg border border-slate-700 text-xs max-w-xs space-y-1 z-50">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
              <span>{data.name}</span>
            </span>
            <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {data.count} Dockets
            </span>
          </div>
          <p className="text-slate-300 text-[11px]">{data.desc}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#002147] via-[#002d62] to-[#001833] text-white px-5 py-4 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-white">
                  Regulatory Scrutiny Analytics & Intelligence
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-semibold">
                  Interactive 2D Desk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-normal">
                Multi-dimensional inspection of automated compliance signals, risk severity, and scrutiny lifecycle.
              </p>
            </div>
          </div>

          {/* Interactive Mode Tabs */}
          <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-lg border border-white/15">
            <button
              onClick={() => {
                setActiveTab('severity');
                setSelectedSeverity(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'severity'
                  ? 'bg-white text-[#002147] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Severity Breakdown</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('pipeline');
                setSelectedSeverity(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-white text-[#002147] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Scrutiny Pipeline</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('radar');
                setSelectedSeverity(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'radar'
                  ? 'bg-white text-[#002147] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Category Compliance</span>
            </button>
          </div>
        </div>

        {/* Metric Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center space-x-2.5 bg-black/20 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
              {criticalCount}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Critical Jeopardy</span>
              <span className="font-bold text-white text-xs">{criticalCount} Flagged Items</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-black/20 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              {highCount}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">High Attention</span>
              <span className="font-bold text-white text-xs">{highCount} Open Queries</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-black/20 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold">
              {totalFindings}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Total Automated Signals</span>
              <span className="font-bold text-white text-xs">{totalFindings} Analyzed Points</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-black/20 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              {clearanceRate}%
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Estimated Clearance Rate</span>
              <span className="font-bold text-white text-xs">{clearanceRate}% Regulatory Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Canvas Area */}
      <div className="p-5">
        {/* ======================================================== */}
        {/* TAB 1: SEVERITY BREAKDOWN (BAR + DONUT INTERACTIVE) */}
        {/* ======================================================== */}
        {activeTab === 'severity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Bar Chart Column (7 cols) */}
              <div className="lg:col-span-7 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Automated Findings Count by Regulatory Severity
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hover bars to view severity definition and required scrutiny action.
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: {totalIssues} Findings
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={severityChartData}
                      margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        onClick={(data: any) => setSelectedSeverity(data?.severity || data?.payload?.severity || null)}
                        className="cursor-pointer transition-opacity hover:opacity-85"
                      >
                        {severityChartData.map((entry) => (
                          <Cell
                            key={`cell-${entry.severity}`}
                            fill={entry.color}
                            stroke={selectedSeverity === entry.severity ? '#002147' : 'transparent'}
                            strokeWidth={selectedSeverity === entry.severity ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interactive Donut Breakdown Column (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50/60 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <PieIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>Proportional Distribution</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Share of Total</span>
                  </div>

                  <div className="h-48 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityChartData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                          onMouseEnter={(_, index) => setHoveredSlice(severityChartData[index])}
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          {severityChartData.map((entry) => (
                            <Cell key={`donut-${entry.severity}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomBarTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-extrabold text-[#002147]">
                        {hoveredSlice ? hoveredSlice.count : totalIssues}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                        {hoveredSlice ? hoveredSlice.severity : 'Findings'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Donut Interactive Legend */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  {severityChartData.map((item) => (
                    <button
                      key={item.severity}
                      onClick={() =>
                        setSelectedSeverity(selectedSeverity === item.severity ? null : item.severity)
                      }
                      className={`p-2 rounded-lg text-left transition-all border ${
                        selectedSeverity === item.severity
                          ? 'border-[#002147] bg-white shadow-xs ring-1 ring-[#002147]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{item.count} items</span>
                        <span className="font-semibold">{item.percentage}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Severity Action Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {severityChartData.map((item) => {
                const isSelected = selectedSeverity === item.severity;
                return (
                  <div
                    key={item.severity}
                    onClick={() => setSelectedSeverity(isSelected ? null : item.severity)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#002147] bg-[#002147]/5 shadow-sm ring-1 ring-[#002147]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                        style={{ backgroundColor: `${item.color}18`, color: item.color }}
                      >
                        {item.severity}
                      </span>
                      <span className="text-base font-extrabold text-slate-800">{item.count}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.desc}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Protocol Guidance</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SCRUTINY WORKFLOW PIPELINE */}
        {/* ======================================================== */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Institutional Applications by Regulatory Processing Stage
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chronological lifecycle progression from initial applicant draft to final approval.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Total Active Dockets: {totalApplications}
                </span>
              </div>

              {/* Responsive Bar Funnel Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      width={140}
                    />
                    <Tooltip content={<CustomPipelineTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {pipelineChartData.map((entry) => (
                        <Cell key={`pipe-${entry.status}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pipelineChartData.map((stage) => (
                <div
                  key={stage.status}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">{stage.name}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stage.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CATEGORY COMPLIANCE BREAKDOWN */}
        {/* ======================================================== */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Document Category Scrutiny Pass Rate (%)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Proportion of documents meeting statutory criteria on first pass.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold">Compliant (%)</span>
                  </span>
                  <span className="flex items-center space-x-1 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold">Deficiency Flagged (%)</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryComplianceData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}%`, name === 'compliant' ? 'Compliant' : 'Non-Compliant']}
                      contentStyle={{ backgroundColor: '#002147', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="compliant" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Compliant" />
                    <Bar dataKey="nonCompliant" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Deficiency Flagged" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>High Compliance Disciplines</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Land Ownership Deeds (95%) and Notarized Regulatory Undertakings (92%) demonstrate highest standard compliance.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Primary Scrutiny Hotspot</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Fire Safety NOC certificates (26% expired or renewal pending) represent the most frequent query memo issued to applicant colleges.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Intake & Cadre Audits</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Course intake variations (19% discrepancies) trigger automated verification against previous academic session baselines.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Audit Protocol Note */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1 font-mono">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>AICTE 90* Regulatory Audit Engine — Advisory Decision Support System</span>
        </div>
        <div>
          <span>Approval Process Handbook (APH 2026-27 Norms)</span>
        </div>
      </div>
    </div>
  );
};
