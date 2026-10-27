import { PrismaClient, Role, ApplicationCategory, ApplicationStatus, DocumentCategory, ProcessingStatus, VerificationStatus, ReviewStatus, Severity, FindingStatus, ProviderMode, RunType, FieldSource } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { comparePreviousEoa } from '../src/services/eoaComparisonEngine.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AICTE VerifyAI synthetic database...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.clarificationRequest.deleteMany();
  await prisma.verificationItem.deleteMany();
  await prisma.sourceVerification.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.validationRule.deleteMany();
  await prisma.extractedField.deleteMany();
  await prisma.processingJob.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  const passwordHash = await bcrypt.hash('demo12345', 10);

  // 2. Create Institutions
  const instApex = await prisma.institution.create({
    data: {
      institutionCode: 'AICTE-DEMO-101',
      name: 'Apex Institute of Technology & Management',
      institutionType: 'Engineering & Technology',
      address: 'Plot 42, Knowledge Park III, Pune',
      state: 'Maharashtra',
    },
  });

  const instSaraswati = await prisma.institution.create({
    data: {
      institutionCode: 'AICTE-DEMO-102',
      name: 'Saraswati Vidyapeeth College of Engineering',
      institutionType: 'Engineering & Technology',
      address: 'Survey No. 88, Electronic City Phase 1, Bengaluru',
      state: 'Karnataka',
    },
  });

  const instNational = await prisma.institution.create({
    data: {
      institutionCode: 'AICTE-DEMO-103',
      name: 'National Academy of Management Studies',
      institutionType: 'Management',
      address: 'Institutional Area, Sector 62, Noida / NCR',
      state: 'Delhi NCR',
    },
  });

  const instVanguard = await prisma.institution.create({
    data: {
      institutionCode: 'AICTE-DEMO-104',
      name: 'Vanguard Polytechnic Institute',
      institutionType: 'Polytechnic',
      address: 'GIDC Industrial Estate, Vadodara',
      state: 'Gujarat',
    },
  });

  const instHimalayan = await prisma.institution.create({
    data: {
      institutionCode: 'AICTE-DEMO-105',
      name: 'Himalayan Institute of Pharmaceutical Sciences',
      institutionType: 'Pharmacy',
      address: 'Rajpur Road, Dehradun',
      state: 'Uttarakhand',
    },
  });

  const instDeccan = await prisma.institution.create({
    data: {
      institutionCode: 'AICTE-DEMO-106',
      name: 'Deccan Institute of Computer Applications',
      institutionType: 'Computer Applications & IT',
      address: 'OMR IT Highway, Chennai',
      state: 'Tamil Nadu',
    },
  });

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma',
      email: 'admin@aicte.demo.gov.in',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const officerPriya = await prisma.user.create({
    data: {
      name: 'Smt. Priya Nair',
      email: 'officer1@aicte.demo.gov.in',
      passwordHash,
      role: Role.OFFICER,
    },
  });

  const officerVikram = await prisma.user.create({
    data: {
      name: 'Shri Vikram Verma',
      email: 'officer2@aicte.demo.gov.in',
      passwordHash,
      role: Role.OFFICER,
    },
  });

  const seniorRamaswamy = await prisma.user.create({
    data: {
      name: 'Prof. K. Ramaswamy',
      email: 'senior@aicte.demo.gov.in',
      passwordHash,
      role: Role.SENIOR_REVIEWER,
    },
  });

  const applicantApex = await prisma.user.create({
    data: {
      name: 'Dr. Arvind Patel',
      email: 'applicant.apex@demo.edu.in',
      passwordHash,
      role: Role.APPLICANT,
      institutionId: instApex.id,
    },
  });

  const applicantSaraswati = await prisma.user.create({
    data: {
      name: 'Dr. Sunita Deshmukh',
      email: 'applicant.saraswati@demo.edu.in',
      passwordHash,
      role: Role.APPLICANT,
      institutionId: instSaraswati.id,
    },
  });

  const demoViewer = await prisma.user.create({
    data: {
      name: 'Auditor Demo Account',
      email: 'viewer@aicte.demo.gov.in',
      passwordHash,
      role: Role.DEMO_VIEWER,
    },
  });

  // 4. Create Standard Validation Rules (Demo Rules)
  const rules = await Promise.all([
    prisma.validationRule.create({
      data: {
        ruleCode: 'RULE_REQ_AFFIDAVIT',
        name: 'Mandatory AICTE Regulatory Affidavit',
        description: 'Submission must contain a valid, signed undertaking/affidavit as prescribed in approval process guidelines.',
        applicationCategories: ['ALL'],
        severity: Severity.CRITICAL,
        version: 1,
        enabled: true,
        configurationJson: { requiredCategory: 'AFFIDAVIT' },
        remediationText: 'Upload the sworn regulatory affidavit on appropriate stamp paper signed by authorized authority.',
        createdById: adminUser.id,
      },
    }),
    prisma.validationRule.create({
      data: {
        ruleCode: 'RULE_REQ_PREV_EOA',
        name: 'Previous Academic Year EoA Certificate',
        description: 'Existing institutes applying for Extension of Approval must provide the preceding year AICTE approval letter.',
        applicationCategories: ['EOA', 'INTAKE_CHANGE'],
        severity: Severity.HIGH,
        version: 1,
        enabled: true,
        configurationJson: { requiredCategory: 'PREVIOUS_EOA' },
        remediationText: 'Upload official AICTE approval letter for the immediate preceding academic session.',
        createdById: adminUser.id,
      },
    }),
    prisma.validationRule.create({
      data: {
        ruleCode: 'RULE_DOC_EXPIRY_CHECK',
        name: 'Document Validity & Expiry Verification',
        description: 'Certificates including Fire Safety, Building Stability, and NOCs must not be expired at submission date.',
        applicationCategories: ['ALL'],
        severity: Severity.HIGH,
        version: 1,
        enabled: true,
        configurationJson: { categoriesToCheck: ['FIRE_SAFETY_CERTIFICATE', 'BUILDING_STABILITY_CERTIFICATE', 'ACCREDITATION_CERTIFICATE'] },
        remediationText: 'Provide renewed validity certificate from the competent local municipal or safety authority.',
        createdById: adminUser.id,
      },
    }),
    prisma.validationRule.create({
      data: {
        ruleCode: 'RULE_NAME_CONSISTENCY',
        name: 'Institution Legal Name & Code Consistency',
        description: 'Institution legal title and permanent code on submitted certificates must match application header.',
        applicationCategories: ['ALL'],
        severity: Severity.MEDIUM,
        version: 1,
        enabled: true,
        configurationJson: { matchFields: ['institution_name', 'institution_code'] },
        remediationText: 'Verify that certificates reflect current registered institution name or provide Gazette notification of name change.',
        createdById: adminUser.id,
      },
    }),
    prisma.validationRule.create({
      data: {
        ruleCode: 'RULE_DUPLICATE_FILE_HASH',
        name: 'Exact Duplicate File Upload Detection',
        description: 'Flags documents with identical SHA-256 cryptographic hashes uploaded across distinct categories.',
        applicationCategories: ['ALL'],
        severity: Severity.MEDIUM,
        version: 1,
        enabled: true,
        configurationJson: { checkSha256: true },
        remediationText: 'Ensure distinct supporting documents are uploaded for distinct compliance requirements.',
        createdById: adminUser.id,
      },
    }),
    prisma.validationRule.create({
      data: {
        ruleCode: 'RULE_FACULTY_CADRE_RATIO',
        name: 'Cadre Ratio & Faculty Evidence Sufficiency',
        description: 'Faculty roster must reflect AICTE student-to-faculty norms (1:15 or 1:20 according to program).',
        applicationCategories: ['EOA', 'INTAKE_CHANGE', 'NEW_PROGRAMME'],
        severity: Severity.MEDIUM,
        version: 1,
        enabled: true,
        configurationJson: { requiredCategory: 'FACULTY_LIST_EVIDENCE' },
        remediationText: 'Upload certified faculty muster roll detailing Cadre (Professor/Associate/Assistant) and qualifications.',
        createdById: adminUser.id,
      },
    }),
  ]);

  // 5. Create Applications
  // App 0: Apex - Previous Academic Session Approved EoA (2025-26)
  const appApexPrev = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2025-26/1-9876543',
      institutionId: instApex.id,
      createdById: applicantApex.id,
      assignedOfficerId: officerPriya.id,
      category: ApplicationCategory.EOA,
      academicYear: '2025-2026',
      status: ApplicationStatus.COMPLETED_IN_PROTOTYPE,
      submissionNotes: 'Approved Extension of Approval order for Academic Session 2025-26.',
      submittedAt: new Date('2025-09-12T10:00:00Z'),
    },
  });

  // App 1: Apex - Current EoA under Scrutiny linked to Previous EoA
  const app1 = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2026-27/1-10142981',
      institutionId: instApex.id,
      createdById: applicantApex.id,
      assignedOfficerId: officerPriya.id,
      category: ApplicationCategory.EOA,
      academicYear: '2026-2027',
      status: ApplicationStatus.UNDER_SCRUTINY,
      previousApplicationId: appApexPrev.id,
      previousEoaReference: appApexPrev.referenceNumber,
      previousAcademicYear: '2025-2026',
      submissionNotes: 'Annual Extension of Approval submission for UG Engineering programs.',
      submittedAt: new Date('2026-09-15T10:30:00Z'),
    },
  });

  // App 2: Saraswati - Intake Change with Action Required
  const app2 = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2026-27/1-10294821',
      institutionId: instSaraswati.id,
      createdById: applicantSaraswati.id,
      assignedOfficerId: officerVikram.id,
      category: ApplicationCategory.INTAKE_CHANGE,
      academicYear: '2026-2027',
      status: ApplicationStatus.ACTION_REQUIRED,
      submissionNotes: 'Request for 60-seat intake expansion in Artificial Intelligence & Data Science.',
      submittedAt: new Date('2026-09-20T14:15:00Z'),
    },
  });

  // App 3: National Academy - New Programme Escalated
  const app3 = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2026-27/1-10385712',
      institutionId: instNational.id,
      createdById: adminUser.id, // proxy admin submission
      assignedOfficerId: officerPriya.id,
      category: ApplicationCategory.NEW_PROGRAMME,
      academicYear: '2026-2027',
      status: ApplicationStatus.ESCALATED,
      submissionNotes: 'Introduction of new Executive PGDM program in Business Analytics.',
      submittedAt: new Date('2026-09-10T11:00:00Z'),
    },
  });

  // App 4: Vanguard - Completed in Prototype
  const app4 = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2026-27/1-10492837',
      institutionId: instVanguard.id,
      createdById: adminUser.id,
      assignedOfficerId: officerVikram.id,
      category: ApplicationCategory.EOA,
      academicYear: '2026-2027',
      status: ApplicationStatus.COMPLETED_IN_PROTOTYPE,
      submissionNotes: 'Polytechnic Diploma courses renewal. All compliance documents clean.',
      submittedAt: new Date('2026-08-28T09:00:00Z'),
    },
  });

  // App 5: Himalayan - Draft
  const app5 = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2026-27/1-10519483',
      institutionId: instHimalayan.id,
      createdById: adminUser.id,
      category: ApplicationCategory.INSTITUTION_DETAIL_CHANGE,
      academicYear: '2026-2027',
      status: ApplicationStatus.DRAFT,
      submissionNotes: 'Application for shift of academic campus within municipal boundaries.',
    },
  });

  // App 6: Deccan - Submitted, Processing
  const app6 = await prisma.application.create({
    data: {
      referenceNumber: 'AICTE/2026-27/1-10648291',
      institutionId: instDeccan.id,
      createdById: adminUser.id,
      assignedOfficerId: officerPriya.id,
      category: ApplicationCategory.EOA,
      academicYear: '2026-2027',
      status: ApplicationStatus.PROCESSING,
      submissionNotes: 'EoA for MCA and Integrated IT programs.',
      submittedAt: new Date('2026-10-18T16:45:00Z'),
    },
  });

  // 6a. Create Approved Historical Documents for Previous EoA App (appApexPrev)
  const docApexPrevOrder = await prisma.document.create({
    data: {
      applicationId: appApexPrev.id,
      uploadedById: applicantApex.id,
      originalFilename: 'aicte_official_eoa_order_2025_26.pdf',
      storageKey: 'synthetic_apex_eoa_order_2025.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1350200,
      sha256: 'prev_eoa_order_hash_2025_apex_tech_9876543210abcdef0123456789abcdef',
      category: DocumentCategory.PREVIOUS_EOA,
      processingStatus: ProcessingStatus.SUCCEEDED,
      verificationStatus: VerificationStatus.VERIFIED,
      reviewStatus: ReviewStatus.ACCEPTED,
      pageCount: 3,
    },
  });

  await prisma.extractedField.createMany({
    data: [
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'institution_name',
        valueText: 'Apex Institute of Technology & Management',
        normalizedValue: 'APEX INSTITUTE OF TECHNOLOGY & MANAGEMENT',
        confidence: 0.98,
        pageNumber: 1,
        evidenceText: 'Name of the Institution: Apex Institute of Technology & Management',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'registered_address',
        valueText: 'Plot 42, Knowledge Park III, Pune, Maharashtra - 411057',
        normalizedValue: 'PLOT 42 KNOWLEDGE PARK III PUNE MH 411057',
        confidence: 0.96,
        pageNumber: 1,
        evidenceText: 'Address: Plot 42, Knowledge Park III, Pune, Maharashtra - 411057',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'total_intake',
        valueText: '360',
        normalizedValue: '360',
        confidence: 0.96,
        pageNumber: 2,
        evidenceText: 'Total Sanctioned Intake for 2025-26: 360 seats',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'programme_cse',
        valueText: 'B.Tech Computer Science & Engineering (Intake: 120)',
        normalizedValue: 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
        confidence: 0.97,
        pageNumber: 2,
        evidenceText: '1. Computer Science & Engineering | Approved Seats: 120',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'programme_ece',
        valueText: 'B.Tech Electronics & Communication Engineering (Intake: 60)',
        normalizedValue: 'B.TECH - ELECTRONICS & COMMUNICATION ENGINEERING',
        confidence: 0.95,
        pageNumber: 2,
        evidenceText: '2. Electronics & Communication Engineering | Approved Seats: 60',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'programme_me',
        valueText: 'B.Tech Mechanical Engineering (Intake: 60)',
        normalizedValue: 'B.TECH - MECHANICAL ENGINEERING',
        confidence: 0.94,
        pageNumber: 2,
        evidenceText: '3. Mechanical Engineering | Approved Seats: 60',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'programme_it',
        valueText: 'B.Tech Information Technology (Intake: 120)',
        normalizedValue: 'B.TECH - INFORMATION TECHNOLOGY',
        confidence: 0.96,
        pageNumber: 2,
        evidenceText: '4. Information Technology | Approved Seats: 120',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'land_area',
        valueText: '5.2 Acres',
        normalizedValue: '5.2 ACRES',
        confidence: 0.95,
        pageNumber: 1,
        evidenceText: 'Campus Land Area: 5.2 Acres (Contiguous)',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'faculty_count',
        valueText: '84',
        normalizedValue: '84',
        confidence: 0.92,
        pageNumber: 3,
        evidenceText: 'Total Approved Faculty: 84 (Cadre Ratio 1:2:6)',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'fire_noc_validity',
        valueText: '2025-06-30',
        normalizedValue: '2025-06-30',
        confidence: 0.93,
        pageNumber: 1,
        evidenceText: 'Fire Safety NOC Validity: 30-06-2025',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPrevOrder.id,
        fieldName: 'building_stability_no',
        valueText: 'PWD-STR-2022-819',
        normalizedValue: 'PWD-STR-2022-819',
        confidence: 0.95,
        pageNumber: 1,
        evidenceText: 'Building Stability Cert No: PWD-STR-2022-819',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
    ],
  });

  // 6b. Create Documents for App 1 (Apex Institute - Current Submission)
  const docApexAffidavit = await prisma.document.create({
    data: {
      applicationId: app1.id,
      uploadedById: applicantApex.id,
      originalFilename: 'apex_aicte_affidavit_signed_2026.pdf',
      storageKey: 'synthetic_apex_affidavit_2026.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1420580,
      sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      category: DocumentCategory.AFFIDAVIT,
      processingStatus: ProcessingStatus.SUCCEEDED,
      verificationStatus: VerificationStatus.VERIFIED,
      reviewStatus: ReviewStatus.ACCEPTED,
      pageCount: 4,
    },
  });

  const docApexFire = await prisma.document.create({
    data: {
      applicationId: app1.id,
      uploadedById: applicantApex.id,
      originalFilename: 'fire_safety_noc_pune_municipal.pdf',
      storageKey: 'synthetic_apex_fire_safety.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 852100,
      sha256: 'b2c3d4e5f6a7890123456789abcdef0123456789abcdef0123456789abcdef1',
      category: DocumentCategory.FIRE_SAFETY_CERTIFICATE,
      processingStatus: ProcessingStatus.SUCCEEDED,
      verificationStatus: VerificationStatus.EXPIRED,
      reviewStatus: ReviewStatus.FLAGGED,
      pageCount: 2,
    },
  });

  const docApexPreviousEoa = await prisma.document.create({
    data: {
      applicationId: app1.id,
      uploadedById: applicantApex.id,
      originalFilename: 'aicte_eoa_letter_2025_26.pdf',
      storageKey: 'synthetic_apex_eoa_2025.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1104920,
      sha256: 'c3d4e5f6a7b890123456789abcdef0123456789abcdef0123456789abcdef2',
      category: DocumentCategory.PREVIOUS_EOA,
      processingStatus: ProcessingStatus.SUCCEEDED,
      verificationStatus: VerificationStatus.VERIFIED,
      reviewStatus: ReviewStatus.ACCEPTED,
      pageCount: 3,
    },
  });

  // 7. Create Documents for App 2 (Saraswati - Duplicate File Demo)
  const docSaraswatiAffidavit = await prisma.document.create({
    data: {
      applicationId: app2.id,
      uploadedById: applicantSaraswati.id,
      originalFilename: 'saraswati_affidavit.pdf',
      storageKey: 'synthetic_saraswati_affidavit.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1204890,
      sha256: 'dup_hash_9876543210abcdef0123456789abcdef0123456789abcdef0123456789',
      category: DocumentCategory.AFFIDAVIT,
      processingStatus: ProcessingStatus.SUCCEEDED,
      verificationStatus: VerificationStatus.VERIFIED,
      reviewStatus: ReviewStatus.ACCEPTED,
      pageCount: 3,
    },
  });

  const docSaraswatiDupNoc = await prisma.document.create({
    data: {
      applicationId: app2.id,
      uploadedById: applicantSaraswati.id,
      originalFilename: 'land_use_noc_scanned.pdf',
      storageKey: 'synthetic_saraswati_land_noc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1204890,
      // EXACT SAME SHA256 as affidavit -> to trigger duplicate hash rule
      sha256: 'dup_hash_9876543210abcdef0123456789abcdef0123456789abcdef0123456789',
      category: DocumentCategory.NOC_LAND_USE,
      processingStatus: ProcessingStatus.REQUIRES_REVIEW,
      verificationStatus: VerificationStatus.PENDING,
      reviewStatus: ReviewStatus.FLAGGED,
      pageCount: 3,
    },
  });

  // 8. Create Extracted Fields for App 1 Documents
  await prisma.extractedField.createMany({
    data: [
      // Fire Safety Doc
      {
        documentId: docApexFire.id,
        fieldName: 'institution_name',
        valueText: 'Apex Institute of Technology & Management',
        normalizedValue: 'APEX INSTITUTE OF TECHNOLOGY & MANAGEMENT',
        confidence: 0.97,
        pageNumber: 1,
        evidenceText: 'Issued to: Apex Institute of Technology & Management, Pune',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexFire.id,
        fieldName: 'valid_until',
        valueText: '2026-03-31',
        normalizedValue: '2026-03-31',
        confidence: 0.94,
        pageNumber: 1,
        evidenceText: 'This certificate shall remain valid up to 31st March 2026.',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.FLAGGED,
      },
      {
        documentId: docApexFire.id,
        fieldName: 'fire_noc_validity',
        valueText: '2026-03-31',
        normalizedValue: '2026-03-31',
        confidence: 0.94,
        pageNumber: 1,
        evidenceText: 'This certificate shall remain valid up to 31st March 2026.',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.FLAGGED,
      },
      {
        documentId: docApexFire.id,
        fieldName: 'issuing_authority',
        valueText: 'Chief Fire Officer, Pune Municipal Corporation',
        normalizedValue: 'CHIEF FIRE OFFICER PUNE MUNICIPAL CORPORATION',
        confidence: 0.92,
        pageNumber: 2,
        evidenceText: 'Seal & Signature of Chief Fire Officer, Fire Brigade HQ',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      // Affidavit
      {
        documentId: docApexAffidavit.id,
        fieldName: 'institution_name',
        valueText: 'Apex Institute of Technology & Management',
        normalizedValue: 'APEX INSTITUTE OF TECHNOLOGY & MANAGEMENT',
        confidence: 0.98,
        pageNumber: 1,
        evidenceText: 'Chairman, Apex Institute of Technology & Management',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexAffidavit.id,
        fieldName: 'affidavit_stamp_no',
        valueText: 'MH-STAMP-2026-8819',
        normalizedValue: 'MH-STAMP-2026-8819',
        confidence: 0.96,
        pageNumber: 1,
        evidenceText: 'Non-Judicial Stamp Paper MH-STAMP-2026-8819',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexAffidavit.id,
        fieldName: 'deponent_name',
        valueText: 'Dr. Arvind Patel',
        normalizedValue: 'DR ARVIND PATEL',
        confidence: 0.95,
        pageNumber: 1,
        evidenceText: 'Deponent: Dr. Arvind Patel, Chairman Apex Trust',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      // Previous EoA submission copy (with new proposed programmes & variations)
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'institution_name',
        valueText: 'Apex Institute of Technology & Management',
        normalizedValue: 'APEX INSTITUTE OF TECHNOLOGY & MANAGEMENT',
        confidence: 0.98,
        pageNumber: 1,
        evidenceText: 'Apex Institute of Technology & Management',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'registered_address',
        valueText: 'Plot 42, Knowledge Park III, Pune, Maharashtra - 411057',
        normalizedValue: 'PLOT 42 KNOWLEDGE PARK III PUNE MH 411057',
        confidence: 0.95,
        pageNumber: 1,
        evidenceText: 'Plot 42, Knowledge Park III, Pune, Maharashtra - 411057',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'total_intake',
        valueText: '420',
        normalizedValue: '420',
        confidence: 0.96,
        pageNumber: 2,
        evidenceText: 'Total Proposed Sanctioned Intake: 420 seats',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'programme_cse',
        valueText: 'B.Tech Computer Science & Engineering (Intake: 180)',
        normalizedValue: 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
        confidence: 0.96,
        pageNumber: 2,
        evidenceText: '1. Computer Science & Engineering | Intake: 180 (Expanded from 120)',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'programme_aids',
        valueText: 'B.Tech Artificial Intelligence & Data Science (Intake: 60)',
        normalizedValue: 'B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
        confidence: 0.95,
        pageNumber: 2,
        evidenceText: '2. Artificial Intelligence & Data Science | Intake: 60 (New Course)',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'programme_ece',
        valueText: 'B.Tech Electronics & Communication Engineering (Intake: 60)',
        normalizedValue: 'B.TECH - ELECTRONICS & COMMUNICATION ENGINEERING',
        confidence: 0.94,
        pageNumber: 2,
        evidenceText: '3. Electronics & Communication Engineering | Intake: 60',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'programme_it',
        valueText: 'B.Tech Information Technology (Intake: 120)',
        normalizedValue: 'B.TECH - INFORMATION TECHNOLOGY',
        confidence: 0.95,
        pageNumber: 2,
        evidenceText: '4. Information Technology | Intake: 120',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'land_area',
        valueText: '5.2 Acres',
        normalizedValue: '5.2 ACRES',
        confidence: 0.97,
        pageNumber: 1,
        evidenceText: 'Land Area: 5.2 Acres',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'faculty_count',
        valueText: '92',
        normalizedValue: '92',
        confidence: 0.94,
        pageNumber: 3,
        evidenceText: 'Current Faculty Muster: 92 teaching members',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
      {
        documentId: docApexPreviousEoa.id,
        fieldName: 'building_stability_no',
        valueText: 'PWD-STR-2025-942',
        normalizedValue: 'PWD-STR-2025-942',
        confidence: 0.95,
        pageNumber: 1,
        evidenceText: 'Building Stability Cert No: PWD-STR-2025-942',
        source: FieldSource.AI,
        reviewStatus: ReviewStatus.ACCEPTED,
      },
    ],
  });

  // 9. Create Validation Run and Findings for App 1
  const valRunApp1 = await prisma.validationRun.create({
    data: {
      applicationId: app1.id,
      triggeredById: officerPriya.id,
      runType: RunType.AUTOMATIC,
      status: 'COMPLETED',
      ruleSetVersion: '1.0.0-demo',
      summaryJson: {
        totalRulesEvaluated: 6,
        passedCount: 4,
        findingsCount: 2,
      },
    },
  });

  await prisma.finding.create({
    data: {
      applicationId: app1.id,
      documentId: docApexFire.id,
      validationRunId: valRunApp1.id,
      findingCode: 'FINDING_DOC_EXPIRED',
      title: 'Fire Safety Certificate Validity Lapsed',
      description: 'The uploaded Fire Safety NOC expired on 2026-03-31, prior to scrutiny date.',
      severity: Severity.HIGH,
      status: FindingStatus.OPEN,
      evidenceJson: {
        pageNumber: 1,
        excerpt: 'This certificate shall remain valid up to 31st March 2026.',
        fieldName: 'valid_until',
        extractedValue: '2026-03-31',
      },
      confidence: 0.94,
      recommendedAction: 'Request institution to upload renewed NOC from Municipal Fire Department.',
    },
  });

  await prisma.finding.create({
    data: {
      applicationId: app1.id,
      validationRunId: valRunApp1.id,
      findingCode: 'FINDING_MISSING_INFRA_PLAN',
      title: 'Approved Master Building Plan Missing',
      description: 'Regulatory check requires certified architectural floor plans for laboratory spaces.',
      severity: Severity.MEDIUM,
      status: FindingStatus.UNDER_REVIEW,
      evidenceJson: {
        missingCategory: 'INFRASTRUCTURE_PLAN',
      },
      recommendedAction: 'Upload building blueprint certified by registered structural architect.',
    },
  });

  // 10. Create Finding for App 2 (Duplicate Document Detection)
  const valRunApp2 = await prisma.validationRun.create({
    data: {
      applicationId: app2.id,
      triggeredById: officerVikram.id,
      runType: RunType.AUTOMATIC,
      status: 'COMPLETED',
      ruleSetVersion: '1.0.0-demo',
      summaryJson: {
        totalRulesEvaluated: 6,
        passedCount: 4,
        findingsCount: 2,
      },
    },
  });

  await prisma.finding.create({
    data: {
      applicationId: app2.id,
      documentId: docSaraswatiDupNoc.id,
      validationRunId: valRunApp2.id,
      findingCode: 'FINDING_EXACT_DUPLICATE_FILE',
      title: 'Exact Duplicate File Uploaded Across Categories',
      description: 'Document uploaded under "NOC Land Use" has identical cryptographic content hash as "Affidavit".',
      severity: Severity.HIGH,
      status: FindingStatus.OPEN,
      evidenceJson: {
        sha256: 'dup_hash_9876543210abcdef0123456789abcdef0123456789abcdef0123456789',
        matchingDocument: 'saraswati_affidavit.pdf',
      },
      confidence: 1.0,
      recommendedAction: 'Reject mismatched file and require applicant to upload actual Land Use NOC.',
    },
  });

  // 11. Create Source Verifications (Simulated Demo Records)
  await prisma.sourceVerification.create({
    data: {
      applicationId: app1.id,
      documentId: docApexPreviousEoa.id,
      issuerName: 'AICTE Approval Bureau Central Records',
      verificationMethod: 'DIGITAL_PORTAL',
      referenceNumber: 'AICTE/WRO/1-2025/EOA',
      status: VerificationStatus.SIMULATED,
      submittedDataJson: {
        institutionCode: 'AICTE-DEMO-101',
        academicYear: '2025-2026',
        approvedIntake: 360,
      },
      returnedDataJson: {
        recordFound: true,
        matchingStatus: 'MATCHED_SIMULATED',
        portalTimestamp: '2026-09-15T11:00:00Z',
      },
      resultSummary: 'Simulated check: Previous approval record matches national AICTE database registry.',
      providerMode: ProviderMode.MOCK,
      createdById: officerPriya.id,
    },
  });

  // 12. Create Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        actorId: applicantApex.id,
        action: 'APPLICATION_CREATED',
        entityType: 'Application',
        entityId: app1.id,
        metadataJson: { referenceNumber: app1.referenceNumber, category: app1.category },
      },
      {
        actorId: applicantApex.id,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: docApexFire.id,
        metadataJson: { filename: docApexFire.originalFilename, category: docApexFire.category },
      },
      {
        actorId: applicantApex.id,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'Application',
        entityId: app1.id,
        metadataJson: { submittedAt: app1.submittedAt },
      },
      {
        actorId: officerPriya.id,
        action: 'OFFICER_ASSIGNED',
        entityType: 'Application',
        entityId: app1.id,
        metadataJson: { assignedOfficer: 'Smt. Priya Nair' },
      },
      {
        actorId: officerPriya.id,
        action: 'VALIDATION_RUN_EXECUTED',
        entityType: 'ValidationRun',
        entityId: valRunApp1.id,
        metadataJson: { findingsGenerated: 2 },
      },
    ],
  });

  // 13. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: officerPriya.id,
        type: 'HIGH_PRIORITY_FINDING',
        title: 'High Severity Finding on Application AICTE/2026-27/1-10142981',
        message: 'Fire Safety NOC has expired validity. Review action required.',
        entityType: 'Application',
        entityId: app1.id,
      },
      {
        userId: applicantSaraswati.id,
        type: 'CORRECTION_REQUESTED',
        title: 'Action Required: Resubmit Supporting Documents',
        message: 'Duplicate document detected on your application AICTE/2026-27/1-10294821.',
        entityType: 'Application',
        entityId: app2.id,
      },
    ],
  });

  // 14. Execute Previous EoA Comparison Engine for App 1 (Apex)
  console.log('Computing Previous EoA comparison baseline for Apex Institute...');
  await comparePreviousEoa(app1.id, officerPriya.id);

  // 15. Create Initial Demonstration Clarification Request
  const itemFire = await prisma.verificationItem.findFirst({
    where: { applicationId: app1.id, fieldName: 'fire_noc_validity' },
  });

  await prisma.clarificationRequest.create({
    data: {
      applicationId: app1.id,
      verificationItemId: itemFire?.id || null,
      requestedById: officerPriya.id,
      subject: 'Clarification regarding Fire Safety NOC Renewal Receipt',
      queryText: 'Extracted validity date for Municipal Fire Safety Certificate elapsed on 31-03-2026. Please upload the valid renewed certificate or municipal renewal inspection acknowledgment memo.',
      deadline: new Date('2026-11-15T23:59:59Z'),
      status: 'OPEN',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Demo accounts seeded:');
  console.log('  Admin: admin@aicte.demo.gov.in / demo12345');
  console.log('  Scrutiny Officer: officer1@aicte.demo.gov.in / demo12345');
  console.log('  Scrutiny Officer: officer2@aicte.demo.gov.in / demo12345');
  console.log('  Senior Reviewer: senior@aicte.demo.gov.in / demo12345');
  console.log('  Applicant: applicant.apex@demo.edu.in / demo12345');
  console.log('  Applicant: applicant.saraswati@demo.edu.in / demo12345');
  console.log('  Viewer: viewer@aicte.demo.gov.in / demo12345');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
