import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Institution, ApplicationCategory, DocumentCategory, Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Building2,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Shield,
  Scale,
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
  Eye,
  RefreshCw,
  Sparkles,
  FileUp,
  FolderCheck,
} from 'lucide-react';
import { AicteEmblem } from '../components/AicteEmblem';

interface DocumentRequirement {
  category: DocumentCategory;
  name: string;
  hindiName: string;
  mandatory: boolean;
  code: string;
  description: string;
  authority: string;
  fileHint: string;
}

interface AttachedFileItem {
  file: File;
  category: DocumentCategory;
  customLabel?: string;
  uploaded?: boolean;
  uploadedDocId?: string;
}

// Generate requirements list according to AICTE Approval Process Handbook (APH 2026-27)
const getCategoryRequirements = (cat: ApplicationCategory): DocumentRequirement[] => {
  const isEoa = cat === 'EOA';
  const isNewProg = cat === 'NEW_PROGRAMME';
  const isIntake = cat === 'INTAKE_CHANGE';
  const isDetailChange = cat === 'INSTITUTION_DETAIL_CHANGE';

  return [
    {
      category: 'AFFIDAVIT',
      name: 'Statutory Compliance Affidavit on ₹100 Stamp Paper',
      hindiName: '₹100 के स्टाम्प पेपर पर अनिवार्य विहित शपथ-पत्र',
      mandatory: true,
      code: 'DOC-APH-01',
      description: 'Prescribed AICTE statutory affidavit affirmed under oath before First Class Judicial Magistrate or Notary Public covering institutional, land, faculty & safety commitments.',
      authority: 'Affirmed under IPC Sec 193 & AICTE APH 2026-27 Clause 2.1',
      fileHint: 'Prescribed AICTE Format (PDF format, max 10MB)',
    },
    {
      category: 'PREVIOUS_EOA',
      name: 'Previous Academic Year AICTE Approval Order (EoA 2025-26)',
      hindiName: 'पूर्व शैक्षणिक सत्र का एआईसीटीई अनुमोदन पत्र (ईओए 2025-26)',
      mandatory: isEoa || isIntake,
      code: 'DOC-APH-02',
      description: 'Official AICTE Extension of Approval (EoA) order issued for session 2025-2026. Utilised by AI scrutiny engine for historical comparison, seat matrix audit, and variance tracking.',
      authority: 'AICTE Council Order for Session 2025-26',
      fileHint: 'Official AICTE Gazette / Order Copy (PDF)',
    },
    {
      category: 'FIRE_SAFETY_CERTIFICATE',
      name: 'Fire Safety Certificate / NOC from Competent Authority',
      hindiName: 'अग्निशमन सुरक्षा प्रमाण-पत्र / अनापत्ति प्रमाण-पत्र',
      mandatory: true,
      code: 'DOC-APH-03',
      description: 'Valid Fire Safety NOC issued by State Fire Service Department / Municipal Chief Fire Officer covering all instructional and administrative blocks with current academic year validity.',
      authority: 'State Fire Services Directorate / NBC Part IV',
      fileHint: 'Valid Fire NOC Certificate (PDF)',
    },
    {
      category: 'BUILDING_STABILITY_CERTIFICATE',
      name: 'Building Stability & Structural Soundness Certificate',
      hindiName: 'भवन स्थिरता एवं संरचनात्मक सुरक्षा प्रमाण-पत्र',
      mandatory: true,
      code: 'DOC-APH-04',
      description: 'Structural stability certificate issued by PWD Executive Engineer or Registered Chartered Structural Engineer for all educational building blocks.',
      authority: 'PWD / Municipal Registered Structural Engineer',
      fileHint: 'Structural Stability Certificate (PDF)',
    },
    {
      category: 'NOC_LAND_USE',
      name: 'Land Title & Land Use Certificate / Revenue Conversion NOC',
      hindiName: 'भूमि उपयोग एवं स्वामित्व प्रमाण-पत्र / रूपांतरण आदेश',
      mandatory: isNewProg || isDetailChange,
      code: 'DOC-APH-05',
      description: 'Master title deed, non-encumbrance certificate, and competent revenue authority order confirming designated educational land use in single or permissible contiguous plots.',
      authority: 'Competent District Revenue Authority / Tehsildar',
      fileHint: 'Registered Land Deeds & Mutation Record (PDF)',
    },
    {
      category: 'FACULTY_LIST_EVIDENCE',
      name: 'Faculty Cadre Roster & 7th CPC Salary Disbursement Proof',
      hindiName: 'संकाय रोस्टर एवं वेतन संवितरण साक्ष्य',
      mandatory: isEoa || isIntake,
      code: 'DOC-APH-06',
      description: 'Principal-certified faculty cadre list (Professor, Associate, Assistant in 1:2:6 ratio) with qualifications, biometric attendance extract, and bank salary credit proofs.',
      authority: 'Institutional Cadre Roster / Bank Endorsement',
      fileHint: 'Cadre Roster & Bank Statement (PDF)',
    },
    {
      category: 'TER_FEE_RECEIPT',
      name: 'Technical Education Regulatory (TER) Processing Fee Receipt',
      hindiName: 'तकनीकी शिक्षा विनियामक (TER) शुल्क भुगतान रसीद',
      mandatory: true,
      code: 'DOC-APH-07',
      description: 'Official payment challan / BharatKosh transaction confirmation receipt for the applicable statutory processing fees.',
      authority: 'BharatKosh / AICTE Payment Gateway Receipt',
      fileHint: 'Government Payment Receipt (PDF)',
    },
    {
      category: 'INFRASTRUCTURE_PLAN',
      name: 'Approved Architectural Master Layout & Floor Plans',
      hindiName: 'स्वीकृत वास्तुशिल्प लेआउट एवं भवन योजना',
      mandatory: isNewProg || isIntake,
      code: 'DOC-APH-08',
      description: 'Architect-certified building layout plan highlighting instructional carpet area, laboratories, workshops, barrier-free access ramps, and student amenities.',
      authority: 'Registered Architect (COA) & Municipal Planning Authority',
      fileHint: 'Approved Layout Blueprint (PDF)',
    },
    {
      category: 'ACCREDITATION_CERTIFICATE',
      name: 'Accreditation Certificate (NBA / NAAC Grade)',
      hindiName: 'प्रत्यायन प्रमाण-पत्र (एनबीए / नैक)',
      mandatory: false,
      code: 'DOC-APH-09',
      description: 'Valid NBA accreditation letter or NAAC grade sheet for eligible accredited programmes seeking intake expansion or autonomous privileges.',
      authority: 'National Board of Accreditation / NAAC',
      fileHint: 'Accreditation Certificate (PDF)',
    },
    {
      category: 'OTHER_SUPPORTING',
      name: 'Affiliating University NOC / Trust Resolution Undertaking',
      hindiName: 'विश्वविद्यालय संबद्धता / ट्रस्ट संकल्प अनापत्ति',
      mandatory: false,
      code: 'DOC-APH-10',
      description: 'Affiliating State Technical University NOC, Society/Trust governing resolution, or any additional state government approvals.',
      authority: 'State Technical University / Sponsoring Trust',
      fileHint: 'University NOC / Trust Resolution (PDF)',
    },
  ];
};

// Generates a lightweight, valid PDF Blob for frictionless 1-click testing
const generateSamplePdfFile = (category: string, filename: string): File => {
  const dateStr = new Date().toISOString().split('T')[0];
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 260 >>
stream
BT
/F1 16 Tf
50 720 Td
(ALL INDIA COUNCIL FOR TECHNICAL EDUCATION) Tj
/F1 12 Tf
0 -30 Td
(Regulatory Compliance Document Filing — APH 2026-27) Tj
0 -20 Td
(Document Category: ${category}) Tj
0 -20 Td
(File: ${filename}) Tj
0 -20 Td
(Verification Timestamp: ${dateStr}) Tj
0 -30 Td
(This is an authentic regulatory submission for AICTE institutional scrutiny.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
510
%%EOF`;

  const blob = new Blob([pdfString], { type: 'application/pdf' });
  return new File([blob], filename, { type: 'application/pdf' });
};

export const NewApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isHindi } = useLanguage();

  // Wizard Stage: 1 = Particulars & Document Attachment, 2 = Docket Confirmation & Upload Desk
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [category, setCategory] = useState<ApplicationCategory>('EOA');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [submissionNotes, setSubmissionNotes] = useState<string>('');
  const [declaredUnderOath, setDeclaredUnderOath] = useState<boolean>(false);

  // Attached Documents State (keyed by category)
  const [attachedDocs, setAttachedDocs] = useState<Record<string, AttachedFileItem>>({});
  const [customUploadCategory, setCustomUploadCategory] = useState<DocumentCategory>('OTHER_SUPPORTING');

  // Execution & Progress States
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Created Docket on Success
  const [createdDocket, setCreatedDocket] = useState<Application | null>(null);

  // Hidden File Input Ref for custom document addition
  const customFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.getInstitutions()
      .then((data: Institution[]) => {
        setInstitutions(data);
        if (user?.institutionId) {
          setSelectedInstId(user.institutionId);
        } else if (data.length > 0) {
          setSelectedInstId(data[0].id);
        }
      })
      .catch(() => {});
  }, [user]);

  const requirements = getCategoryRequirements(category);
  const selectedInst = institutions.find(i => i.id === selectedInstId);

  // Handle local file selection for a specific category
  const handleFileSelect = (cat: DocumentCategory, file: File | null) => {
    if (!file) {
      setAttachedDocs(prev => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 10 MB regulatory upload limit.`);
      return;
    }

    setAttachedDocs(prev => ({
      ...prev,
      [cat]: {
        file,
        category: cat,
      },
    }));
  };

  // 1-Click sample PDF generator for rapid demo testing
  const handleAutoFillSamplePdfs = () => {
    const newAttachments: Record<string, AttachedFileItem> = { ...attachedDocs };
    requirements.forEach((req) => {
      if (req.mandatory) {
        const sampleFilename = `${req.category.toLowerCase()}_compliance_sample.pdf`;
        newAttachments[req.category] = {
          file: generateSamplePdfFile(req.category, sampleFilename),
          category: req.category,
        };
      }
    });
    setAttachedDocs(newAttachments);
  };

  // Upload single document when in Step 2
  const handleUploadSingleDocumentInStep2 = async (cat: DocumentCategory, file: File) => {
    if (!createdDocket) return;
    setLoading(true);
    setUploadStatusText(`Uploading ${cat.replace(/_/g, ' ')} to Docket ${createdDocket.referenceNumber}...`);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', cat);
      await api.uploadDocument(createdDocket.id, formData);

      // Refresh application docket to update documents list
      const refreshed = await api.getApplication(createdDocket.id);
      setCreatedDocket(refreshed);

      // Mark local item as uploaded
      setAttachedDocs(prev => ({
        ...prev,
        [cat]: {
          file,
          category: cat,
          uploaded: true,
        },
      }));
    } catch (err: any) {
      setError(err.message || `Failed to upload ${cat}.`);
    } finally {
      setLoading(false);
      setUploadStatusText('');
    }
  };

  // Step 1 Submission: Generate Docket and Upload any attached files
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      setError('Please select an authorized technical institution for this filing.');
      return;
    }
    if (!declaredUnderOath) {
      setError('Statutory declaration under oath is mandatory to initiate an AICTE compliance docket.');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadStatusText('Initializing AICTE Regulatory Compliance Docket...');

    try {
      // 1. Create the Application Docket in Database
      const created = await api.createApplication({
        institutionId: selectedInstId,
        category,
        academicYear,
        submissionNotes,
      });

      setCreatedDocket(created);

      // 2. Upload any files that were attached in Section 4
      const entriesToUpload = Object.values(attachedDocs).filter(item => !item.uploaded);
      if (entriesToUpload.length > 0) {
        let uploadedCount = 0;
        for (const item of entriesToUpload) {
          uploadedCount++;
          setUploadStatusText(
            `Uploading Regulatory File (${uploadedCount}/${entriesToUpload.length}): ${item.category.replace(/_/g, ' ')}...`
          );
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('category', item.category);
          try {
            await api.uploadDocument(created.id, formData);
            item.uploaded = true;
          } catch (uploadErr: any) {
            console.warn(`Failed to upload ${item.category}:`, uploadErr);
          }
        }
      }

      // 3. Fetch refreshed application with uploaded documents
      const refreshed = await api.getApplication(created.id);
      setCreatedDocket(refreshed);

      // 4. Advance smoothly to Step 2: Document Upload & Scrutiny Center
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize regulatory compliance docket.');
    } finally {
      setLoading(false);
      setUploadStatusText('');
    }
  };

  const attachedCount = Object.keys(attachedDocs).length;
  const mandatoryCount = requirements.filter(r => r.mandatory).length;
  const mandatoryAttachedCount = requirements.filter(r => r.mandatory && attachedDocs[r.category]).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Official Government Header Banner with Tricolor Accent */}
      <div className="bg-gradient-to-r from-[#002147] via-[#082b59] to-[#001733] text-white p-6 rounded-xl border-t-4 border-[#FF9933] shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (step === 2 ? setStep(1) : navigate('/applications'))}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
              title={step === 2 ? 'Return to Application Particulars' : 'Return to Registry'}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-lg bg-white/10 p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
              <AicteEmblem size={38} className="brightness-125" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-[#FFB366] uppercase">
                {isHindi
                  ? 'अखिल भारतीय तकनीकी शिक्षा परिषद | Approval Process Handbook 2026-27'
                  : 'All India Council for Technical Education | Approval Process Handbook 2026-27'}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {isHindi
                  ? 'नया संस्थागत विनियामक आवेदन एवं विहित दस्तावेज़ संवीक्षा'
                  : 'New Institutional Regulatory Filing & Document Scrutiny Desk'}
              </h1>
              <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                {step === 1
                  ? 'Initiate statutory compliance docket and attach mandatory regulatory documents for Extension of Approval (EoA) or intake expansion.'
                  : 'AICTE regulatory compliance docket active. Review, upload, and dispatch mandatory documents for AI-powered OCR verification.'}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#E65100]/30 border border-[#FF9933]/40 text-[#FFB366] text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3 text-[#FF9933]" />
              <span>{step === 1 ? 'Official Filing' : 'Docket Created'}</span>
            </span>
            <span className="text-[10px] text-blue-200/60 font-mono mt-1">Form AICTE-SCR-26</span>
          </div>
        </div>

        {/* 2-Step Process Indicator */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
          <div
            className={`flex items-center space-x-2.5 p-2 rounded-lg transition-colors ${
              step === 1 ? 'bg-white/15 text-white font-bold' : 'text-blue-200/70'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1 ? 'bg-[#FF9933] text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {step === 2 ? '✓' : '1'}
            </span>
            <span className="truncate">Step 1: Institutional Particulars & Statutory Oath</span>
          </div>
          <div
            className={`flex items-center space-x-2.5 p-2 rounded-lg transition-colors ${
              step === 2 ? 'bg-white/15 text-white font-bold' : 'text-blue-200/70'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2 ? 'bg-[#FF9933] text-white' : 'bg-white/20 text-white'
              }`}
            >
              2
            </span>
            <span className="truncate">Step 2: Upload Relevant Regulatory Documents</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start space-x-3 text-sm text-rose-800 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-900">Validation Error in Filing</div>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Toast when Uploading */}
      {loading && uploadStatusText && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-300 flex items-center space-x-3 text-sm text-blue-900 shadow-sm animate-pulse">
          <RefreshCw className="w-5 h-5 text-[#002147] animate-spin shrink-0" />
          <div className="font-medium text-xs sm:text-sm">{uploadStatusText}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: INSTITUTIONAL PARTICULARS + ATTACH RELEVANT DOCUMENTS             */}
      {/* ========================================================================= */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Institution Selection */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#002147]" />
                <span>Section 1: Technical Institution Particulars</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Mandatory AICTE Code
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Registered Technical Institution <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(e.target.value)}
                  disabled={Boolean(user?.institutionId && user.role === 'APPLICANT')}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white disabled:bg-slate-50 disabled:text-slate-500"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.institutionCode}) — {inst.state} ({inst.institutionType})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInst && (
                <div className="p-4 bg-blue-50/40 rounded-lg border border-blue-100 text-xs space-y-1.5 text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">AICTE Permanent ID</span>
                      <span className="font-mono font-bold text-[#002147]">{selectedInst.institutionCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Category / Type</span>
                      <span className="font-medium">{selectedInst.institutionType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Jurisdiction / State</span>
                      <span className="font-medium">{selectedInst.state}</span>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-blue-100/60 text-slate-600 text-[11px]">
                    <strong>Campus Location:</strong> {selectedInst.address}, {selectedInst.state}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Regulatory Approval Category */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <FileCheck2 className="w-4 h-4 text-[#002147]" />
                <span>Section 2: Statutory Approval Category & Academic Period</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                APH Norms 2026-27
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Approval Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ApplicationCategory)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white font-medium"
                  >
                    <option value="EOA">Extension of Approval (EoA) — Periodic Renewal</option>
                    <option value="NEW_PROGRAMME">Introduction of New Programme / Course / Discipline</option>
                    <option value="INTAKE_CHANGE">Increase / Variation in Approved Intake Capacity</option>
                    <option value="INSTITUTION_DETAIL_CHANGE">Change of Site / Society / Institute Name</option>
                    <option value="OTHER">Other Configurable Regulatory Request</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Document checklist dynamically updates based on regulatory approval category.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Academic Year <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026-2027"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147] font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    AICTE national scrutiny cycle for academic session 2026-27.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Executive Justification / Institutional Remarks
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Briefly state infrastructure additions, faculty readiness, and regulatory compliance status for this academic year filing..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Statutory Declaration Under Oath */}
          <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-amber-800" />
              <span>Statutory Declaration Under Oath (Section 193 Indian Penal Code & IT Act 2000)</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              I hereby solemnly declare and affirm that all institutional particulars, land records, faculty rosters, building safety plans, and financial guarantees submitted through this AICTE portal are authentic, complete, and verifiable. I understand that submitting false or fraudulent documentation constitutes a cognizable offense and invites immediate de-recognition, withdrawal of approval, and penal prosecution.
            </p>
            <label className="flex items-start space-x-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={declaredUnderOath}
                onChange={(e) => setDeclaredUnderOath(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#002147] border-amber-400 focus:ring-[#002147]"
              />
              <span className="text-xs font-semibold text-amber-950">
                I agree to the statutory declaration and affirm under oath that all submitted information is true and accurate.
              </span>
            </label>
          </div>

          {/* Section 4: Relevant Regulatory Documents Upload Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Upload className="w-4 h-4 text-[#002147]" />
                  <span>Section 4: Upload Relevant Regulatory Documents</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach statutory compliance documents now in PDF format (Max 10MB each), or continue to Step 2 to upload files one by one.
                </p>
              </div>

              {/* Quick 1-Click Sample PDF Button for Easy Testing */}
              <button
                type="button"
                onClick={handleAutoFillSamplePdfs}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all shadow-xs"
                title="Automatically attaches mock PDF certificates for all mandatory fields to test the upload pipeline"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo: Auto-Attach Sample PDFs</span>
              </button>
            </div>

            {/* Checklist Header Summary */}
            <div className="bg-blue-50/50 px-6 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <FolderCheck className="w-4 h-4 text-[#002147]" />
                <span>
                  Mandatory Documents Attached:{' '}
                  <strong className={mandatoryAttachedCount >= mandatoryCount ? 'text-emerald-700' : 'text-amber-700'}>
                    {mandatoryAttachedCount} of {mandatoryCount}
                  </strong>{' '}
                  ({attachedCount} total files selected)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Accepted: .pdf (Max 10MB)</span>
            </div>

            {/* List of Relevant Documents tailored to approval category */}
            <div className="divide-y divide-slate-100">
              {requirements.map((req) => {
                const attached = attachedDocs[req.category];
                return (
                  <div
                    key={req.category}
                    className={`p-4 sm:p-5 transition-colors ${
                      attached ? 'bg-emerald-50/20' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Document details */}
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{req.name}</span>
                          {req.mandatory ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              Supporting
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {req.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#002147]/80 font-medium">{req.hindiName}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>
                        <div className="text-[10px] text-slate-400 font-medium">Authority: {req.authority}</div>
                      </div>

                      {/* Right: Upload controls or Attached Status */}
                      <div className="shrink-0 sm:w-64">
                        {attached ? (
                          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between space-x-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="truncate text-xs font-semibold text-emerald-950">
                                <div className="truncate" title={attached.file.name}>
                                  {attached.file.name}
                                </div>
                                <div className="text-[10px] text-emerald-700 font-mono">
                                  {(attached.file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFileSelect(req.category, null)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-slate-300 hover:border-[#002147] rounded-lg cursor-pointer bg-slate-50 hover:bg-blue-50/40 text-slate-700 hover:text-[#002147] transition-all text-xs font-semibold group shadow-2xs">
                            <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#002147]" />
                            <span>Select PDF File</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleFileSelect(req.category, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Submission Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Encrypted with SHA-256 and audited under IT Act 2000 Sec 43A</span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate('/applications')}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !declaredUnderOath}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-bold shadow-md transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed border border-[#FF9933]/30"
              >
                <span>
                  {loading
                    ? 'Initializing Docket & Uploading...'
                    : attachedCount > 0
                    ? `Generate AICTE Docket & Upload ${attachedCount} Document${attachedCount > 1 ? 's' : ''}`
                    : 'Generate AICTE Docket & Proceed to Documents'}
                </span>
                <ArrowRight className="w-4 h-4 text-[#FF9933]" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DOCKET CONFIRMATION & REGULATORY DOCUMENT UPLOAD CENTER           */}
      {/* ========================================================================= */}
      {step === 2 && createdDocket && (
        <div className="space-y-6 animate-fadeIn">
          {/* AICTE Regulatory Docket Created Banner */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-300 p-6 space-y-3 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Statutory Filing Initiated Successfully
                  </div>
                  <h2 className="text-lg font-bold text-emerald-950 mt-0.5">
                    AICTE Compliance Docket Generated: {createdDocket.referenceNumber}
                  </h2>
                  <p className="text-xs text-emerald-800 mt-1 max-w-2xl leading-relaxed">
                    Institutional compliance docket has been officially registered in the AICTE national regulatory repository. Please review and complete upload of all mandatory documents below before dispatching for AI-powered OCR verification.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-mono font-bold">
                Status: {createdDocket.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/80 text-xs">
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Permanent AICTE Code</span>
                <span className="font-mono font-bold text-emerald-950">
                  {createdDocket.institution?.institutionCode || selectedInst?.institutionCode}
                </span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Approval Category</span>
                <span className="font-medium text-emerald-950">{createdDocket.category.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Academic Session</span>
                <span className="font-medium text-emerald-950">{createdDocket.academicYear}</span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Documents Filed</span>
                <span className="font-bold text-emerald-950">
                  {createdDocket.documents?.length || 0} Documents
                </span>
              </div>
            </div>
          </div>

          {/* Document Upload Center */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#002147]" />
                  <span>Mandatory Regulatory Documents for AICTE Scrutiny</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload remaining documents or replace uploaded files. All files are automatically cryptographically hashed with SHA-256.
                </p>
              </div>

              {/* Upload custom additional document button */}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={customFileInputRef}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadSingleDocumentInStep2(customUploadCategory, file);
                    }
                  }}
                />
                <select
                  value={customUploadCategory}
                  onChange={(e) => setCustomUploadCategory(e.target.value as DocumentCategory)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value="OTHER_SUPPORTING">Other Supporting Document</option>
                  <option value="ACCREDITATION_CERTIFICATE">Accreditation Certificate</option>
                  <option value="INFRASTRUCTURE_PLAN">Infrastructure Blueprint</option>
                  <option value="NOC_LAND_USE">Land Use NOC</option>
                </select>
                <button
                  type="button"
                  onClick={() => customFileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#002147] hover:bg-[#001733] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document</span>
                </button>
              </div>
            </div>

            {/* List of Document Slots */}
            <div className="divide-y divide-slate-100">
              {requirements.map((req) => {
                const uploadedDoc = createdDocket.documents?.find(d => d.category === req.category);
                const localAttached = attachedDocs[req.category];

                return (
                  <div key={req.category} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Metadata */}
                      <div className="space-y-1 flex-1 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{req.name}</span>
                          {req.mandatory ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              Supporting
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {req.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{req.description}</p>

                        {/* Uploaded state indicator */}
                        {uploadedDoc ? (
                          <div className="flex items-center space-x-3 pt-1 text-xs">
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Uploaded: {uploadedDoc.originalFilename}</span>
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {(uploadedDoc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              SHA: {uploadedDoc.sha256.substring(0, 10)}...
                            </span>
                          </div>
                        ) : localAttached && !localAttached.uploaded ? (
                          <div className="flex items-center space-x-2 pt-1 text-xs text-blue-800">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Attached locally: {localAttached.file.name} — ready to upload</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 pt-1 text-xs text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending document upload for statutory compliance</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex items-center space-x-2">
                        {uploadedDoc ? (
                          <>
                            <a
                              href={api.getDocumentFileUrl(uploadedDoc.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#002147] text-xs font-semibold border border-blue-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View PDF</span>
                            </a>
                            <label className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                              <FileUp className="w-3.5 h-3.5" />
                              <span>Replace</span>
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadSingleDocumentInStep2(req.category, file);
                                }}
                              />
                            </label>
                          </>
                        ) : (
                          <label className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#002147] hover:bg-[#001733] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm">
                            <Upload className="w-3.5 h-3.5 text-[#FF9933]" />
                            <span>Upload PDF</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadSingleDocumentInStep2(req.category, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2 Bottom Navigation Actions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Docket Ref: <strong className="font-mono text-[#002147]">{createdDocket.referenceNumber}</strong>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate(`/applications/${createdDocket.id}`)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
              >
                View Application Dossier
              </button>
              <button
                type="button"
                onClick={() => navigate(`/applications/${createdDocket.id}?tab=documents`)}
                className="px-4 py-2.5 border border-[#002147]/20 rounded-lg text-xs font-semibold text-[#002147] bg-blue-50/50 hover:bg-blue-100/60 transition-colors shadow-xs"
              >
                Open Document Registry
              </button>
              <button
                type="button"
                onClick={() => navigate(`/applications/${createdDocket.id}?tab=comparison`)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-bold shadow-md transition-all border border-[#FF9933]/30"
              >
                <span>Proceed to AI Scrutiny Desk</span>
                <ArrowRight className="w-4 h-4 text-[#FF9933]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

