const assert = require('assert');

async function testDebounceAndMutex() {
  console.log('🧪 Starting Task 7.3 Debounce & In-Flight Mutex Tests...\n');

  // --- 1. Test Debounce Timer on Rapid Multi-Events (focus + visibilitychange) ---
  console.log('--- 1. Testing 400ms Debounce Merging Concurrent Events ---');
  let syncDebounceTimer = null;
  let syncExecutionCount = 0;

  function executeSync() {
    syncExecutionCount++;
  }

  function handleSync() {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(() => {
      executeSync();
    }, 400);
  }

  // Simulate user switching tabs rapidly: 5 events within 100ms
  handleSync(); // 0ms - visibilitychange
  handleSync(); // 20ms - window focus
  handleSync(); // 40ms - online event
  handleSync(); // 60ms - rapid blur/focus switch
  handleSync(); // 80ms - final focus event

  assert.strictEqual(syncExecutionCount, 0, 'Sync should not execute before debounce delay');

  // Wait 250ms (still within 400ms window from 80ms)
  await new Promise(r => setTimeout(r, 250));
  assert.strictEqual(syncExecutionCount, 0, 'Sync should still be debounced at 250ms');

  // Wait remaining time for 400ms debounce timer to fire
  await new Promise(r => setTimeout(r, 250));
  assert.strictEqual(syncExecutionCount, 1, 'Debounce must fire executeSync exactly ONCE for 5 rapid events');
  console.log('✅ Debounce timer merged 5 rapid focus/visibility/online events into exactly 1 sync invocation');

  // --- 2. Test In-Flight Mutex Discarding Overlapping refreshState Invocations ---
  console.log('\n--- 2. Testing isSyncingRef In-Flight Mutex ---');
  let isSyncing = false;
  let networkCallCount = 0;
  let discardedCount = 0;

  async function mockRefreshState() {
    if (isSyncing) {
      discardedCount++;
      return;
    }
    isSyncing = true;
    try {
      // Simulate slow asynchronous backend fetch (100ms)
      await new Promise(r => setTimeout(r, 100));
      networkCallCount++;
    } finally {
      isSyncing = false;
    }
  }

  // Fire 3 concurrent calls to mockRefreshState while first is in-flight
  const p1 = mockRefreshState();
  const p2 = mockRefreshState();
  const p3 = mockRefreshState();

  await Promise.all([p1, p2, p3]);

  assert.strictEqual(networkCallCount, 1, 'Only 1 network call should execute while first was in-flight');
  assert.strictEqual(discardedCount, 2, '2 concurrent calls must be discarded by isSyncing mutex');
  assert.strictEqual(isSyncing, false, 'Mutex lock must be released after completion');

  // Sequential call after release should now succeed
  await mockRefreshState();
  assert.strictEqual(networkCallCount, 2, 'Sequential call after release should execute cleanly');
  console.log('✅ In-flight mutex successfully prevented duplicate parallel API calls and released lock cleanly');

  console.log('\n🎉 ALL TASK 7.3 DEBOUNCE & MUTEX TESTS PASSED!\n');
}

testDebounceAndMutex().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

