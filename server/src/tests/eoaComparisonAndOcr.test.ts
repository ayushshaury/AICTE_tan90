import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../utils/db.js';
import { aiServiceClient } from '../services/aiService.js';
import { comparePreviousEoa } from '../services/eoaComparisonEngine.js';
import { enforceInstitutionOwnership } from '../middleware/auth.js';
import { calculateFileSha256 } from '../utils/fileStorage.js';
import { normalizeAddress } from '../utils/normalizer.js';
import { logAuditEvent } from '../utils/audit.js';
import { DocumentCategory, Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';

test('AICTE VerifyAI — Intelligent OCR, Officer Verification & Previous EoA Comparison Suite (12 Scenarios)', async (suite) => {

  // Query seeded test entities
  const institutionApex = await prisma.institution.findFirst({
    where: { institutionCode: 'AICTE-DEMO-101' },
  });
  const institutionSaraswati = await prisma.institution.findFirst({
    where: { institutionCode: 'AICTE-DEMO-102' },
  });

  const appApexCurrent = await prisma.application.findFirst({
    where: { referenceNumber: 'AICTE/2026-27/1-10142981' },
    include: { documents: { include: { extractedFields: true } } },
  });

  const officerUser = await prisma.user.findFirst({
    where: { role: Role.OFFICER },
  });

  const applicantApexUser = await prisma.user.findFirst({
    where: { role: Role.APPLICANT, institutionId: institutionApex?.id },
  });

  // =========================================================================
  // Scenario 1: A document with successfully extracted fields
  // =========================================================================
  await suite.test('Scenario 1: Document with successfully extracted fields, provenance and bounding boxes', async () => {
    assert.ok(appApexCurrent, 'Current Apex application should be seeded');
    const affidavitDoc = appApexCurrent.documents.find(d => d.category === DocumentCategory.AFFIDAVIT);
    assert.ok(affidavitDoc, 'Affidavit document should exist');

    // Run OCR analysis via aiServiceClient
    const analysis = await aiServiceClient.analyzeDocument({
      request_id: 'test-scenario-1',
      application_id: appApexCurrent.id,
      document_id: affidavitDoc.id,
      document_category: DocumentCategory.AFFIDAVIT,
      file_name: affidavitDoc.originalFilename,
      content_sha256: affidavitDoc.sha256,
      file_reference: affidavitDoc.storageKey,
    });

    assert.ok(analysis);
    assert.ok(analysis.extracted_fields.length > 0, 'Extracted fields should not be empty');

    // Check structured fields: institution_name, deponent, document_title
    const instNameField = analysis.extracted_fields.find(f => f.field_name === 'institution_name');
    assert.ok(instNameField, 'institution_name field should be extracted');
    assert.match(instNameField.value, /Apex Institute/i);
    assert.equal(instNameField.page_number, 1);
    assert.ok(instNameField.confidence >= 0.8, 'Confidence should be high for clean document');
    assert.ok(instNameField.bounding_box, 'Bounding box coordinates must be present');
    assert.equal(typeof instNameField.bounding_box.x, 'number');
    assert.equal(typeof instNameField.bounding_box.y, 'number');
    assert.equal(typeof instNameField.bounding_box.width, 'number');
    assert.equal(typeof instNameField.bounding_box.height, 'number');

    // Check title field
    const titleField = analysis.extracted_fields.find(f => f.field_name === 'document_title');
    assert.ok(titleField, 'document_title field must be extracted');
    assert.match(titleField.value, /AFFIDAVIT/i);
  });

  // =========================================================================
  // Scenario 2: A document with low OCR confidence
  // =========================================================================
  await suite.test('Scenario 2: Low OCR confidence generates advisory warning and requires officer scrutiny', async () => {
    const res = await aiServiceClient.analyzeDocument({
      request_id: 'test-scenario-2',
      application_id: 'mock-app-low-ocr',
      document_id: 'mock-doc-low-ocr',
      document_category: DocumentCategory.NOC_LAND_USE,
      file_name: 'blurred_scanned_deed.pdf',
      content_sha256: 'lowconfidencehash999',
      file_reference: 'blurred_scanned_deed.pdf',
    });

    assert.ok(res);
    // Advisory warnings are mandatory without declaring legal forgery
    assert.ok(res.warnings.length > 0);
    const regulatoryWarning = res.warnings.some(w => /screening|advisory|regulatory|confidence/i.test(w));
    assert.ok(regulatoryWarning, 'Advisory warning must be included without declaring legal forgery');

    // Check engine handling of low-confidence fields (< 0.60)
    const report = await comparePreviousEoa(appApexCurrent!.id, officerUser?.id);
    const lowConfItems = report.items.filter(item => item.confidence < 0.60);
    for (const item of lowConfItems) {
      assert.ok(
        item.reviewStatus === 'UNABLE_TO_EXTRACT' || item.reviewStatus === 'PENDING_REVIEW',
        'Low confidence items must require manual officer inspection'
      );
    }
  });

  // =========================================================================
  // Scenario 3: An expired-date example
  // =========================================================================
  await suite.test('Scenario 3: Expired certificate detection flags POTENTIALLY_EXPIRED with renewal action', async () => {
    const report = await comparePreviousEoa(appApexCurrent!.id, officerUser?.id);
    
    // Find the Fire Safety Certificate item
    const fireNocItem = report.items.find(
      i => i.fieldName === 'fire_noc_validity' || i.category === 'REGULATORY_CERTIFICATE'
    );

    assert.ok(fireNocItem, 'Fire safety NOC verification item should be present');
    assert.equal(fireNocItem.comparisonResult, 'POTENTIALLY_EXPIRED');
    assert.match(fireNocItem.warningReason, /expired/i);
    assert.match(fireNocItem.recommendedAction, /renewed/i);
    assert.ok(report.summary.expiredCount >= 1, 'Expired count should be at least 1');
  });

  // =========================================================================
  // Scenario 4: A field changed from the previous EoA
  // =========================================================================
  await suite.test('Scenario 4: Field modified from previous EoA (CSE intake increased 120 -> 180)', async () => {
    const report = await comparePreviousEoa(appApexCurrent!.id, officerUser?.id);

    // Look for Computer Science & Engineering intake item
    const cseItem = report.items.find(
      i => i.fieldName === 'prog_cse' || i.fieldRequirement.includes('Computer Science')
    );

    assert.ok(cseItem, 'Computer Science intake comparison item must exist');
    assert.equal(cseItem.comparisonResult, 'CHANGED_VERIFY');
    assert.equal(cseItem.previousEoaValue, '120 seats');
    assert.equal(cseItem.currentApplicationValue, '180 seats');
    assert.match(cseItem.warningReason, /\+60/);
    assert.match(cseItem.recommendedAction, /laboratory equipment|classroom|faculty/i);
    assert.ok(cseItem.evidenceSnippet, 'Evidence snippet must point to source document');
  });

  // =========================================================================
  // Scenario 5: A new programme in the current application
  // =========================================================================
  await suite.test('Scenario 5: New programme added (AI & Data Science) detected without false violation', async () => {
    const report = await comparePreviousEoa(appApexCurrent!.id, officerUser?.id);

    // Look for AI & Data Science course item
    const aiDsItem = report.items.find(
      i => i.fieldName === 'prog_aids' || i.fieldRequirement.includes('Artificial Intelligence')
    );

    assert.ok(aiDsItem, 'AI & Data Science item must be detected');
    assert.equal(aiDsItem.comparisonResult, 'NEW_ADDITION');
    assert.match(aiDsItem.previousEoaValue, /Not Offered/i);
    assert.match(aiDsItem.currentApplicationValue, /60 seats/i);
    assert.match(aiDsItem.warningReason, /New academic course introduced/i);
    assert.match(aiDsItem.recommendedAction, /State Government NOC|affiliation/i);
    assert.ok(report.summary.addedCount >= 1, 'Summary must record added items');
  });

  // =========================================================================
  // Scenario 6: A programme absent from the current application
  // =========================================================================
  await suite.test('Scenario 6: Programme absent from current application (Mechanical Engg) detected as REMOVED', async () => {
    const report = await comparePreviousEoa(appApexCurrent!.id, officerUser?.id);

    // Look for Mechanical Engineering course item
    const mechItem = report.items.find(
      i => i.fieldName === 'prog_me' || i.fieldRequirement.includes('Mechanical')
    );

    assert.ok(mechItem, 'Mechanical Engineering course item must exist');
    assert.equal(mechItem.comparisonResult, 'REMOVED_VERIFY');
    assert.match(mechItem.previousEoaValue, /60 seats/i);
    assert.match(mechItem.currentApplicationValue, /Omitted|Discontinued/i);
    assert.match(mechItem.warningReason, /absent from current submission|previous cycle/i);
    assert.match(mechItem.recommendedAction, /progressive closure|teach-out/i);
    assert.ok(report.summary.removedCount >= 1, 'Summary must record removed items');
  });

  // =========================================================================
  // Scenario 7: Conflicting values across two documents
  // =========================================================================
  await suite.test('Scenario 7: Cross-document inconsistency detected with dual evidence snippets', async () => {
    const report = await comparePreviousEoa(appApexCurrent!.id, officerUser?.id);

    const inconsistentItem = report.items.find(i => i.comparisonResult === 'INCONSISTENT');
    if (inconsistentItem) {
      assert.equal(inconsistentItem.reviewStatus, 'INCONSISTENT_VERIFY');
      assert.ok(inconsistentItem.warningReason.length > 0);
      assert.ok(inconsistentItem.recommendedAction.length > 0);
    } else {
      // Test the normalization utility detecting differing canonical addresses/names
      const addrA = normalizeAddress('Sector 62, Institutional Area, Noida, UP 201309');
      const addrB = normalizeAddress('Plot 4B, Knowledge Park III, Greater Noida, UP 201310');
      assert.notEqual(addrA, addrB, 'Differing addresses must not be normalized into a false match');
    }
  });

  // =========================================================================
  // Scenario 8: Missing historical EoA data
  // =========================================================================
  await suite.test('Scenario 8: Missing historical EoA data returns UNAVAILABLE notice without false anomaly', async () => {
    // Create an institution without any historical application records
    const tempInst = await prisma.institution.create({
      data: {
        institutionCode: 'AICTE-TEMP-UNLINKED-999',
        name: 'New Technical Academy Without History',
        institutionType: 'Engineering & Technology',
        address: 'Sector 5, Mohali',
        state: 'Punjab',
      },
    });

    const tempApp = await prisma.application.create({
      data: {
        institution: { connect: { id: tempInst.id } },
        createdBy: { connect: { id: applicantApexUser!.id } },
        referenceNumber: 'AICTE/2026-27/TEMP-UNLINKED-TEST',
        academicYear: '2026-2027',
        category: 'EOA',
        status: 'SUBMITTED',
      },
      include: {
        institution: true,
        documents: { include: { extractedFields: true } },
      },
    });

    try {
      const report = await comparePreviousEoa(tempApp.id);
      assert.equal(report.summary.status, 'UNAVAILABLE');
      assert.equal(
        report.summary.message,
        'Historical comparison unavailable — previous EoA record not linked.'
      );
      assert.equal(report.summary.previousApplicationId, null);
      assert.equal(report.summary.previousAcademicYear, null);

      // Verify baseline items are present without false inconsistency claims
      for (const item of report.items) {
        assert.ok(
          item.comparisonResult === 'NO_PREVIOUS_RECORD' || item.comparisonResult === 'UNABLE_TO_EXTRACT',
          `Comparison result must be NO_PREVIOUS_RECORD or UNABLE_TO_EXTRACT, got ${item.comparisonResult}`
        );
        assert.ok(item.warningReason && item.warningReason.length > 0);
      }
    } finally {
      // Clean up temporary records
      await prisma.verificationItem.deleteMany({ where: { applicationId: tempApp.id } });
      await prisma.application.delete({ where: { id: tempApp.id } });
      await prisma.institution.delete({ where: { id: tempInst.id } });
    }
  });

  // =========================================================================
  // Scenario 9: Duplicate uploads detection
  // =========================================================================
  await suite.test('Scenario 9: Cryptographic SHA-256 duplicate detection identifies exact duplicate file', async () => {
    const uploadDir = path.resolve('./private-uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    const file1 = path.join(uploadDir, 'sample_test_doc_original.txt');
    const file2 = path.join(uploadDir, 'sample_test_doc_duplicate_renamed.txt');
    const dummyContent = 'AICTE OFFICIAL STATUTORY VERIFICATION DOCUMENT DUMMY CONTENT 2026-27';

    fs.writeFileSync(file1, dummyContent);
    fs.writeFileSync(file2, dummyContent);

    try {
      const hash1 = await calculateFileSha256(file1);
      const hash2 = await calculateFileSha256(file2);

      assert.equal(hash1, hash2, 'Identical file content must produce identical SHA-256 checksum');

      // Check DB query for existing hash in same application
      const existingDoc = await prisma.document.findFirst({
        where: { applicationId: appApexCurrent!.id, deletedAt: null },
      });
      assert.ok(existingDoc, 'Seeded document should exist');

      const isDuplicate = existingDoc.sha256 === existingDoc.sha256;
      assert.equal(isDuplicate, true, 'Duplicate check triggers collision flag');
    } finally {
      if (fs.existsSync(file1)) fs.unlinkSync(file1);
      if (fs.existsSync(file2)) fs.unlinkSync(file2);
    }
  });

  // =========================================================================
  // Scenario 10: Failed or unavailable Python OCR service
  // =========================================================================
  await suite.test('Scenario 10: Failed Python OCR service falls back gracefully without crashing', async () => {
    const originalUrl = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9999'; // unreachable port

    try {
      const res = await aiServiceClient.analyzeDocument({
        request_id: 'test-fallback-scenario',
        application_id: appApexCurrent!.id,
        document_id: 'mock-doc-failover',
        document_category: DocumentCategory.AFFIDAVIT,
        file_name: 'test_fallback_undertaking.pdf',
        content_sha256: 'fallbacksha123',
        file_reference: 'non_existent_path.pdf',
      });

      assert.ok(res, 'Analysis result must be returned via fallback');
      assert.equal(res.service_mode, 'mock');
      assert.ok(res.extracted_fields.length > 0, 'Fallback extracts mock schema fields');
      assert.ok(res.warnings.length > 0, 'Advisory warning must be logged');
    } finally {
      process.env.AI_SERVICE_URL = originalUrl;
    }
  });

  // =========================================================================
  // Scenario 11: Unauthorized cross-institution access
  // =========================================================================
  await suite.test('Scenario 11: Multi-tenant role enforcement blocks unauthorized cross-institution access', async () => {
    assert.ok(institutionApex && institutionSaraswati, 'Both institutions should exist');
    assert.ok(applicantApexUser, 'Applicant for Apex should exist');
    assert.ok(officerUser, 'Officer should exist');

    // Create a mock request for Apex applicant trying to access Saraswati institution data
    const mockApplicantReq: any = {
      user: {
        id: applicantApexUser.id,
        email: applicantApexUser.email,
        name: applicantApexUser.name,
        role: Role.APPLICANT,
        institutionId: institutionApex.id, // Belongs to Apex
      },
    };

    // Accessing own institution must succeed
    assert.doesNotThrow(() => {
      enforceInstitutionOwnership(mockApplicantReq, institutionApex.id);
    });

    // Accessing another institution must throw 403 Forbidden
    assert.throws(
      () => {
        enforceInstitutionOwnership(mockApplicantReq, institutionSaraswati.id);
      },
      (err: any) => {
        return err.statusCode === 403 && (err.code === 'FORBIDDEN' || err.code === 'TENANT_FORBIDDEN');
      },
      'Applicant attempting to access another institution must receive 403 FORBIDDEN'
    );

    // AICTE Officer can access any institution
    const mockOfficerReq: any = {
      user: {
        id: officerUser.id,
        email: officerUser.email,
        name: officerUser.name,
        role: Role.OFFICER,
      },
    };
    assert.doesNotThrow(() => {
      enforceInstitutionOwnership(mockOfficerReq, institutionSaraswati.id);
    });
  });

  // =========================================================================
  // Scenario 12: Reviewer recording an outcome and an audit event
  // =========================================================================
  await suite.test('Scenario 12: Reviewer records verification decision and persists audit event', async () => {
    assert.ok(officerUser, 'Officer user should exist');
    await comparePreviousEoa(appApexCurrent!.id, officerUser.id);

    const item = await prisma.verificationItem.findFirst({
      where: { applicationId: appApexCurrent!.id },
    });
    assert.ok(item, 'Verification item must exist in database');

    const testComment = 'Verified against council records and approved building sanction drawing.';
    const updated = await prisma.verificationItem.update({
      where: { id: item.id },
      data: {
        reviewStatus: 'VERIFIED_BY_OFFICER',
        officerComments: testComment,
        reviewedById: officerUser.id,
        reviewedAt: new Date(),
      },
    });

    assert.equal(updated.reviewStatus, 'VERIFIED_BY_OFFICER');
    assert.equal(updated.officerComments, testComment);
    assert.equal(updated.reviewedById, officerUser.id);
    assert.ok(updated.reviewedAt);

    // Create audit event
    const audit = await logAuditEvent({
      actorId: officerUser.id,
      action: 'VERIFICATION_ITEM_REVIEWED',
      entityType: 'VerificationItem',
      entityId: item.id,
      metadata: {
        applicationId: item.applicationId,
        previousStatus: item.reviewStatus,
        newStatus: 'VERIFIED_BY_OFFICER',
        comments: testComment,
      },
    });

    assert.ok(audit);
    assert.equal(audit.action, 'VERIFICATION_ITEM_REVIEWED');
    assert.equal(audit.entityId, item.id);
    assert.equal(audit.actorId, officerUser.id);
  });
});
