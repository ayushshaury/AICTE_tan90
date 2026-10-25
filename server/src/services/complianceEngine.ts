import { prisma } from '../utils/db.js';
import { Severity, FindingStatus, RunType, DocumentCategory } from '@prisma/client';
import { logAuditEvent } from '../utils/audit.js';

export interface ValidationSummary {
  validationRunId: string;
  totalRulesEvaluated: number;
  findingsCount: number;
  newFindings: any[];
}

export async function runApplicationValidation(
  applicationId: string,
  triggeredById?: string,
  runType: RunType = RunType.MANUAL
): Promise<ValidationSummary> {
  // 1. Fetch application with institution and all active documents + extracted fields
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      institution: true,
      documents: {
        where: { deletedAt: null },
        include: {
          extractedFields: true,
        },
      },
    },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // 2. Fetch active validation rules
  const activeRules = await prisma.validationRule.findMany({
    where: { enabled: true },
  });

  // 3. Create ValidationRun record to snapshot this execution
  const validationRun = await prisma.validationRun.create({
    data: {
      applicationId: application.id,
      triggeredById: triggeredById || null,
      runType,
      status: 'RUNNING',
      ruleSetVersion: '1.0.0-demo',
      summaryJson: {},
    },
  });

  const generatedFindings: any[] = [];

  // RULE 1: Mandatory AICTE Affidavit
  const hasAffidavit = application.documents.some(doc => doc.category === DocumentCategory.AFFIDAVIT);
  if (!hasAffidavit) {
    const rule = activeRules.find(r => r.ruleCode === 'RULE_REQ_AFFIDAVIT');
    generatedFindings.push({
      applicationId: application.id,
      validationRunId: validationRun.id,
      ruleId: rule?.id || null,
      findingCode: 'FINDING_MISSING_AFFIDAVIT',
      title: 'Mandatory AICTE Regulatory Affidavit Missing',
      description: 'The application does not contain a submitted regulatory affidavit/undertaking on stamp paper.',
      severity: Severity.CRITICAL,
      status: FindingStatus.OPEN,
      evidenceJson: { requiredCategory: 'AFFIDAVIT' },
      recommendedAction: 'Upload the legally sworn affidavit in standard format signed by the Chairman/Secretary.',
    });
  }

  // RULE 2: Previous EoA Letter (Mandatory for EOA & INTAKE_CHANGE)
  if (application.category === 'EOA' || application.category === 'INTAKE_CHANGE') {
    const hasPrevEoa = application.documents.some(doc => doc.category === DocumentCategory.PREVIOUS_EOA);
    if (!hasPrevEoa) {
      const rule = activeRules.find(r => r.ruleCode === 'RULE_REQ_PREV_EOA');
      generatedFindings.push({
        applicationId: application.id,
        validationRunId: validationRun.id,
        ruleId: rule?.id || null,
        findingCode: 'FINDING_MISSING_PREV_EOA',
        title: 'Previous Academic Session EoA Letter Missing',
        description: 'Applications for Extension of Approval or Intake Change must provide the preceding approval order.',
        severity: Severity.HIGH,
        status: FindingStatus.OPEN,
        evidenceJson: { requiredCategory: 'PREVIOUS_EOA' },
        recommendedAction: 'Upload official AICTE approval letter issued for the preceding academic cycle.',
      });
    }
  }

  // RULE 3: Exact Duplicate File Hash Detection (SHA-256)
  const hashSeen = new Map<string, string>(); // sha256 -> doc originalFilename
  for (const doc of application.documents) {
    if (hashSeen.has(doc.sha256)) {
      const originalFile = hashSeen.get(doc.sha256);
      const rule = activeRules.find(r => r.ruleCode === 'RULE_DUPLICATE_FILE_HASH');
      generatedFindings.push({
        applicationId: application.id,
        documentId: doc.id,
        validationRunId: validationRun.id,
        ruleId: rule?.id || null,
        findingCode: 'FINDING_DUPLICATE_FILE_HASH',
        title: 'Identical File Uploaded Multiple Times',
        description: `File "${doc.originalFilename}" has identical SHA-256 hash as "${originalFile}".`,
        severity: Severity.HIGH,
        status: FindingStatus.OPEN,
        evidenceJson: {
          sha256: doc.sha256,
          originalDoc: originalFile,
          duplicateDoc: doc.originalFilename,
        },
        confidence: 1.0,
        recommendedAction: 'Verify if the duplicate upload was inadvertent and replace with distinct evidence.',
      });
    } else {
      hashSeen.set(doc.sha256, doc.originalFilename);
    }
  }

  // RULE 4: Document Expiry Check (Extracted valid_until vs current date)
  const today = new Date();
  for (const doc of application.documents) {
    const validUntilField = doc.extractedFields.find(f => f.fieldName === 'valid_until');
    if (validUntilField && validUntilField.valueText) {
      const expiryDate = new Date(validUntilField.valueText);
      if (!isNaN(expiryDate.getTime()) && expiryDate < today) {
        const rule = activeRules.find(r => r.ruleCode === 'RULE_DOC_EXPIRY_CHECK');
        generatedFindings.push({
          applicationId: application.id,
          documentId: doc.id,
          validationRunId: validationRun.id,
          ruleId: rule?.id || null,
          findingCode: 'FINDING_DOC_EXPIRED',
          title: `Document Validity Expired (${doc.category.replace(/_/g, ' ')})`,
          description: `Extracted expiry date (${validUntilField.valueText}) indicates validity has elapsed.`,
          severity: Severity.HIGH,
          status: FindingStatus.OPEN,
          evidenceJson: {
            pageNumber: validUntilField.pageNumber || 1,
            excerpt: validUntilField.evidenceText,
            extractedExpiry: validUntilField.valueText,
          },
          confidence: validUntilField.confidence || 0.9,
          recommendedAction: 'Upload a renewed certificate issued by the competent municipal or technical authority.',
        });
      }
    }
  }

  // RULE 5: Institution Legal Name Consistency
  for (const doc of application.documents) {
    const instNameField = doc.extractedFields.find(f => f.fieldName === 'institution_name');
    if (instNameField && instNameField.valueText) {
      const cleanAppInst = application.institution.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanDocInst = instNameField.valueText.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!cleanDocInst.includes(cleanAppInst) && !cleanAppInst.includes(cleanDocInst)) {
        const rule = activeRules.find(r => r.ruleCode === 'RULE_NAME_CONSISTENCY');
        generatedFindings.push({
          applicationId: application.id,
          documentId: doc.id,
          validationRunId: validationRun.id,
          ruleId: rule?.id || null,
          findingCode: 'FINDING_INSTITUTION_NAME_MISMATCH',
          title: 'Institution Name Discrepancy on Document',
          description: `Name extracted on document ("${instNameField.valueText}") differs from registered institution ("${application.institution.name}").`,
          severity: Severity.MEDIUM,
          status: FindingStatus.OPEN,
          evidenceJson: {
            pageNumber: instNameField.pageNumber || 1,
            excerpt: instNameField.evidenceText,
            extractedName: instNameField.valueText,
            registeredName: application.institution.name,
          },
          confidence: instNameField.confidence || 0.88,
          recommendedAction: 'Provide legal society resolution or university gazette notification reconciling name change.',
        });
      }
    }
  }

  // Persist created findings
  const savedFindings = [];
  for (const item of generatedFindings) {
    const saved = await prisma.finding.create({
      data: item,
    });
    savedFindings.push(saved);
  }

  // Update validation run summary
  const summaryJson = {
    totalRulesEvaluated: activeRules.length,
    findingsCount: savedFindings.length,
    completedAt: new Date(),
  };

  await prisma.validationRun.update({
    where: { id: validationRun.id },
    data: {
      status: 'COMPLETED',
      finishedAt: new Date(),
      summaryJson,
    },
  });

  // Log audit event
  await logAuditEvent({
    actorId: triggeredById,
    action: 'VALIDATION_RUN_EXECUTED',
    entityType: 'ValidationRun',
    entityId: validationRun.id,
    metadata: {
      applicationId: application.id,
      runType,
      findingsCount: savedFindings.length,
    },
  });

  return {
    validationRunId: validationRun.id,
    totalRulesEvaluated: activeRules.length,
    findingsCount: savedFindings.length,
    newFindings: savedFindings,
  };
}
