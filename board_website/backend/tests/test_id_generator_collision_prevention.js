/**
 * Automated Verification Suite: ID Collision Prevention & Monotonic Counter (Phase 2.5)
 *
 * Verifies:
 * 1. generateTempNumericId guarantees 0% collision rate across burst synchronous generations.
 * 2. Monotonicity: id[i+1] > id[i] holds universally across 10,000 consecutive calls.
 * 3. Safe integer compliance: IDs stay well within JavaScript Number.MAX_SAFE_INTEGER bounds.
 * 4. generateUniqueStringId produces 100% distinct cryptographic UUIDs.
 * 5. Concurrent application creation simulation avoids key duplication and state collisions.
 */

const assert = require('assert');
const crypto = require('crypto');

let lastMonotonicId = 0;

function generateTempNumericId() {
  const now = Date.now();
  if (now <= lastMonotonicId) {
    lastMonotonicId += 1;
  } else {
    lastMonotonicId = now;
  }
  return lastMonotonicId;
}

function generateUniqueStringId(prefix) {
  const p = prefix ? `${prefix}-` : '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${p}${crypto.randomUUID()}`;
  }
  return `${p}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function runTests() {
  console.log('\n--- Running ID Collision Prevention Test Suite (Phase 2.5) ---');

  // Test 1: High-burst synchronous numeric ID generation (10,000 calls)
  console.log('Test 1: Generate 10,000 numeric IDs in a single synchronous burst');
  const count = 10000;
  const ids = new Array(count);
  const idSet = new Set();

  const startMs = Date.now();
  for (let i = 0; i < count; i++) {
    const id = generateTempNumericId();
    ids[i] = id;
    idSet.add(id);
  }
  const durationMs = Date.now() - startMs;

  assert.strictEqual(idSet.size, count, `All ${count} IDs must be strictly unique (0 collisions). Got: ${idSet.size}`);
  console.log(`✓ Generated ${count} unique IDs in ${durationMs}ms with ZERO collisions (Set size: ${idSet.size})`);

  // Test 2: Monotonicity verification
  console.log('Test 2: Verify strictly monotonic progression (id[i+1] > id[i])');
  for (let i = 0; i < count - 1; i++) {
    assert(ids[i + 1] > ids[i], `Monotonic violation at index ${i}: ${ids[i + 1]} <= ${ids[i]}`);
  }
  console.log('✓ Strictly monotonic sequence verified across all 10,000 entries');

  // Test 3: Safe integer check
  console.log('Test 3: Verify all IDs fit within JavaScript Number.MAX_SAFE_INTEGER');
  assert(Number.isSafeInteger(ids[0]), 'Initial ID must be a safe integer');
  assert(Number.isSafeInteger(ids[count - 1]), 'Final ID must be a safe integer');
  assert(ids[count - 1] < Number.MAX_SAFE_INTEGER, 'ID must not exceed MAX_SAFE_INTEGER');
  console.log(`✓ Peak ID ${ids[count - 1]} is well within MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`);

  // Test 4: UUID string uniqueness across burst
  console.log('Test 4: Generate 2,000 prefixed UUID strings');
  const strCount = 2000;
  const stringSet = new Set();
  for (let i = 0; i < strCount; i++) {
    const uid = generateUniqueStringId('edu');
    assert(uid.startsWith('edu-'), 'String ID must carry requested prefix');
    stringSet.add(uid);
  }
  assert.strictEqual(stringSet.size, strCount, 'All string UUIDs must be distinct');
  console.log(`✓ 2,000 string IDs generated with 0 duplicates (Set size: ${stringSet.size})`);

  // Test 5: Rapid application state simulation (burst insertion into array)
  console.log('Test 5: Simulate rapid burst creation of 50 applications');
  const mockAppState = [];
  for (let i = 0; i < 50; i++) {
    const app = {
      id: generateTempNumericId(),
      company: `Company ${i}`,
      role: 'Engineer'
    };
    mockAppState.unshift(app);
  }

  const appKeySet = new Set(mockAppState.map(a => a.id));
  assert.strictEqual(appKeySet.size, 50, 'React state list keys must have 0 collisions');

  // Verify finding/updating each app by ID is 100% deterministic
  const targetId = mockAppState[25].id;
  const matched = mockAppState.filter(a => a.id === targetId);
  assert.strictEqual(matched.length, 1, 'Lookup by temporary ID must return exactly 1 unique record');
  console.log('✓ Rapid application state insertion verified with zero key collisions');

  console.log('\n✅ ALL 5 ID COLLISION PREVENTION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

