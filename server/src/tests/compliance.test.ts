import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFileSha256 } from '../utils/fileStorage.js';
import { aiServiceClient } from '../services/aiService.js';
import { DocumentCategory } from '@prisma/client';
import fs from 'fs';
import path from 'path';

test('Compliance & AI Adapter Suite', async (t) => {
  await t.test('AiServiceClient returns deterministic mock analysis for Affidavit', async () => {
    const res = await aiServiceClient.analyzeDocument({
      request_id: 'test-req-1',
      application_id: 'test-app-1',
      document_id: 'test-doc-1',
      document_category: DocumentCategory.AFFIDAVIT,
      file_name: 'undertaking.pdf',
      content_sha256: 'fakehash123',
      file_reference: 'fake_storage_key.pdf',
    });

    assert.equal(res.service_mode, 'mock');
    assert.ok(res.extracted_fields.length > 0);
    const titleField = res.extracted_fields.find(f => f.field_name === 'document_title');
    assert.ok(titleField);
    assert.match(titleField.value, /AFFIDAVIT/);
  });

  await t.test('AiServiceClient flags expired certificate anomaly', async () => {
    const res = await aiServiceClient.analyzeDocument({
      request_id: 'test-req-2',
      application_id: 'test-app-1',
      document_id: 'test-doc-2',
      document_category: DocumentCategory.FIRE_SAFETY_CERTIFICATE,
      file_name: 'fire_safety.pdf',
      content_sha256: 'fakehash456',
      file_reference: 'fake_fire.pdf',
    });

    assert.equal(res.service_mode, 'mock');
    assert.ok(res.anomalies.length > 0);
    const expiryAnomaly = res.anomalies.find(a => a.code === 'POSSIBLY_EXPIRED' || a.code === 'DOCUMENT_EXPIRATION_DETECTED');
    assert.ok(expiryAnomaly);
    assert.equal(expiryAnomaly.requires_human_review, true);
  });

  await t.test('SHA-256 calculation produces valid 64-char hexadecimal digest', async () => {
    const tempFile = path.resolve('./private-uploads/test_temp.txt');
    fs.writeFileSync(tempFile, 'AICTE VERIFYAI TEST CONTENT FOR HASHING');
    try {
      const hash = await calculateFileSha256(tempFile);
      assert.equal(typeof hash, 'string');
      assert.equal(hash.length, 64);
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });
});
