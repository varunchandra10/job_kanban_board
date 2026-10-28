process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode

const assert = require('assert');
const app = require('../src/app');
const config = require('../src/config');

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(data) { this.body = data; return this; }
  };
  return res;
}

// Extract health handler registered on app
function getHealthHandler() {
  const handler = app.healthHandler;
  assert(handler, 'Expected health handler to be exported on Express app');
  return handler;
}

async function runTests() {
  console.log('🧪 Starting Task 3.3 Production Environment Assertions & Health Endpoint Tests...\n');

  const healthHandler = getHealthHandler();

  // --- Test 1: Standard Persistent Local / Server Environment ---
  console.log('--- 1. Testing standard persistent disk environment ---');
  delete process.env.VERCEL;
  config.tursoDatabaseUrl = '';

  const resLocal = mockRes();
  healthHandler({}, resLocal);

  assert.strictEqual(resLocal.statusCode, 200);
  assert.strictEqual(resLocal.body.status, 'ok');
  assert.strictEqual(resLocal.body.sqliteOk, true);
  assert(resLocal.body.persistence, 'Response must include persistence diagnostic object');
  assert.strictEqual(resLocal.body.persistence.isPermanent, true, 'Standard local disk should be permanent');
  assert.strictEqual(resLocal.body.persistence.isEphemeral, false, 'Standard local disk must not be ephemeral');
  assert.strictEqual(resLocal.body.persistence.warning, null, 'Persistent storage must have no warning');
  console.log('✅ Standard environment correctly verified as permanent storage');

  // --- Test 2: Ephemeral Vercel Environment (Missing Turso DB URL) ---
  console.log('\n--- 2. Testing ephemeral Vercel environment assertion & warning ---');
  process.env.VERCEL = '1';
  config.tursoDatabaseUrl = '';

  const resVercel = mockRes();
  healthHandler({}, resVercel);

  assert.strictEqual(resVercel.statusCode, 200);
  assert.strictEqual(resVercel.body.environment, 'vercel');
  assert.strictEqual(resVercel.body.persistence.isPermanent, false, 'Vercel without Turso must not be permanent');
  assert.strictEqual(resVercel.body.persistence.isEphemeral, true, 'Vercel without Turso must be flagged as ephemeral');
  assert.strictEqual(resVercel.body.persistence.type, 'ephemeral_tmp');
  assert(resVercel.body.persistence.warning.includes('ephemeral /tmp storage'), `Warning must explain ephemeral storage: ${resVercel.body.persistence.warning}`);
  console.log('✅ Vercel ephemeral deployment correctly asserted with diagnostic warning');

  // --- Test 3: Turso Cloud Edge Database Persistence ---
  console.log('\n--- 3. Testing Turso Cloud edge database persistence ---');
  process.env.VERCEL = '1';
  config.tursoDatabaseUrl = 'libsql://job-tracker-production.turso.io';

  const resTurso = mockRes();
  healthHandler({}, resTurso);

  assert.strictEqual(resTurso.statusCode, 200);
  assert.strictEqual(resTurso.body.database, 'turso_cloud');
  assert.strictEqual(resTurso.body.persistence.isPermanent, true, 'Turso Cloud must be flagged as permanent');
  assert.strictEqual(resTurso.body.persistence.isEphemeral, false);
  assert.strictEqual(resTurso.body.persistence.type, 'permanent_turso_cloud');
  assert.strictEqual(resTurso.body.persistence.warning, null, 'Turso deployment should have zero warnings');
  console.log('✅ Turso Cloud persistence correctly asserted');

  // Clean up env
  delete process.env.VERCEL;
  config.tursoDatabaseUrl = '';

  console.log('\n🎉 ALL TASK 3.3 ENVIRONMENT ASSERTIONS & HEALTH DIAGNOSTIC TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
