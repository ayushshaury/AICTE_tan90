import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  X,
  FileText,
  Zap,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Search,
} from 'lucide-react';

export interface AnomalyPayload {
  title: string;
  category: string;
  severity: string;
  ruleCode: string;
  documentTitle: string;
  documentUrl?: string;
  expectedValue: string;
  extractedValue: string;
  discrepancyDelta?: string;
  recommendation: string;
  confidenceScore: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  forensicPoints?: string[];
}

export interface ValidPayload {
  title: string;
  category: string;
  documentTitle: string;
  documentUrl?: string;
  confidenceScore: number;
  statutoryClearanceNote: string;
  verificationHighlights: {
    label: string;
    detail: string;
    badge?: string;
  }[];
}

export interface ScrutinyTarget {
  documentId?: string;
  originalFilename: string;
  category: string;
  fileUrl?: string;
  sha256?: string;
  applicationRef?: string;
  institutionName?: string;
  verdictType?: 'ANOMALY' | 'VALID';
  anomaly?: AnomalyPayload;
  validDetails?: ValidPayload;
}

// Built-in Demo Specimen Dataset with both Valid and Fake/Anomalous Certificates
export const DEMO_CERTIFICATES = [
  {
    id: 'demo-1',
    name: '01_VALID_AICTE_EoA_Order_2025-26.pdf',
    label: 'Official AICTE EoA Approval Order (AY 2025-26)',
    type: 'VALID' as const,
    category: 'PREVIOUS_EOA',
    description: 'Statutory council sanction order. Valid 360 intake baseline (CSE: 120, ECE: 60, Mech: 60, IT: 120).',
    pdfUrl: '/demo-certificates/01_VALID_AICTE_EoA_Order_2025-26.pdf',
    validDetails: {
      title: 'AICTE EXTENSION OF APPROVAL (EoA) — FULLY SANCTIONED',
      category: 'PREVIOUS_EOA',
      documentTitle: '01_VALID_AICTE_EoA_Order_2025-26.pdf',
      documentUrl: '/demo-certificates/01_VALID_AICTE_EoA_Order_2025-26.pdf',
      confidenceScore: 99.8,
      statutoryClearanceNote: 'Council approval order verified against Central Gazette database. All intake figures and institute codes match historical sanctions.',
      verificationHighlights: [
        { label: 'Sanctioned Intake', detail: '360 Total Seats (CSE: 120, ECE: 60, ME: 60, IT: 120)', badge: 'EXACT MATCH' },
        { label: 'Council Order Reference', detail: 'F.No. Western/1-10142981/2025/EOA valid for AY 2025-26', badge: 'VERIFIED' },
        { label: 'Digital Signatures', detail: 'Member Secretary & Regional Officer digital certificates verified', badge: 'AUTHENTIC' },
        { label: 'SHA-256 Checksum', detail: 'Cryptographic hash registered in AICTE national repository', badge: 'PASSED' },
      ],
    },
    anomaly: null,
  },
  {
    id: 'demo-2',
    name: '02_VALID_Building_Structural_Safety_Certificate.pdf',
    label: 'Building Structural Stability & Seismic Clearance',
    type: 'VALID' as const,
    category: 'BUILDING_STABILITY_CERTIFICATE',
    description: 'Certified civil engineer report valid through 2029. Seismic Zone III certified.',
    pdfUrl: '/demo-certificates/02_VALID_Building_Structural_Safety_Certificate.pdf',
    validDetails: {
      title: 'BUILDING STRUCTURAL INTEGRITY CLEARANCE — COMPLIANT',
      category: 'BUILDING_STABILITY_CERTIFICATE',
      documentTitle: '02_VALID_Building_Structural_Safety_Certificate.pdf',
      documentUrl: '/demo-certificates/02_VALID_Building_Structural_Safety_Certificate.pdf',
      confidenceScore: 99.4,
      statutoryClearanceNote: 'Civil Engineering Stability report complies with National Building Code (NBC) 2016 and Seismic Zone III structural standards.',
      verificationHighlights: [
        { label: 'Structural Safety Period', detail: 'Valid until 31/03/2029 (> 3 years horizon)', badge: 'ACTIVE' },
        { label: 'Seismic Zone Rating', detail: 'Certified Zone III Resistant as per IS 1893:2016', badge: 'ZONE III' },
        { label: 'Engineer Credential', detail: 'Municipal Registered Structural Engineer Lic #SE/2018/0491', badge: 'REGISTERED' },
        { label: 'Institutional Campus', detail: 'Plot 42, Knowledge Park III, Pune, Maharashtra - 411057', badge: 'MATCHED' },
      ],
    },
    anomaly: null,
  },
  {
    id: 'demo-3',
    name: '03_VALID_Land_Title_Ownership_NOC.pdf',
    label: 'Land Title & Possession Clearance (7.5 Acres Freehold)',
    type: 'VALID' as const,
    category: 'NOC_LAND_USE',
    description: 'Unencumbered institutional land deed registered with municipal authorities.',
    pdfUrl: '/demo-certificates/03_VALID_Land_Title_Ownership_NOC.pdf',
    validDetails: {
      title: 'INSTITUTIONAL LAND TITLE & POSSESSION NOC — VERIFIED',
      category: 'NOC_LAND_USE',
      documentTitle: '03_VALID_Land_Title_Ownership_NOC.pdf',
      documentUrl: '/demo-certificates/03_VALID_Land_Title_Ownership_NOC.pdf',
      confidenceScore: 99.6,
      statutoryClearanceNote: 'Clear and unencumbered freehold land title deed registered under Sub-Registrar Pune Haveli. Area satisfies APH Chapter I land norms.',
      verificationHighlights: [
        { label: 'Land Parcel Area', detail: '7.50 Acres (30,351 sq.m) contiguous freehold campus', badge: 'SATISFIED' },
        { label: 'Sub-Registrar Reg No', detail: 'Deed No. HVL-4/2012/8492 registered on 14/06/2012', badge: 'VERIFIED' },
        { label: 'Encumbrance Check', detail: 'Nil encumbrance certificate issued by Revenue Authority', badge: 'CLEAR' },
        { label: 'Designated Land Use', detail: 'Approved for Educational / Institutional use only', badge: 'SANCTIONED' },
      ],
    },
    anomaly: null,
  },
  {
    id: 'demo-4',
    name: '04_VALID_Mandatory_Affidavit_Notarized.pdf',
    label: 'Notarized Regulatory Undertaking Affidavit',
    type: 'VALID' as const,
    category: 'AFFIDAVIT',
    description: 'Sworn stamp paper undertaking on Govt notarized format under APH Format 1.',
    pdfUrl: '/demo-certificates/04_VALID_Mandatory_Affidavit_Notarized.pdf',
    validDetails: {
      title: 'MANDATORY STATUTORY AFFIDAVIT — LEGALLY BINDING',
      category: 'AFFIDAVIT',
      documentTitle: '04_VALID_Mandatory_Affidavit_Notarized.pdf',
      documentUrl: '/demo-certificates/04_VALID_Mandatory_Affidavit_Notarized.pdf',
      confidenceScore: 98.9,
      statutoryClearanceNote: 'Sworn under oath by Chairman/Secretary on Government of Maharashtra ₹100 e-Stamp paper with valid Advocate Notary endorsement.',
      verificationHighlights: [
        { label: 'e-Stamp Paper Serial', detail: 'IN-MH84918204918374W (e-Challan verified)', badge: 'GENUINE' },
        { label: 'Notary Public Endorsement', detail: 'Adv. S. K. Deshmukh, Reg. No. NOTARY/MH/10491/2021', badge: 'VALID' },
        { label: 'Anti-Ragging Undertaking', detail: 'Clause 4 sworn compliance under UGC/AICTE 2009 Norms', badge: 'AFFIRMED' },
        { label: 'Cadre Pay Compliance', detail: '7th Central Pay Commission salary scale undertaking sworn', badge: 'AFFIRMED' },
      ],
    },
    anomaly: null,
  },
  {
    id: 'demo-5',
    name: '05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf',
    label: 'Tampered Approval Order — Unsanctioned Intake Alteration',
    type: 'ANOMALY' as const,
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
      expectedValue: '120 Approved Seats (Council Gazette Baseline Record)',
      extractedValue: '180 Claimed Seats (Current Document Submission)',
      discrepancyDelta: '+60 Unsanctioned Seats without Council Gazette Order',
      recommendation: 'Reject intake variation claim. Issue mandatory show-cause notice under APH Chapter II.',
      confidenceScore: 99.4,
      boundingBox: { x: 390, y: 310, width: 85, height: 20 },
      forensicPoints: [
        'Table entry font raster density differs from official Council serif typography.',
        'Total approved intake in Council Gazette remains 360, but claimed table totals 420.',
        'No approval for intake expansion recorded in AICTE portal docket database.',
        'Checksum does not match official digitally signed PDF issued by Regional Office.',
      ],
    },
  },
  {
    id: 'demo-6',
    name: '06_FAKE_EXPIRED_Fire_Safety_NOC.pdf',
    label: 'Expired Fire Safety Clearance NOC (>530 Days Lapsed)',
    type: 'ANOMALY' as const,
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
      expectedValue: 'Valid through minimum 30/06/2026 (Active Scrutiny Horizon)',
      extractedValue: 'Expired on 15/05/2025 (Outdated Certificate)',
      discrepancyDelta: 'Lapsed by over 17 months without subsequent renewal receipt',
      recommendation: 'Place application under ACTION_REQUIRED until valid municipal fire renewal is submitted.',
      confidenceScore: 98.2,
      boundingBox: { x: 210, y: 220, width: 280, height: 22 },
      forensicPoints: [
        'Certificate clearly states: "Validity period: 1 year from 15/05/2024 to 15/05/2025".',
        'Current statutory scrutiny requires clearance covering Academic Year 2026-27.',
        'No pending renewal application or interim acknowledgment submitted.',
        'Presents high life-safety compliance liability under APH 2026-27 Chapter II.',
      ],
    },
  },
  {
    id: 'demo-7',
    name: '07_FAKE_INSTITUTION_NAME_Land_Deed.pdf',
    label: 'Entity Title Discrepancy — Mismatched Society Name',
    type: 'ANOMALY' as const,
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
      expectedValue: 'Apex Institute of Technology & Management (Registered Name)',
      extractedValue: 'Apex Educational Academy (Discrepant Entity Name)',
      discrepancyDelta: 'Discrepant entity name without sanctioned Change of Site/Society petition',
      recommendation: 'Verify whether a State Gazette notification or sanctioned Trust Merger was approved.',
      confidenceScore: 96.8,
      boundingBox: { x: 210, y: 160, width: 310, height: 24 },
      forensicPoints: [
        'Document grantee field reads "Apex Educational Academy", not the applicant institution.',
        'Land use title must be executed directly in favor of the applicant Trust or Institution.',
        'No registered sub-lease or assignment resolution attached.',
        'Violates AICTE Approval Process Handbook norm requiring undivided institutional possession.',
      ],
    },
  },
  {
    id: 'demo-8',
    name: '08_FAKE_DUPLICATE_FILE_COLLISION.pdf',
    label: 'Cryptographic Duplicate Checksum Re-upload',
    type: 'ANOMALY' as const,
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
      expectedValue: 'Unique Category Proof (Faculty Cadre Endorsement & Payroll Proof)',
      extractedValue: 'SHA-256 Hash matches Building Stability Certificate exactly',
      discrepancyDelta: 'Identical file content submitted across 2 distinct statutory slots',
      recommendation: 'Reject uploaded docket as placeholder. Mandate authentic faculty list upload.',
      confidenceScore: 100.0,
      boundingBox: { x: 210, y: 180, width: 340, height: 22 },
      forensicPoints: [
        'SHA-256 checksum matched byte-for-byte with Document Slot #2 in the same application.',
        'Faculty cadre requirement cannot be substantiated with structural stability certificate.',
        'Indicates applicant uploaded duplicate file to bypass submission checklist gate.',
        'Flagged for administrative clarification and mandatory re-upload.',
      ],
    },
  },
];

interface AnomalyDetectionHUDProps {
  isOpen: boolean;
  onClose: () => void;
  target?: ScrutinyTarget | null;
  initialAnomaly?: AnomalyPayload | null;
  onConfirmFinding?: (finding: AnomalyPayload) => void;
  onApproveDocument?: (target: ScrutinyTarget) => void;
}

export const AnomalyDetectionHUD: React.FC<AnomalyDetectionHUDProps> = ({
  isOpen,
  onClose,
  target,
  initialAnomaly,
  onConfirmFinding,
  onApproveDocument,
}) => {
  // Current scrutiny target
  const [currentTarget, setCurrentTarget] = useState<ScrutinyTarget | null>(null);
  const [verdictState, setVerdictState] = useState<'SCANNING' | 'ANOMALY_BREACH' | 'VERIFIED_VALID'>('SCANNING');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'scrutiny' | 'specimen_hub'>('scrutiny');

  // Synthesized Cyber Radar & Alarm Audio using Web Audio API
  const playCyberChirp = (frequency = 880, duration = 0.25, type: OscillatorType = 'sawtooth') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
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
    playCyberChirp(960, 0.15, 'sawtooth');
    setTimeout(() => playCyberChirp(720, 0.2, 'sawtooth'), 160);
    setTimeout(() => playCyberChirp(960, 0.25, 'sawtooth'), 360);
  };

  const playSuccessSound = () => {
    if (!soundEnabled) return;
    playCyberChirp(523.25, 0.15, 'sine'); // C5
    setTimeout(() => playCyberChirp(659.25, 0.2, 'sine'), 150); // E5
    setTimeout(() => playCyberChirp(783.99, 0.35, 'sine'), 320); // G5
  };

  // Resolve target on open or prop change
  useEffect(() => {
    if (!isOpen) return;

    if (target) {
      setCurrentTarget(target);
      triggerScrutinyScan(target);
    } else if (initialAnomaly) {
      const targetFromAnomaly: ScrutinyTarget = {
        originalFilename: initialAnomaly.documentTitle,
        category: initialAnomaly.category,
        fileUrl: initialAnomaly.documentUrl,
        verdictType: 'ANOMALY',
        anomaly: initialAnomaly,
      };
      setCurrentTarget(targetFromAnomaly);
      triggerScrutinyScan(targetFromAnomaly, 'ANOMALY');
    } else {
      // Default to the tampered EoA demo certificate
      const defaultDemo = DEMO_CERTIFICATES[4]; // 05_FAKE_TAMPERED
      const fallbackTarget: ScrutinyTarget = {
        originalFilename: defaultDemo.name,
        category: defaultDemo.category,
        fileUrl: defaultDemo.pdfUrl,
        verdictType: 'ANOMALY',
        anomaly: defaultDemo.anomaly!,
      };
      setCurrentTarget(fallbackTarget);
      triggerScrutinyScan(fallbackTarget);
    }
  }, [isOpen, target, initialAnomaly]);

  // Execute the forensic scanning sequence
  const triggerScrutinyScan = (item: ScrutinyTarget, forceVerdict?: 'ANOMALY' | 'VALID') => {
    setActiveTab('scrutiny');
    setVerdictState('SCANNING');
    setScanProgress(0);
    setScanLog('INITIALIZING NEURAL OCR & STATUTORY REGULATORY HEURISTICS...');

    playCyberChirp(600, 0.1, 'sine');

    const steps = [
      { progress: 20, log: 'EXTRACTING DIGITAL TOKEN VECTORS & PDF EMBEDDED FONTS...', delay: 300 },
      { progress: 45, log: 'COMPUTING SHA-256 CHECKSUM & COMPARING AGAINST REPOSITORY...', delay: 700 },
      { progress: 70, log: 'QUERYING CENTRAL GAZETTE APPROVAL DOCKET FOR BASELINE SANCTIONS...', delay: 1200 },
      { progress: 90, log: 'CROSS-CHECKING EXPIRATION HORIZONS & MUNICIPAL JURISDICTION STAMPS...', delay: 1700 },
      { progress: 100, log: 'COMPILING STATUTORY COMPLIANCE DOSSIER // GENERATING VERDICT', delay: 2200 },
    ];

    steps.forEach(({ progress, log, delay }) => {
      setTimeout(() => {
        setScanProgress(progress);
        setScanLog(log);
        playCyberChirp(650 + progress * 2.5, 0.08, 'sine');
      }, delay);
    });

    setTimeout(() => {
      // Determine final verdict
      const finalVerdict = forceVerdict || item.verdictType || (item.anomaly ? 'ANOMALY' : 'VALID');

      if (finalVerdict === 'ANOMALY') {
        setVerdictState('ANOMALY_BREACH');
        playAlarmSound();
      } else {
        setVerdictState('VERIFIED_VALID');
        playSuccessSound();
      }
    }, 2400);
  };

  if (!isOpen) return null;

  const currentAnomaly = currentTarget?.anomaly || DEMO_CERTIFICATES[4].anomaly!;
  const currentValid = currentTarget?.validDetails || DEMO_CERTIFICATES[0].validDetails!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-[#070d19] border rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
          verdictState === 'ANOMALY_BREACH'
            ? 'border-red-600/90 animate-anomaly-glow'
            : verdictState === 'VERIFIED_VALID'
            ? 'border-emerald-500/90 animate-verified-glow'
            : 'border-cyan-500/60 shadow-cyan-950/40'
        }`}
      >
        {/* TOP COMMAND BAR */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner ${
                verdictState === 'ANOMALY_BREACH'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : verdictState === 'VERIFIED_VALID'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              }`}
            >
              {verdictState === 'ANOMALY_BREACH' ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : verdictState === 'VERIFIED_VALID' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Cpu className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  AICTE VERIFYAI CYBER-FORENSICS
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Engine: APH-2026 Heuristic Core v2.4
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide mt-0.5 flex items-center gap-2">
                <span>AI Scrutiny & Document Anomaly Detection Hub</span>
                {currentTarget && (
                  <span className="text-xs font-mono text-cyan-300 font-normal truncate max-w-[220px] sm:max-w-[360px]">
                    [{currentTarget.originalFilename}]
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750 transition-colors border border-slate-700/60"
              title={soundEnabled ? 'Mute synthesized scanner audio' : 'Unmute audio effects'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Quick Mode Switcher for Live Demo & Review */}
            <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => {
                  if (currentTarget) {
                    const updated = {
                      ...currentTarget,
                      verdictType: 'ANOMALY' as const,
                      anomaly: currentTarget.anomaly || DEMO_CERTIFICATES[4].anomaly!,
                    };
                    setCurrentTarget(updated);
                    triggerScrutinyScan(updated, 'ANOMALY');
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  verdictState === 'ANOMALY_BREACH'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-red-400 hover:bg-red-950/40'
                }`}
                title="Test Fraud/Anomaly detection animation & breakdown"
              >
                🔴 Test Fraud
              </button>
              <button
                onClick={() => {
                  if (currentTarget) {
                    const updated = {
                      ...currentTarget,
                      verdictType: 'VALID' as const,
                      validDetails: currentTarget.validDetails || DEMO_CERTIFICATES[0].validDetails!,
                    };
                    setCurrentTarget(updated);
                    triggerScrutinyScan(updated, 'VALID');
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  verdictState === 'VERIFIED_VALID'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
                title="Test Correct/Valid clearance animation & breakdown"
              >
                🟢 Test Valid
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setActiveTab('scrutiny')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'scrutiny'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Forensic HUD
              </button>
              <button
                onClick={() => setActiveTab('specimen_hub')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'specimen_hub'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Demo Specimen (8)
              </button>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'scrutiny' ? (
            <div className="space-y-5">
              {/* STATUS BANNER */}
              {verdictState === 'SCANNING' && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <Search className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        ACTIVE DEEP FORENSIC SCRUTINY IN PROGRESS
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-0.5">{scanLog}</div>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {verdictState === 'ANOMALY_BREACH' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-red-900/40 to-slate-900 border border-red-500/70 shadow-lg shadow-red-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase bg-red-600 text-white">
                          CRITICAL FRAUD / ANOMALY DETECTED
                        </span>
                        <span className="text-xs font-mono font-bold text-red-400">
                          RULE: {currentAnomaly.ruleCode}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white tracking-wide mt-1">
                        {currentAnomaly.title}
                      </h3>
                      <p className="text-xs text-red-200/90 mt-0.5">
                        Statutory deviation confirmed against Council gazette records and Approval Process Handbook norms.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-slate-400">AI Confidence</div>
                      <div className="text-xl font-mono font-black text-red-400">{currentAnomaly.confidenceScore}%</div>
                    </div>
                    <button
                      onClick={() => currentTarget && triggerScrutinyScan(currentTarget)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Re-Scan</span>
                    </button>
                  </div>
                </div>
              )}

              {verdictState === 'VERIFIED_VALID' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-slate-900 border border-emerald-500/70 shadow-lg shadow-emerald-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-6 h-6 animate-seal-pop" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase bg-emerald-600 text-white">
                          100% VALID & AUTHENTIC — COMPLIANCE VERIFIED
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          CATEGORY: {currentTarget?.category || currentValid.category}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white tracking-wide mt-1">
                        {currentValid.title}
                      </h3>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        {currentValid.statutoryClearanceNote}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-slate-400">Integrity Score</div>
                      <div className="text-xl font-mono font-black text-emerald-400">{currentValid.confidenceScore}%</div>
                    </div>
                    <button
                      onClick={() => currentTarget && triggerScrutinyScan(currentTarget)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Re-Scan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* GRID: SPECIMEN PREVIEW (LEFT) + FORENSIC BREAKDOWN (RIGHT) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT: DOCUMENT SPECIMEN WITH LASER SWEEP & TARGET RETICLE (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>DIGITAL SPECIMEN SCAN DOCKET</span>
                    </span>
                    <a
                      href={currentTarget?.fileUrl || '/demo-certificates/05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-cyan-400 hover:underline"
                    >
                      <span>Open Raw PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Specimen Card Container */}
                  <div className="relative aspect-[1/1.3] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-3 select-none">
                    {/* Background Document Paper Representation */}
                    <div className="w-full h-full bg-[#f8fafc] rounded-lg p-5 text-slate-800 shadow-inner flex flex-col justify-between text-[11px] font-sans relative overflow-hidden">
                      {/* Emulated Document Letterhead */}
                      <div className="border-b-2 border-slate-300 pb-2 text-center">
                        <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                          ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                          OFFICIAL REGULATORY COMPLIANCE DOCKET
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Ref: {currentTarget?.originalFilename || 'DOC-REGULATORY-EVIDENCE.pdf'}
                        </div>
                      </div>

                      {/* Emulated Content Mockup Lines */}
                      <div className="space-y-2 py-3 flex-1 text-[10px] text-slate-600">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">Institution:</span>
                          <span className="font-mono text-slate-900 font-bold">Apex Institute of Tech & Mgmt</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">Category:</span>
                          <span className="font-mono">{currentTarget?.category || 'STATUTORY_DOCKET'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">Regulatory Session:</span>
                          <span className="font-mono">AY 2026-27 (APH Compliance)</span>
                        </div>

                        {/* Simulated Intake / NOC Table */}
                        <div className="mt-3 border border-slate-300 rounded p-1.5 bg-slate-50 text-[9px] font-mono space-y-1">
                          <div className="flex justify-between border-b pb-0.5 font-bold text-slate-700">
                            <span>PROGRAMME</span>
                            <span>STATUS / INTAKE</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Computer Science & Engg</span>
                            <span
                              className={`font-bold px-1 rounded ${
                                verdictState === 'ANOMALY_BREACH'
                                  ? 'bg-red-100 text-red-800 border border-red-300 font-mono'
                                  : 'text-slate-900'
                              }`}
                            >
                              {verdictState === 'ANOMALY_BREACH' ? '180 SEATS [CLAIMED]' : '120 SEATS [APPROVED]'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Electronics & Comm Engg</span>
                            <span>60 SEATS</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Mechanical Engineering</span>
                            <span>60 SEATS</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Information Technology</span>
                            <span>120 SEATS</span>
                          </div>
                        </div>

                        <div className="pt-2 text-[9px] text-slate-500 italic leading-snug">
                          "This document represents statutory submission under AICTE APH Regulations. Any unauthorized alterations, forged seals, or expired validity are subject to Section 10(1) penalties."
                        </div>
                      </div>

                      {/* Document Seal / Signatures at Bottom */}
                      <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[8px] font-mono text-slate-500">
                        <div>
                          <div>SHA-256: 7f3b89...</div>
                          <div>Seal: Registered Officer</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-700">DIGITALLY VERIFIED</div>
                          <div>Govt. e-Repository</div>
                        </div>
                      </div>

                      {/* VERIFIED OVERLAY STAMP (When Valid) */}
                      {verdictState === 'VERIFIED_VALID' && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-emerald-950/20 backdrop-blur-[1px] animate-in fade-in duration-300">
                          <div className="px-5 py-3 rounded-2xl border-4 border-emerald-500 bg-emerald-900/90 text-white font-mono font-black text-center shadow-2xl animate-seal-pop rotate-[-6deg] space-y-0.5">
                            <div className="text-2xl flex items-center justify-center gap-1.5 text-emerald-300">
                              <CheckCircle2 className="w-7 h-7" />
                              <span>100% GENUINE</span>
                            </div>
                            <div className="text-[10px] tracking-widest uppercase text-emerald-200">
                              AICTE STATUTORY CLEARANCE GRANTED
                            </div>
                            <div className="text-[8px] text-emerald-400">
                              GAZETTE REFERENCE VERIFIED • 0 DISCREPANCIES
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FRAUD RETICLE BOX OVERLAY (When Anomaly Detected) */}
                      {verdictState === 'ANOMALY_BREACH' && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                          {/* Animated Bounding Box Reticle */}
                          <div
                            className="absolute border-2 border-red-500 bg-red-500/20 rounded shadow-lg animate-pulse"
                            style={{
                              left: '12%',
                              top: '44%',
                              width: '76%',
                              height: '24%',
                            }}
                          >
                            <span className="absolute -top-3.5 left-2 px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-red-600 text-white tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>TAMPERED COORDINATE</span>
                            </span>
                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-400" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-400" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-400" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-400" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LASER SWEEP SCANNING BEAM (Active during SCANNING) */}
                    {verdictState === 'SCANNING' && (
                      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                        {/* Laser Line */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-laser-sweep" />
                        {/* Rotating Radar Rings */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-56 h-56 rounded-full border border-cyan-500/30 animate-radar-spin flex items-center justify-center">
                            <div className="w-36 h-36 rounded-full border border-dashed border-cyan-400/40" />
                            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
                            <div className="absolute h-full w-[1px] bg-cyan-500/20" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: DEEP FORENSIC BREAKDOWN & WHAT IS WRONG / VALID (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  {/* CASE 1: FRAUD / ANOMALY DETECTED */}
                  {verdictState === 'ANOMALY_BREACH' && (
                    <div className="space-y-4">
                      {/* What is wrong: Discrepancy Matrix */}
                      <div className="bg-slate-900/90 rounded-xl p-4 border border-red-500/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span>EXACT DISCREPANCY & VIOLATION BREAKDOWN</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                            SEVERITY: {currentAnomaly.severity}
                          </span>
                        </div>

                        {/* Baseline vs Claimed Side-by-Side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <div className="text-[10px] uppercase font-mono text-slate-400">
                              Council Gazette Baseline Record
                            </div>
                            <div className="font-mono text-emerald-400 font-bold text-sm">
                              {currentAnomaly.expectedValue}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Official AICTE Central Sanction Database
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-red-950/40 border border-red-600/40 space-y-1">
                            <div className="text-[10px] uppercase font-mono text-red-300">
                              Current Uploaded Document Submission
                            </div>
                            <div className="font-mono text-red-400 font-bold text-sm">
                              {currentAnomaly.extractedValue}
                            </div>
                            <div className="text-[10px] text-red-300/80">
                              Discrepancy: {currentAnomaly.discrepancyDelta}
                            </div>
                          </div>
                        </div>

                        {/* Discrepancy Delta Highlight */}
                        {currentAnomaly.discrepancyDelta && (
                          <div className="p-2.5 rounded-lg bg-red-900/20 border border-red-600/30 text-xs font-mono text-red-300 flex items-center justify-between">
                            <span>DISCREPANCY DELTA:</span>
                            <strong className="text-red-400">{currentAnomaly.discrepancyDelta}</strong>
                          </div>
                        )}
                      </div>

                      {/* Specific Forensic Findings List */}
                      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2.5">
                        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <Search className="w-3.5 h-3.5 text-amber-400" />
                          <span>FORENSIC EVIDENCE & REASONING (WHAT IS WRONG):</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {(currentAnomaly.forensicPoints || [
                            'Document extracted parameter contradicts verified AICTE records.',
                            'Typography raster signature does not match authentic Government typography.',
                            'No approved Gazette amendment registered in the statutory portal.',
                            'Failed cross-validation against APH 2026-27 heuristic guidelines.',
                          ]).map((point, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Statutory Recommendation */}
                      <div className="bg-amber-950/20 rounded-xl p-3.5 border border-amber-500/30 text-xs space-y-1">
                        <div className="font-mono font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                          MANDATORY REGULATORY REMEDY (APH 2026-27)
                        </div>
                        <div className="text-slate-200 leading-relaxed">
                          {currentAnomaly.recommendation}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASE 2: CORRECT / 100% VALID */}
                  {verdictState === 'VERIFIED_VALID' && (
                    <div className="space-y-4">
                      {/* Valid Clearance Highlights */}
                      <div className="bg-slate-900/90 rounded-xl p-4 border border-emerald-500/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span>STATUTORY COMPLIANCE CHECKLIST (100% SATISFIED)</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            ALL CHECKS PASSED
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentValid.verificationHighlights.map((hl, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-slate-400 uppercase">{hl.label}</span>
                                {hl.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                                    {hl.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-slate-200">{hl.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Verified Regulatory Assurance */}
                      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2.5">
                        <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>REGULATORY VERIFICATION ASSURANCE:</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-300">
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>Digital cryptographic hash matches official repository with 0 duplicate collisions.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>Institutional identification and territorial plot boundaries match Municipal Land Registrar.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>Validity horizon exceeds regulatory cutoff date; no lapsed conditions detected.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>Meets all mandatory criteria under AICTE Approval Process Handbook (APH 2026-27).</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-500/30 text-xs space-y-1">
                        <div className="font-mono font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
                          OFFICER SCRUTINY RECOMMENDATION
                        </div>
                        <div className="text-slate-200 leading-relaxed">
                          Clear to mark as <strong>VERIFIED</strong> in regulatory docket. Document satisfies all statutory prerequisites for formal grant of approval.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASE 3: SCANNING TERMINAL LOG */}
                  {verdictState === 'SCANNING' && (
                    <div className="bg-slate-900/90 rounded-xl p-5 border border-cyan-500/30 flex-1 flex flex-col justify-between font-mono text-xs space-y-4">
                      <div className="space-y-2">
                        <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2">
                          [AICTE CYBER-FORENSIC TELEMETRY STREAM]
                        </div>
                        <div className="text-slate-400 text-[11px] leading-relaxed space-y-1">
                          <div>&gt; Attaching to Document ID: {currentTarget?.documentId || 'SPECIMEN-LIVE'}</div>
                          <div>&gt; Filename: {currentTarget?.originalFilename || 'UNKNOWN_PAYLOAD.pdf'}</div>
                          <div>&gt; Target Category: {currentTarget?.category || 'STATUTORY_DOCKET'}</div>
                          <div>&gt; Engine: Neural OCR with Sub-pixel Vector Alignment</div>
                          <div className="text-cyan-300 font-semibold">&gt; Status: {scanLog}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>APH 2026-27 Heuristic Screening...</span>
                        <span className="text-cyan-400 font-bold">{scanProgress}%</span>
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS (BOTTOM) */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Target: <span className="text-slate-200 font-bold">{currentTarget?.originalFilename}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {verdictState === 'ANOMALY_BREACH' && onConfirmFinding && (
                        <button
                          onClick={() => {
                            onConfirmFinding(currentAnomaly);
                            onClose();
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-red-950 transition-all flex items-center space-x-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Record Deficient Finding</span>
                        </button>
                      )}

                      {verdictState === 'VERIFIED_VALID' && onApproveDocument && (
                        <button
                          onClick={() => {
                            if (currentTarget) onApproveDocument(currentTarget);
                            onClose();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950 transition-all flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Mark Verified</span>
                        </button>
                      )}

                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Dismiss HUD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DEMO SPECIMEN HUB (8 Complete Realistic Files) */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>AICTE Regulatory Demo Certificates & Specimen Hub</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any certificate specimen below to load it into the Cyber Forensic Scanner and test the detection animation.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    4 Valid Specimen
                  </span>
                  <span className="px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-800">
                    4 Fraud / Anomalies
                  </span>
                </div>
              </div>

              {/* Certificate Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DEMO_CERTIFICATES.map((demo) => {
                  const isValid = demo.type === 'VALID';
                  return (
                    <div
                      key={demo.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isValid
                          ? 'bg-slate-900/80 border-emerald-900/50 hover:border-emerald-500/70'
                          : 'bg-slate-900/80 border-red-900/50 hover:border-red-500/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                                isValid
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}
                            >
                              {isValid ? '✓ VALID CERTIFICATE' : '🚨 ANOMALY / FAKE'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{demo.category}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 leading-snug">{demo.label}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{demo.description}</p>
                        </div>
                        <FileText
                          className={`w-5 h-5 shrink-0 ${isValid ? 'text-emerald-400' : 'text-red-400'}`}
                        />
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="font-mono text-[10px] text-slate-500 truncate max-w-[140px] sm:max-w-[200px]">
                          {demo.name}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={demo.pdfUrl}
                            download={demo.name}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Download PDF Specimen"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={demo.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Open PDF Preview"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => {
                              const newTarget: ScrutinyTarget = {
                                originalFilename: demo.name,
                                category: demo.category,
                                fileUrl: demo.pdfUrl,
                                verdictType: demo.type,
                                anomaly: demo.anomaly || undefined,
                                validDetails: demo.validDetails || undefined,
                              };
                              setCurrentTarget(newTarget);
                              triggerScrutinyScan(newTarget);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-sm ${
                              isValid
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            <span>{isValid ? 'Scan Valid' : 'Scan Anomaly'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                verdictState === 'ANOMALY_BREACH'
                  ? 'bg-red-500 animate-ping'
                  : verdictState === 'VERIFIED_VALID'
                  ? 'bg-emerald-400'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <span>
              {verdictState === 'ANOMALY_BREACH'
                ? 'AICTE Regulatory Breach Identified'
                : verdictState === 'VERIFIED_VALID'
                ? 'AICTE Statutory Clearance Active'
                : 'Scrutiny Scanner Ready'}
            </span>
          </div>
          <button onClick={onClose} className="hover:text-white transition-colors">
            Dismiss HUD
          </button>
        </div>
      </div>
    </div>
  );
};
