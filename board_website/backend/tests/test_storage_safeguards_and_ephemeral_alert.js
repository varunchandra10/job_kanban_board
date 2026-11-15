process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const config = require('../src/config');
const documentsRouter = require('../src/routes/documents');

async function runTests() {
  console.log('🧪 Starting Task 3.1 Storage Safeguards & Ephemeral Cloud Alert Tests...\n');

  // Find /storage/status handler on documents router
  const statusLayer = documentsRouter.stack.find(
    s => s.route && s.route.path === '/storage/status'
  );
  assert.ok(statusLayer, 'Expected /storage/status route to exist');
  const statusHandler = statusLayer.route.stack[0].handle;

  const createMockRes = () => {
    return {
      statusCode: 200,
      jsonData: null,
      status(s) {
        this.statusCode = s;
        return this;
      },
      json(d) {
        this.jsonData = d;
        return this;
      }
    };
  };

  const originalIsVercel = config.isVercel;
  const originalTursoUrl = config.tursoDatabaseUrl;
  const originalIsDesktop = config.isDesktop;

  try {
    // -----------------------------------------------------------------
    // 1. Test Ephemeral Vercel Deployment Warning
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Ephemeral Vercel Deployment Warning ---');
    config.isVercel = true;
    config.tursoDatabaseUrl = '';
    config.tursoUrl = '';
    config.isDesktop = false;

    const res1 = createMockRes();
    statusHandler({ user: null }, res1);

    assert.strictEqual(res1.statusCode, 200);
    assert.ok(res1.jsonData.persistence, 'Response must include persistence diagnostic block');
    assert.strictEqual(res1.jsonData.persistence.isEphemeral, true, 'isEphemeral must be true when running on Vercel without Turso');
    assert.strictEqual(res1.jsonData.persistence.isPermanent, false);
    assert.strictEqual(res1.jsonData.persistence.type, 'ephemeral_tmp');
    assert.ok(res1.jsonData.persistence.warning.includes('ephemeral /tmp storage'), 'Expected informative ephemeral warning');
    console.log('✅ Ephemeral Vercel storage alert correctly surfaced in /storage/status');

    // -----------------------------------------------------------------
    // 2. Test Persistent Turso Cloud Deployment
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Persistent Turso Cloud Deployment ---');
    config.isVercel = true;
    config.tursoDatabaseUrl = 'libsql://my-prod-db.turso.io';
    config.tursoUrl = 'libsql://my-prod-db.turso.io';

    const res2 = createMockRes();
    statusHandler({ user: null }, res2);

    assert.strictEqual(res2.jsonData.persistence.isEphemeral, false, 'isEphemeral must be false when Turso is connected');
    assert.strictEqual(res2.jsonData.persistence.isPermanent, true);
    assert.strictEqual(res2.jsonData.persistence.type, 'permanent_turso_cloud');
    assert.strictEqual(res2.jsonData.persistence.warning, null);
    console.log('✅ Turso cloud deployment verified as permanent storage');

    // -----------------------------------------------------------------
    // 3. Test Desktop Local Disk Deployment
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Desktop Local Disk Deployment ---');
    config.isVercel = false;
    config.tursoDatabaseUrl = '';
    config.tursoUrl = '';
    config.isDesktop = true;

    const res3 = createMockRes();
    statusHandler({ user: null }, res3);

    assert.strictEqual(res3.jsonData.persistence.isEphemeral, false);
    assert.strictEqual(res3.jsonData.persistence.isPermanent, true);
    assert.strictEqual(res3.jsonData.persistence.type, 'permanent_desktop_disk');
    assert.strictEqual(res3.jsonData.persistence.warning, null);
    console.log('✅ Desktop local disk deployment verified as permanent storage');

    console.log('\n🎉 ALL TASK 3.1 STORAGE SAFEGUARDS & EPHEMERAL ALERT TESTS PASSED!\n');
    process.exit(0);
  } finally {
    config.isVercel = originalIsVercel;
    config.tursoDatabaseUrl = originalTursoUrl;
    config.tursoUrl = originalTursoUrl;
    config.isDesktop = originalIsDesktop;
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
