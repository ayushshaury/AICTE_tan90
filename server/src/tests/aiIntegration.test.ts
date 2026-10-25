import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { aiServiceClient } from '../services/aiService.js';
import { DocumentCategory } from '@prisma/client';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN || 'aicte_verifyai_internal_token_secret';

test('Python AI Microservice Integration Suite', async (t) => {
  await t.test('GET /api/v1/health responds with status ok', async () => {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/health`);
      if (!response.ok) {
        assert.fail(`AI health endpoint returned status ${response.status}`);
      }
      const data = await response.json() as any;
      assert.equal(data.status, 'ok');
      assert.equal(data.service, 'AICTE VerifyAI AI Service');
      assert.equal(data.token_auth_enabled, true);
    } catch (err: any) {
      if (err.cause?.code === 'ECONNREFUSED') {
        t.skip('Python AI Service is not running on 8001, skipping live check');
      } else {
        throw err;
      }
    }
  });

  await t.test('AiServiceClient processes real PDF through FastAPI and extracts fields', async () => {
    const testPdfPath = path.resolve('./private-uploads/synthetic_apex_affidavit_2026.pdf');
    if (!fs.existsSync(testPdfPath)) {
      t.skip('Sample test PDF not found on disk');
      return;
    }

    const res = await aiServiceClient.analyzeDocument({
      request_id: 'test-integration-req-1',
      application_id: 'test-app-id',
      document_id: 'test-doc-id',
      document_category: DocumentCategory.AFFIDAVIT,
      file_name: 'synthetic_apex_affidavit_2026.pdf',
      content_sha256: 'testsha256',
      file_reference: 'synthetic_apex_affidavit_2026.pdf',
      file_path: testPdfPath,
      mime_type: 'application/pdf',
    });

    assert.ok(res);
    assert.equal(res.service_mode, 'fastapi');
    assert.ok(res.extracted_fields.length > 0);
    assert.ok(res.warnings.length > 0);
    // Verify regulatory disclaimer is present
    assert.match(res.warnings[0], /screening|advisory|compliance/i);
  });
});
