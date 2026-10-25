import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

test('Authentication & Token Security Suite', async (t) => {
  const mockUser = {
    id: 'user-uuid-1',
    name: 'Test Officer',
    email: 'officer@test.ai',
    role: Role.OFFICER,
    institutionId: null,
  };

  await t.test('generateToken produces valid signed JWT with role claim', () => {
    const token = generateToken(mockUser);
    assert.ok(typeof token === 'string');

    const decoded = jwt.decode(token) as any;
    assert.equal(decoded.id, mockUser.id);
    assert.equal(decoded.role, 'OFFICER');
    assert.equal(decoded.email, mockUser.email);
  });
});
