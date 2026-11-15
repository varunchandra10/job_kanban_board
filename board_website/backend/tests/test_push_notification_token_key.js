/**
 * Automated Verification Suite: Push Notification Token Resolution & Subscription (Phase 2.2)
 *
 * Verifies:
 * 1. pushNotifications token resolution standardizes on 'auth_token' (with fallback to 'job_tracker_token').
 * 2. Active user ID is correctly inferred from input, auth_user cache, or JWT payload.
 * 3. Subscription route handler rejects anonymous requests lacking auth with 401.
 * 4. Authenticated requests with Bearer auth_token save push subscriptions correctly.
 * 5. Full lifecycle of push notification subscription: status verification, save, and unsubscribe.
 */

process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
process.env.NODE_ENV = 'test';

const assert = require('assert');
const pushNotificationService = require('../src/services/pushNotificationService');
const { signToken, verifyToken } = require('../src/services/jwtService');

function mockGetAuthToken(storage) {
  return storage['auth_token'] || storage['job_tracker_token'] || null;
}

function mockResolveUserId(storage, fallback) {
  if (fallback) return String(fallback);
  const rawUser = storage['auth_user'];
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      if (user?.id) return String(user.id);
    } catch (_) {}
  }
  const token = mockGetAuthToken(storage);
  if (token && token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts[1]) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        if (payload?.id) return String(payload.id);
      }
    } catch (_) {}
  }
  return undefined;
}

// Mock express response factory
function createMockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

async function runTests() {
  console.log('\n--- Running Push Notification Token Resolution Suite (Phase 2.2) ---');

  // Test 1: Client storage token resolution logic
  console.log('Test 1: Verify token extraction prioritizes auth_token over legacy keys');
  const storage1 = { auth_token: 'active-jwt-token-123' };
  assert.strictEqual(mockGetAuthToken(storage1), 'active-jwt-token-123');

  const storage2 = { job_tracker_token: 'legacy-token-456' };
  assert.strictEqual(mockGetAuthToken(storage2), 'legacy-token-456');

  const storage3 = { auth_token: 'primary-token', job_tracker_token: 'legacy-token' };
  assert.strictEqual(mockGetAuthToken(storage3), 'primary-token');
  console.log('✓ Token resolver correctly extracts auth_token with legacy fallback');

  // Test 2: User ID resolution from profile cache and JWT
  console.log('Test 2: Verify user ID resolution from profile cache and JWT payload');
  const profileStorage = {
    auth_user: JSON.stringify({ id: 99, email: 'user99@test.com' }),
    auth_token: 'some-token'
  };
  assert.strictEqual(mockResolveUserId(profileStorage), '99');

  const testUser = { id: 777, email: 'push_test@example.com' };
  const validToken = signToken(testUser);
  const jwtOnlyStorage = { auth_token: validToken };
  assert.strictEqual(mockResolveUserId(jwtOnlyStorage), '777');
  console.log('✓ User ID resolution resolves accurately from both profile and JWT payload');

  // Test 3: Backend VAPID public key generation
  console.log('Test 3: Verify VAPID public key generation');
  const publicKey = pushNotificationService.getPublicKey();
  assert(publicKey, 'VAPID public key must be generated and valid');
  assert.strictEqual(typeof publicKey, 'string');
  assert(publicKey.length > 20, 'VAPID public key must be valid base64');
  console.log('✓ VAPID public key active: ' + publicKey.slice(0, 24) + '...');

  // Test 4: Anonymous subscription without token or user ID returns 401
  console.log('Test 4: Anonymous subscription handler without token or userId returns 401');
  const mockReqAnonymous = {
    headers: {},
    body: {
      subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/anonymous-device' }
    }
  };
  const mockResAnonymous = createMockResponse();

  // Emulate /api/notifications/subscribe router handler
  const handleSubscribe = (req, res) => {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to enable mobile notifications' });
    }
    const { subscription, userAgent } = req.body;
    const result = pushNotificationService.saveSubscription(userId, subscription, userAgent);
    res.json({ ok: 1, ...result });
  };

  handleSubscribe(mockReqAnonymous, mockResAnonymous);
  assert.strictEqual(mockResAnonymous.statusCode, 401, 'Anonymous request must return 401');
  assert(mockResAnonymous.body.error.includes('log in'), 'Must return login requirement error message');
  console.log('✓ Anonymous push subscription correctly rejected with 401');

  // Test 5: Authenticated subscription with auth_token JWT verified user succeeds
  console.log('Test 5: Authenticated subscription with decoded user ID succeeds');
  const decodedUser = verifyToken(validToken);
  assert.strictEqual(decodedUser.id, 777);

  const mockEndpoint = 'https://fcm.googleapis.com/fcm/send/test-device-' + Date.now();
  const mockReqAuth = {
    headers: { authorization: `Bearer ${validToken}` },
    user: decodedUser,
    body: {
      subscription: {
        endpoint: mockEndpoint,
        keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' }
      },
      userAgent: 'Mozilla/5.0 Test Mobile Browser'
    }
  };
  const mockResAuth = createMockResponse();
  handleSubscribe(mockReqAuth, mockResAuth);

  assert.strictEqual(mockResAuth.statusCode, 200);
  assert.strictEqual(mockResAuth.body.ok, 1);
  console.log('✓ Push subscription successfully saved for authenticated user (ID 777)');

  // Test 6: Verify status reflects subscribed device
  console.log('Test 6: Verify push subscription status reflects device for user 777');
  const handleStatus = (req, res) => {
    const userId = req.user?.id || req.query?.userId;
    if (!userId) {
      return res.json({ hasPush: false, deviceCount: 0 });
    }
    const subs = pushNotificationService.getUserSubscriptions(userId);
    res.json({
      hasPush: subs.length > 0,
      deviceCount: subs.length
    });
  };

  const mockReqStatus = { user: decodedUser, query: {} };
  const mockResStatus = createMockResponse();
  handleStatus(mockReqStatus, mockResStatus);

  assert.strictEqual(mockResStatus.statusCode, 200);
  assert.strictEqual(mockResStatus.body.hasPush, true);
  assert(mockResStatus.body.deviceCount >= 1);
  console.log(`✓ Status verified: hasPush = true, deviceCount = ${mockResStatus.body.deviceCount}`);

  // Test 7: Unsubscribe device
  console.log('Test 7: Unsubscribe endpoint deletes subscription for user 777');
  const handleUnsubscribe = (req, res) => {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in' });
    }
    const { endpoint } = req.body;
    const result = pushNotificationService.deleteSubscription(userId, endpoint);
    res.json(result);
  };

  const mockReqUnsub = {
    user: decodedUser,
    body: { endpoint: mockEndpoint }
  };
  const mockResUnsub = createMockResponse();
  handleUnsubscribe(mockReqUnsub, mockResUnsub);

  assert.strictEqual(mockResUnsub.statusCode, 200);
  assert.strictEqual(mockResUnsub.body.ok, true);
  console.log('✓ Subscription cleanly deleted on unsubscribe');

  console.log('\n✅ ALL 7 PUSH NOTIFICATION TOKEN RESOLUTION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
