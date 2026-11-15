process.env.NODE_ENV = 'test';
process.env.TURSO_DATABASE_URL = '';

const assert = require('assert');
const config = require('../src/config');
const app = require('../src/app');
const { signToken } = require('../src/services/jwtService');

async function runTests() {
  console.log('🧪 Starting Task 1.1 Shutdown Endpoint Security Tests...\n');

  const createMockRes = () => {
    const res = {
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
    return res;
  };

  const originalIsDesktop = config.isDesktop;
  const originalAppPin = config.appPin;

  try {
    // -----------------------------------------------------------------
    // Test 1: Web / Cloud Mode Blocks Remote Shutdown (HTTP 403)
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Web/Cloud mode blocks shutdown ---');
    config.isDesktop = false;
    config.appPin = '';

    const res1 = createMockRes();
    app.handleShutdown({ headers: {}, body: {}, _testing: true }, res1);

    assert.strictEqual(res1.statusCode, 403, 'Web mode must reject shutdown with HTTP 403');
    assert.strictEqual(res1.jsonData?.code, 'SHUTDOWN_DISABLED', 'Must return SHUTDOWN_DISABLED code');
    assert.ok(res1.jsonData?.error?.includes('disabled in web deployment mode'), 'Expected informative error message');
    console.log('✅ Remote shutdown strictly blocked with 403 Forbidden in web/cloud mode');

    // -----------------------------------------------------------------
    // Test 2: Desktop Mode with PIN Configured Rejects Missing PIN (HTTP 401)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Desktop mode with PIN configured blocks unauthenticated requests ---');
    config.isDesktop = true;
    config.appPin = 'secure9876';

    const res2 = createMockRes();
    app.handleShutdown({ headers: {}, body: {}, _testing: true }, res2);

    assert.strictEqual(res2.statusCode, 401, 'Must reject missing PIN with HTTP 401');
    assert.strictEqual(res2.jsonData?.code, 'UNAUTHORIZED_SHUTDOWN', 'Must return UNAUTHORIZED_SHUTDOWN code');
    console.log('✅ Unauthenticated shutdown rejected with 401 when PIN is configured');

    // -----------------------------------------------------------------
    // Test 3: Desktop Mode Rejects Incorrect PIN (HTTP 401)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Desktop mode rejects incorrect PIN ---');
    const res3 = createMockRes();
    app.handleShutdown({ headers: { 'x-app-pin': 'wrong_pin' }, body: {}, _testing: true }, res3);

    assert.strictEqual(res3.statusCode, 401, 'Must reject incorrect PIN with HTTP 401');
    assert.strictEqual(res3.jsonData?.code, 'UNAUTHORIZED_SHUTDOWN', 'Must return UNAUTHORIZED_SHUTDOWN code');
    console.log('✅ Incorrect PIN rejected with 401');

    // -----------------------------------------------------------------
    // Test 4: Desktop Mode Accepts Matching Header PIN (HTTP 200)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Desktop mode accepts correct PIN via x-app-pin header ---');
    const res4 = createMockRes();
    app.handleShutdown({ headers: { 'x-app-pin': 'secure9876' }, body: {}, _testing: true }, res4);

    assert.strictEqual(res4.statusCode, 200, 'Must accept matching header PIN with HTTP 200');
    assert.strictEqual(res4.jsonData?.ok, 1);
    console.log('✅ Valid x-app-pin header accepted with HTTP 200');

    // -----------------------------------------------------------------
    // Test 5: Desktop Mode Accepts Matching Body PIN (HTTP 200)
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Desktop mode accepts correct PIN via request body ---');
    const res5 = createMockRes();
    app.handleShutdown({ headers: {}, body: { pin: 'secure9876' }, _testing: true }, res5);

    assert.strictEqual(res5.statusCode, 200, 'Must accept matching body PIN with HTTP 200');
    assert.strictEqual(res5.jsonData?.ok, 1);
    console.log('✅ Valid body pin accepted with HTTP 200');

    // -----------------------------------------------------------------
    // Test 6: Desktop Mode Accepts Valid Authenticated JWT Session (HTTP 200)
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Desktop mode accepts valid JWT Bearer token ---');
    const validToken = signToken({ id: 'usr_admin', email: 'admin@jobtracker.local', name: 'Admin' });
    const res6 = createMockRes();
    app.handleShutdown({
      headers: { authorization: `Bearer ${validToken}` },
      body: {},
      _testing: true
    }, res6);

    assert.strictEqual(res6.statusCode, 200, 'Must accept authenticated JWT session with HTTP 200');
    assert.strictEqual(res6.jsonData?.ok, 1);
    console.log('✅ Valid JWT Bearer session accepted with HTTP 200');

    // -----------------------------------------------------------------
    // Test 7: Desktop Mode without PIN Configured Shuts Down Cleanly (HTTP 200)
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Desktop mode without PIN configured allows graceful shutdown ---');
    config.isDesktop = true;
    config.appPin = '';

    const res7 = createMockRes();
    app.handleShutdown({ headers: {}, body: {}, _testing: true }, res7);

    assert.strictEqual(res7.statusCode, 200, 'Must allow shutdown in desktop mode when no PIN is set');
    assert.strictEqual(res7.jsonData?.ok, 1);
    console.log('✅ Default desktop mode permits graceful shutdown with HTTP 200');

    console.log('\n🎉 ALL TASK 1.1 SHUTDOWN ENDPOINT SECURITY TESTS PASSED!');
    process.exit(0);
  } finally {
    config.isDesktop = originalIsDesktop;
    config.appPin = originalAppPin;
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
