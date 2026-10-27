import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  X,
  Flame,
  FileText,
  Zap,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';

export interface AnomalyPayload {
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  ruleCode: string;
  documentTitle: string;
  documentUrl?: string;
  expectedValue: string;
  extractedValue: string;
  discrepancyDelta?: string;
  recommendation: string;
  confidenceScore: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

// Built-in Demo Specimen Dataset with both Valid and Fake/Anomalous Certificates
export const DEMO_CERTIFICATES = [
  {
    id: 'demo-1',
    name: '01_VALID_AICTE_EoA_Order_2025-26.pdf',
    label: 'Official AICTE EoA Approval Order (AY 2025-26)',
    type: 'VALID',
    category: 'PREVIOUS_EOA',
    description: 'Statutory council sanction order. Valid 360 intake baseline (CSE: 120, ECE: 60, Mech: 60, IT: 120).',
    pdfUrl: '/demo-certificates/01_VALID_AICTE_EoA_Order_2025-26.pdf',
    anomaly: null,
  },
  {
    id: 'demo-2',
    name: '02_VALID_Building_Structural_Safety_Certificate.pdf',
    label: 'Building Structural Stability & Seismic Clearance',
    type: 'VALID',
    category: 'BUILDING_STABILITY_CERTIFICATE',
    description: 'Certified civil engineer report valid through 2029. Seismic Zone III certified.',
    pdfUrl: '/demo-certificates/02_VALID_Building_Structural_Safety_Certificate.pdf',
    anomaly: null,
  },
  {
    id: 'demo-3',
    name: '03_VALID_Land_Title_Ownership_NOC.pdf',
    label: 'Land Title & Possession Clearance (7.5 Acres Freehold)',
    type: 'VALID',
    category: 'NOC_LAND_USE',
    description: 'Unencumbered institutional land deed registered with municipal authorities.',
    pdfUrl: '/demo-certificates/03_VALID_Land_Title_Ownership_NOC.pdf',
    anomaly: null,
  },
  {
    id: 'demo-4',
    name: '04_VALID_Mandatory_Affidavit_Notarized.pdf',
    label: 'Notarized Regulatory Undertaking Affidavit',
    type: 'VALID',
    category: 'AFFIDAVIT',
    description: 'Sworn stamp paper undertaking on Govt notarized format under APH Format 1.',
    pdfUrl: '/demo-certificates/04_VALID_Mandatory_Affidavit_Notarized.pdf',
    anomaly: null,
  },
  {
    id: 'demo-5',
    name: '05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf',
    label: 'Tampered Approval Order — Unsanctioned Intake Alteration',
    type: 'ANOMALY',
    category: 'PREVIOUS_EOA',
    description: 'Table altered to claim 180 Computer Science seats instead of approved 120 (+60 unapproved seats!).',
    pdfUrl: '/demo-certificates/05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf',
    anomaly: {
      title: 'UNSANCTIONED INTAKE ALTERATION (+60 SEATS)',
      category: 'INTAKE_SANCTION_CHECK',
      severity: 'CRITICAL',
      ruleCode: 'RULE_EOA_INTAKE_MISMATCH',
      documentTitle: '05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf',
      documentUrl: '/demo-certificates/05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf',
      expectedValue: '120 Approved Seats (Council Baseline Record)',
      extractedValue: '180 Claimed Seats (Current Document Submission)',
      discrepancyDelta: '+60 Unsanctioned Seats without Council Gazette Order',
      recommendation: 'Reject intake variation claim. Issue mandatory show-cause notice under APH Chapter II.',
      confidenceScore: 99.4,
      boundingBox: { x: 390, y: 310, width: 85, height: 20 },
    } as AnomalyPayload,
  },
  {
    id: 'demo-6',
    name: '06_FAKE_EXPIRED_Fire_Safety_NOC.pdf',
    label: 'Expired Fire Safety Clearance NOC (>530 Days Lapsed)',
    type: 'ANOMALY',
    category: 'FIRE_SAFETY_CERTIFICATE',
    description: 'Municipal NOC expired on 15/05/2025. Mandatory valid fire clearance missing for AY 2026-27.',
    pdfUrl: '/demo-certificates/06_FAKE_EXPIRED_Fire_Safety_NOC.pdf',
    anomaly: {
      title: 'STATUTORY CERTIFICATE LAPSED (>530 DAYS EXPIRED)',
      category: 'SAFETY_COMPLIANCE',
      severity: 'HIGH',
      ruleCode: 'RULE_DOC_EXPIRY_CHECK',
      documentTitle: '06_FAKE_EXPIRED_Fire_Safety_NOC.pdf',
      documentUrl: '/demo-certificates/06_FAKE_EXPIRED_Fire_Safety_NOC.pdf',
      expectedValue: 'Valid through minimum 30/06/2026',
      extractedValue: 'Expired on 15/05/2025',
      discrepancyDelta: 'Lapsed by over 17 months without subsequent renewal receipt',
      recommendation: 'Place application under ACTION_REQUIRED until valid municipal fire renewal is submitted.',
      confidenceScore: 98.2,
      boundingBox: { x: 210, y: 220, width: 280, height: 22 },
    } as AnomalyPayload,
  },
  {
    id: 'demo-7',
    name: '07_FAKE_INSTITUTION_NAME_Land_Deed.pdf',
    label: 'Entity Title Discrepancy — Mismatched Society Name',
    type: 'ANOMALY',
    category: 'NOC_LAND_USE',
    description: 'Deed issued to unauthorized entity "Apex Educational Academy" instead of registered institution.',
    pdfUrl: '/demo-certificates/07_FAKE_INSTITUTION_NAME_Land_Deed.pdf',
    anomaly: {
      title: 'LEGAL ENTITY TITLE MISMATCH (NAME INCONSISTENCY)',
      category: 'INSTITUTE_IDENTITY',
      severity: 'CRITICAL',
      ruleCode: 'RULE_NAME_CONSISTENCY',
      documentTitle: '07_FAKE_INSTITUTION_NAME_Land_Deed.pdf',
      documentUrl: '/demo-certificates/07_FAKE_INSTITUTION_NAME_Land_Deed.pdf',
      expectedValue: 'Apex Institute of Technology & Management',
      extractedValue: 'Apex Educational Academy (Discrepancy)',
      discrepancyDelta: 'Discrepant entity name without sanctioned Change of Site/Society petition',
      recommendation: 'Verify whether a State Gazette notification or sanctioned Trust Merger was approved.',
      confidenceScore: 96.8,
      boundingBox: { x: 210, y: 160, width: 310, height: 24 },
    } as AnomalyPayload,
  },
  {
    id: 'demo-8',
    name: '08_FAKE_DUPLICATE_FILE_COLLISION.pdf',
    label: 'Cryptographic Duplicate Checksum Re-upload',
    type: 'ANOMALY',
    category: 'FACULTY_LIST_EVIDENCE',
    description: 'SHA-256 checksum is identical to another uploaded certificate. Re-used dummy payload.',
    pdfUrl: '/demo-certificates/08_FAKE_DUPLICATE_FILE_COLLISION.pdf',
    anomaly: {
      title: 'CRYPTOGRAPHIC EXACT DUPLICATE FILE DETECTED',
      category: 'DATA_INTEGRITY',
      severity: 'HIGH',
      ruleCode: 'RULE_DUPLICATE_FILE_HASH',
      documentTitle: '08_FAKE_DUPLICATE_FILE_COLLISION.pdf',
      documentUrl: '/demo-certificates/08_FAKE_DUPLICATE_FILE_COLLISION.pdf',
      expectedValue: 'Unique Category Proof (Faculty Cadre Endorsement)',
      extractedValue: 'SHA-256 Hash matches Building Stability Certificate exactly',
      discrepancyDelta: 'Identical file content submitted across 2 distinct statutory slots',
      recommendation: 'Reject uploaded docket as placeholder. Mandate authentic faculty list upload.',
      confidenceScore: 100.0,
      boundingBox: { x: 210, y: 180, width: 340, height: 22 },
    } as AnomalyPayload,
  },
];

interface AnomalyDetectionHUDProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnomaly?: AnomalyPayload | null;
}

export const AnomalyDetectionHUD: React.FC<AnomalyDetectionHUDProps> = ({
  isOpen,
  onClose,
  initialAnomaly,
}) => {
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyPayload | null>(initialAnomaly || null);
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'BREACH_DETECTED'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'scanner' | 'demo_hub'>('scanner');

  // Synthesized Cyber Radar & Alarm Audio using Web Audio API
  const playCyberChirp = (frequency = 880, duration = 0.25) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not allowed or user interaction policy
    }
  };

  const playAlarmSound = () => {
    if (!soundEnabled) return;
    playCyberChirp(960, 0.15);
    setTimeout(() => playCyberChirp(720, 0.2), 160);
    setTimeout(() => playCyberChirp(960, 0.25), 360);
  };

  // Trigger scan sequence
  const startForensicScan = (target: AnomalyPayload) => {
    setActiveAnomaly(target);
    setActiveTab('scanner');
    setScanState('SCANNING');
    setScanProgress(0);
    setScanLog('INITIALIZING NEURAL OCR & APH HEURISTIC ENGINE...');

    playCyberChirp(600, 0.1);

    const steps = [
      { progress: 25, log: 'PARSING PDF VECTOR RAYS & EMBEDDED FONTS...', delay: 350 },
      { progress: 50, log: 'VERIFYING DIGITAL SIGNATURE DOCKET & SHA-256 CHECKSUM...', delay: 800 },
      { progress: 75, log: 'CROSS-REFERENCING PREVIOUS EOA SANCTIONED BASELINE...', delay: 1300 },
      { progress: 95, log: 'CORRELATING MUNICIPAL EXPIRATION STAMP WITH SCRUTINY CYCLE...', delay: 1800 },
      { progress: 100, log: 'COMPLIANCE ANOMALY DETECTED // FLAGGING COORDINATES', delay: 2200 },
    ];

    steps.forEach(({ progress, log, delay }) => {
      setTimeout(() => {
        setScanProgress(progress);
        setScanLog(log);
        playCyberChirp(700 + progress * 2, 0.08);
      }, delay);
    });

    setTimeout(() => {
      setScanState('BREACH_DETECTED');
      playAlarmSound();
    }, 2400);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialAnomaly) {
        startForensicScan(initialAnomaly);
      } else {
        setActiveTab('demo_hub');
        setScanState('IDLE');
      }
    }
  }, [isOpen, initialAnomaly]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Cyberpunk Modal Card */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070D18] border border-red-500/40 rounded-2xl shadow-[0_0_60px_rgba(239,68,68,0.25)] overflow-hidden text-slate-100">
        
        {/* Top Glowing Laser Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 animate-pulse-ring">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                  AICTE VerifyAI Cyber-Forensics
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Engine: APH-2026 Heuristic Core v2.4
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 flex items-center space-x-2">
                <span>AI Scrutiny & Document Anomaly Detection Hub</span>
              </h2>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center space-x-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg text-xs font-mono border transition-colors ${
                soundEnabled
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={soundEnabled ? 'Mute Scrutiny Audio FX' : 'Enable Scrutiny Audio FX'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Tab switch */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 flex text-xs font-semibold">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'scanner'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Forensic Scanner
              </button>
              <button
                onClick={() => setActiveTab('demo_hub')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'demo_hub'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Demo Certificates ({DEMO_CERTIFICATES.length})
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* TAB 1: FORENSIC SCANNER & ANOMALY DETECTOR */}
          {activeTab === 'scanner' && (
            <div className="space-y-6">
              
              {/* SCANNING IN PROGRESS ANIMATION */}
              {scanState === 'SCANNING' && (
                <div className="relative p-8 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-center space-y-6 overflow-hidden shadow-2xl">
                  {/* Rotating Radar Scanner Backdrop */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                    <div className="w-96 h-96 rounded-full border-2 border-amber-400 animate-radar-spin border-t-transparent border-l-transparent" />
                  </div>

                  {/* Pulsing Scanner Orb */}
                  <div className="relative inline-block mx-auto">
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-pulse-ring">
                      <Cpu className="w-10 h-10 text-amber-400 animate-spin" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-mono font-bold text-amber-300 tracking-wider">
                      HEURISTIC SCANNER ENGAGED
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-1 max-w-lg mx-auto">
                      {scanLog}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-300 ease-out"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Analyzing Cert Metadata</span>
                      <span className="text-amber-400 font-bold">{scanProgress}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ANOMALY BREACH DETECTED (THE WOW FACTOR ANIMATION!) */}
              {scanState === 'BREACH_DETECTED' && activeAnomaly && (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  
                  {/* Holographic Glowing Alert Banner */}
                  <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-red-950/90 border-2 border-red-500 animate-anomaly-glow overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.35)]">
                    
                    {/* Laser Sweep Line Overlay */}
                    <div className="absolute left-0 right-0 h-1 bg-red-400 shadow-[0_0_15px_#ef4444] animate-laser-sweep pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-3 rounded-xl bg-red-600/30 border border-red-500 animate-pulse">
                          <Flame className="w-7 h-7 text-red-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600 text-white tracking-widest shadow-xs">
                              {activeAnomaly.severity} DEFICIENCY FLAGGED
                            </span>
                            <span className="font-mono text-xs text-red-300 font-bold">
                              CODE: {activeAnomaly.ruleCode}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
                            {activeAnomaly.title}
                          </h3>
                        </div>
                      </div>

                      {/* Certainty Meter */}
                      <div className="bg-black/60 px-4 py-2.5 rounded-xl border border-red-500/40 text-right shrink-0">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">AI Heuristic Certainty</div>
                        <div className="text-xl font-mono font-extrabold text-red-400">
                          {activeAnomaly.confidenceScore.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Comparison Matrix & Document View */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left: Forensic Discrepancy Breakdown (7 Cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                            <Cpu className="w-3.5 h-3.5 text-amber-400" />
                            <span>Statutory Cross-Verification Audit</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Category: {activeAnomaly.category}
                          </span>
                        </div>

                        {/* Side by side mismatch comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          
                          {/* Baseline Record */}
                          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Statutory Baseline (Council Record)</span>
                            </div>
                            <div className="text-xs font-bold text-emerald-200">
                              {activeAnomaly.expectedValue}
                            </div>
                          </div>

                          {/* Extracted Claim */}
                          <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-500/50 space-y-1">
                            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-red-400 uppercase">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>Extracted Current Claim</span>
                            </div>
                            <div className="text-xs font-bold text-red-200">
                              {activeAnomaly.extractedValue}
                            </div>
                          </div>
                        </div>

                        {/* Discrepancy Delta */}
                        {activeAnomaly.discrepancyDelta && (
                          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-300 flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <strong>IRREGULARITY IMPACT:</strong> {activeAnomaly.discrepancyDelta}
                            </div>
                          </div>
                        )}

                        {/* Recommended Action */}
                        <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1 text-xs">
                          <span className="font-mono text-[10px] text-amber-400 uppercase font-bold">
                            Mandated Statutory Action:
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {activeAnomaly.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Scrutiny Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            alert(`[SIMULATED OFFICER ACTION] Flagged Deficiency Memo issued for ${activeAnomaly.title}. Audit log recorded.`);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                        >
                          Issue Formal Deficiency Notice
                        </button>
                        <button
                          onClick={() => {
                            alert(`[SIMULATED OFFICER ACTION] Clarification docket generated with 7-day compliance deadline.`);
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-amber-500/30 transition-colors"
                        >
                          Request Clarification
                        </button>
                        {activeAnomaly.documentUrl && (
                          <a
                            href={activeAnomaly.documentUrl}
                            download
                            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Download Sample Certificate</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right: Certificate Preview with Glowing Red Reticle (5 Cols) */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center justify-between">
                        <span>Digital Specimen Preview</span>
                        <span className="text-[10px] text-red-400 font-mono">[ TARGET LOCKED ]</span>
                      </div>

                      <div className="relative aspect-[3/4] bg-white rounded-xl border-2 border-red-500 shadow-xl overflow-hidden group">
                        
                        {/* Certificate Rendered in iframe or fallback */}
                        {activeAnomaly.documentUrl ? (
                          <iframe
                            src={`${activeAnomaly.documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full border-none pointer-events-auto"
                            title="Certificate Preview"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                            Specimen Preview Not Loaded
                          </div>
                        )}

                        {/* Glowing Red Forensic Target Reticle Overlay */}
                        <div className="absolute inset-0 pointer-events-none border border-red-500/20">
                          {/* Corner Reticles */}
                          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-red-500" />
                          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-red-500" />
                          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-red-500" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-red-500" />

                          {/* Pulsing Target Box */}
                          <div className="absolute top-1/3 left-1/4 right-1/4 h-16 border-2 border-red-600 bg-red-600/15 rounded animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)] flex items-center justify-center">
                            <span className="text-[10px] font-mono font-black text-white px-2 py-0.5 bg-red-600 rounded">
                              TAMPER RETICLE: {activeAnomaly.ruleCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* IDLE STATE */}
              {scanState === 'IDLE' && (
                <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
                  <Cpu className="w-12 h-12 text-slate-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">Forensic Scanner Ready</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Select a sample certificate from the Demo Certificates tab to simulate real-time AI document scrutiny and anomaly detection.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('demo_hub')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Browse Demo Certificates
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: DEMO CERTIFICATES & SPECIMEN PACK */}
          {activeTab === 'demo_hub' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Official AICTE Scrutiny Demo Certificates Pack
                  </h3>
                  <p className="text-xs text-slate-400">
                    8 realistic synthesized PDF certificates configured for testing heuristic rule engines, OCR classification, and anomaly detection.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  📁 Saved in <code className="text-amber-400 font-bold">demo-certificates/</code>
                </div>
              </div>

              {/* Grid of 8 certificates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DEMO_CERTIFICATES.map((cert) => {
                  const isAnomaly = cert.type === 'ANOMALY';
                  return (
                    <div
                      key={cert.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isAnomaly
                          ? 'bg-red-950/15 border-red-500/30 hover:border-red-500/70 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                          : 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                isAnomaly
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {isAnomaly ? '🚨 ANOMALY / FAKE' : '✔ VALID CERTIFICATE'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-medium">
                              {cert.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white">
                            {cert.label}
                          </h4>
                        </div>

                        {/* File icon */}
                        <FileText className={`w-4 h-4 shrink-0 ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`} />
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        {cert.description}
                      </p>

                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[160px]" title={cert.name}>
                          {cert.name}
                        </span>

                        <div className="flex items-center space-x-2">
                          {/* Download Button */}
                          <a
                            href={cert.pdfUrl}
                            download
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                            title="Download PDF Certificate"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* View in new tab */}
                          <a
                            href={cert.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                            title="Inspect PDF in browser tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Scan / Animate Button */}
                          {isAnomaly && cert.anomaly && (
                            <button
                              onClick={() => startForensicScan(cert.anomaly!)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-colors"
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>Scan Anomaly</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AICTE Statutory Scrutiny Guard Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            Dismiss HUD
          </button>
        </div>

      </div>
    </div>
  );
};
