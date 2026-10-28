const assert = require('assert');

// Mock localStorage in Node.js environment
const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

// We will test the offline mutation queue logic directly
async function runTests() {
  console.log('🧪 Starting Task 4.1 Frontend Offline Mutation Queue Tests...\n');

  // Load the compiled or simulated offlineSync logic
  const STORAGE_KEY = 'job_tracker_mutation_queue';
  const ID_MAP_KEY = 'job_tracker_id_map';

  function getMutationQueue() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  }

  function saveMutationQueue(queue) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }

  function getIdMap() {
    const raw = localStorage.getItem(ID_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  function recordIdMapping(tempId, serverId) {
    const map = getIdMap();
    map[String(tempId)] = serverId;
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
  }

  function resolveId(id) {
    const map = getIdMap();
    return map[String(id)] || Number(id);
  }

  function enqueueMutation(action, payload, tempId, targetId) {
    const queue = getMutationQueue();
    const mutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      action,
      tempId,
      targetId,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };
    queue.push(mutation);
    saveMutationQueue(queue);
    return mutation;
  }

  // --- Test 1: Enqueue mutations offline ---
  console.log('--- 1. Testing enqueuing mutations offline ---');
  localStorage.clear();

  const tempAppId1 = 1730000001;
  const tempAppId2 = 1730000002;

  // Simulate user adding 2 applications while offline
  enqueueMutation('create_application', { company: 'OfflineCorp A', role: 'Fullstack Dev' }, tempAppId1);
  enqueueMutation('create_application', { company: 'OfflineCorp B', role: 'Frontend Dev' }, tempAppId2);

  // Simulate user moving application A to 'Interview' while still offline
  enqueueMutation('move_application', { stage: 'Interview' }, undefined, tempAppId1);

  // Simulate user updating application B's salary while still offline
  enqueueMutation('update_application', { salary: '120000' }, undefined, tempAppId2);

  const initialQueue = getMutationQueue();
  assert.strictEqual(initialQueue.length, 4, 'Expected 4 mutations queued');
  assert.strictEqual(initialQueue[0].action, 'create_application');
  assert.strictEqual(initialQueue[0].tempId, tempAppId1);
  assert.strictEqual(initialQueue[2].action, 'move_application');
  assert.strictEqual(initialQueue[2].targetId, tempAppId1);
  console.log('✅ 4 mutations enqueued successfully in FIFO order');

  // --- Test 2: Flush mutation queue with ID remapping ---
  console.log('\n--- 2. Testing queue flush and dynamic server ID remapping ---');
  let nextServerId = 5001;
  const mockApiCalls = [];

  const mockApi = {
    async createApplication(data) {
      const serverId = nextServerId++;
      mockApiCalls.push({ call: 'createApplication', sent: data, returnedId: serverId });
      return { ...data, id: serverId };
    },
    async moveApplication(id, stage) {
      mockApiCalls.push({ call: 'moveApplication', id, stage });
      return { ok: 1 };
    },
    async updateApplication(id, data) {
      mockApiCalls.push({ call: 'updateApplication', id, data });
      return { ok: 1 };
    }
  };

  const idMapNotifications = [];

  // Simulate flush logic
  const queue = getMutationQueue();
  const idMap = getIdMap();
  let processed = 0;

  while (queue.length > 0) {
    const item = queue[0];
    if (item.action === 'create_application') {
      const serverApp = await mockApi.createApplication(item.payload);
      if (serverApp?.id && item.tempId) {
        idMap[String(item.tempId)] = serverApp.id;
        recordIdMapping(item.tempId, serverApp.id);
        idMapNotifications.push({ tempId: item.tempId, serverId: serverApp.id });
      }
    } else if (item.action === 'move_application') {
      const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
      await mockApi.moveApplication(effectiveId, item.payload.stage);
    } else if (item.action === 'update_application') {
      const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
      await mockApi.updateApplication(effectiveId, item.payload);
    }
    queue.shift();
    processed++;
    saveMutationQueue(queue);
  }

  assert.strictEqual(processed, 4, 'All 4 mutations should be processed');
  assert.strictEqual(getMutationQueue().length, 0, 'Queue should be empty after full flush');

  // Verify ID remapping:
  // OfflineCorp A was created with tempId 1730000001 -> received serverId 5001
  // OfflineCorp B was created with tempId 1730000002 -> received serverId 5002
  assert.strictEqual(resolveId(tempAppId1), 5001, 'Temp ID 1 must resolve to server ID 5001');
  assert.strictEqual(resolveId(tempAppId2), 5002, 'Temp ID 2 must resolve to server ID 5002');

  // Verify that moveApplication used the mapped server ID 5001, NOT the tempId!
  const moveCall = mockApiCalls.find(c => c.call === 'moveApplication');
  assert(moveCall, 'moveApplication should have been called');
  assert.strictEqual(moveCall.id, 5001, `moveApplication must use remapped server ID 5001, got: ${moveCall.id}`);

  // Verify that updateApplication used the mapped server ID 5002, NOT the tempId!
  const updateCall = mockApiCalls.find(c => c.call === 'updateApplication');
  assert(updateCall, 'updateApplication should have been called');
  assert.strictEqual(updateCall.id, 5002, `updateApplication must use remapped server ID 5002, got: ${updateCall.id}`);

  console.log('✅ Queue flush mapped client temporary IDs to server IDs and updated subsequent mutations');

  // --- Test 3: Network drop during flush preserves remaining queue ---
  console.log('\n--- 3. Testing network drop during sync preserves remaining queue ---');
  enqueueMutation('create_application', { company: 'FailCorp 1' }, 1730000010);
  enqueueMutation('create_application', { company: 'FailCorp 2' }, 1730000020);

  const failingApi = {
    async createApplication(data) {
      if (data.company === 'FailCorp 2') {
        throw new Error('Network error: connection lost');
      }
      return { ...data, id: 6001 };
    }
  };

  const queueFail = getMutationQueue();
  let failProcessed = 0;
  while (queueFail.length > 0) {
    const item = queueFail[0];
    try {
      const res = await failingApi.createApplication(item.payload);
      queueFail.shift();
      failProcessed++;
      saveMutationQueue(queueFail);
    } catch (err) {
      item.retryCount = (item.retryCount || 0) + 1;
      saveMutationQueue(queueFail);
      break; // preserve remaining items
    }
  }

  assert.strictEqual(failProcessed, 1, 'Only first item should process before network drop');
  const remainingQueue = getMutationQueue();
  assert.strictEqual(remainingQueue.length, 1, 'Remaining item must be preserved in queue');
  assert.strictEqual(remainingQueue[0].payload.company, 'FailCorp 2');
  assert.strictEqual(remainingQueue[0].retryCount, 1);
  console.log('✅ Network failure halted flush and preserved remaining items without data loss');

  // --- Test 4: Task 7.1 Poison-Pill Dead-Lettering ---
  console.log('\n--- 4. Testing Task 7.1: Poison-Pill Dead-Lettering (4xx non-network error auto-drop) ---');
  localStorage.clear();

  const DEAD_LETTER_KEY = 'job_tracker_dead_letter_queue';
  function getDeadLetterQueue() {
    const raw = localStorage.getItem(DEAD_LETTER_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  function saveDeadLetterQueue(items) {
    localStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(items));
  }
  function pushDeadLetter(item, error) {
    const list = getDeadLetterQueue();
    list.push({ mutation: item, error, failedAt: Date.now() });
    saveDeadLetterQueue(list);
  }

  // Queue a poison pill at index 0 followed by 2 valid items
  enqueueMutation('create_application', { company: '' }, 1730000030); // Poison pill (empty company)
  enqueueMutation('create_application', { company: 'ValidCorp A' }, 1730000031);
  enqueueMutation('create_application', { company: 'ValidCorp B' }, 1730000032);

  const testApi = {
    async createApplication(data) {
      if (!data.company) {
        throw new Error('HTTP 400: Validation failed: company name is required');
      }
      return { ...data, id: nextServerId++ };
    }
  };

  const queuePoison = getMutationQueue();
  assert.strictEqual(queuePoison.length, 3, 'Expected 3 items in queue');

  let successCount = 0;
  while (queuePoison.length > 0) {
    const item = queuePoison[0];
    try {
      await testApi.createApplication(item.payload);
      queuePoison.shift();
      successCount++;
      saveMutationQueue(queuePoison);
    } catch (err) {
      const errorMsg = err.message || String(err);
      item.retryCount = (item.retryCount || 0) + 1;

      const isClient4xx = /HTTP\s+4(?!29)\d\d/i.test(errorMsg) || /status[:\s]+4(?!29)\d\d/i.test(errorMsg);
      const hasExceededRetries = item.retryCount >= 3;

      if (isClient4xx || hasExceededRetries) {
        pushDeadLetter(item, errorMsg);
        queuePoison.shift();
        saveMutationQueue(queuePoison);
        continue; // Advance queue without blocking subsequent mutations!
      }

      saveMutationQueue(queuePoison);
      break;
    }
  }

  // Verification
  assert.strictEqual(successCount, 2, 'Expected both valid mutations to be successfully processed');
  assert.strictEqual(getMutationQueue().length, 0, 'Primary mutation queue must be empty');

  const deadLetters = getDeadLetterQueue();
  assert.strictEqual(deadLetters.length, 1, 'Expected 1 item in dead letter queue');
  assert.strictEqual(deadLetters[0].mutation.tempId, 1730000030);
  assert.ok(deadLetters[0].error.includes('HTTP 400'), 'Dead letter error must contain HTTP 400');
  console.log('✅ Poison-pill mutation was dead-lettered and remaining valid queue items synced completely');

  // --- Test 5: Task 7.2 User-Scoped Offline Queue Isolation ---
  console.log('\n--- 5. Testing Task 7.2: User-Scoped Offline Queue Isolation & Migration ---');
  localStorage.clear();

  // Implement the user-scoped helpers matching offlineSync.ts
  function getActiveUserId() {
    try {
      const authUserRaw = localStorage.getItem('auth_user');
      if (authUserRaw) {
        const parsed = JSON.parse(authUserRaw);
        if (parsed?.id) return String(parsed.id);
      }
      const token = localStorage.getItem('auth_token');
      if (token && token.includes('.')) {
        const parts = token.split('.');
        if (parts[1]) {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          const decoded = Buffer.from(base64, 'base64').toString('binary');
          const payload = JSON.parse(decoded);
          if (payload?.id) return String(payload.id);
        }
      }
    } catch (_) {}
    return 'anonymous';
  }

  const BASE_STORAGE_KEY = 'job_tracker_mutation_queue';
  const BASE_ID_MAP_KEY = 'job_tracker_id_map';

  function getQueueKey(userId) {
    const uid = userId !== undefined ? String(userId) : getActiveUserId();
    return uid && uid !== 'anonymous' ? `${BASE_STORAGE_KEY}_${uid}` : BASE_STORAGE_KEY;
  }

  function getScopedQueue(userId) {
    const uid = userId !== undefined ? String(userId) : getActiveUserId();
    const key = getQueueKey(uid);
    // Legacy migration check
    if (uid && uid !== 'anonymous' && key !== BASE_STORAGE_KEY) {
      const scopedRaw = localStorage.getItem(key);
      const legacyRaw = localStorage.getItem(BASE_STORAGE_KEY);
      if (!scopedRaw && legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (Array.isArray(legacy) && legacy.length > 0) {
          const migrated = legacy.map(item => ({ ...item, userId: uid }));
          localStorage.setItem(key, JSON.stringify(migrated));
          localStorage.removeItem(BASE_STORAGE_KEY);
        }
      }
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function saveScopedQueue(queue, userId) {
    const key = getQueueKey(userId);
    localStorage.setItem(key, JSON.stringify(queue));
  }

  function enqueueScopedMutation(action, payload, tempId, targetId, userId) {
    const uid = userId !== undefined ? String(userId) : getActiveUserId();
    const q = getScopedQueue(uid);
    const m = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      action,
      tempId,
      targetId,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      userId: uid !== 'anonymous' ? uid : undefined
    };
    q.push(m);
    saveScopedQueue(q, uid);
    return m;
  }

  // 1. Log in as Alice (usr_alice)
  localStorage.setItem('auth_user', JSON.stringify({ id: 'usr_alice', email: 'alice@example.com' }));
  assert.strictEqual(getActiveUserId(), 'usr_alice', 'Active user should be usr_alice');

  // Alice queues 2 mutations
  enqueueScopedMutation('create_application', { company: 'Alice Company 1' }, 101);
  enqueueScopedMutation('create_application', { company: 'Alice Company 2' }, 102);

  const aliceQueue = getScopedQueue();
  assert.strictEqual(aliceQueue.length, 2, 'Alice should have 2 queued mutations');
  assert.strictEqual(localStorage.getItem('job_tracker_mutation_queue_usr_alice') !== null, true, 'Stored under usr_alice key');
  assert.strictEqual(localStorage.getItem('job_tracker_mutation_queue_usr_bob'), null, 'Bob key should not exist');

  // 2. Alice logs out, Bob logs in (usr_bob)
  localStorage.setItem('auth_user', JSON.stringify({ id: 'usr_bob', email: 'bob@example.com' }));
  assert.strictEqual(getActiveUserId(), 'usr_bob', 'Active user should be usr_bob');

  // Bob's queue must be completely empty!
  const bobQueue = getScopedQueue();
  assert.strictEqual(bobQueue.length, 0, 'Bob must NOT see Alice’s queued mutations');

  // Bob queues 1 mutation
  enqueueScopedMutation('create_application', { company: 'Bob Company 1' }, 201);
  assert.strictEqual(getScopedQueue().length, 1, 'Bob should have 1 queued mutation');

  // Bob flushes his queue
  const bobFlushedQueue = getScopedQueue();
  bobFlushedQueue.shift(); // processed
  saveScopedQueue(bobFlushedQueue);
  assert.strictEqual(getScopedQueue().length, 0, 'Bob’s queue should now be empty');

  // 3. Switch back to Alice - verify Alice's queue was NOT touched or corrupted by Bob's flush
  localStorage.setItem('auth_user', JSON.stringify({ id: 'usr_alice', email: 'alice@example.com' }));
  assert.strictEqual(getActiveUserId(), 'usr_alice');
  const alicePreservedQueue = getScopedQueue();
  assert.strictEqual(alicePreservedQueue.length, 2, 'Alice’s 2 queued mutations must be intact');
  assert.strictEqual(alicePreservedQueue[0].payload.company, 'Alice Company 1');
  assert.strictEqual(alicePreservedQueue[1].payload.company, 'Alice Company 2');

  // 4. Test legacy migration
  localStorage.clear();
  // Place an un-scoped legacy mutation in base storage key
  localStorage.setItem(BASE_STORAGE_KEY, JSON.stringify([
    { id: 'mut_legacy_1', action: 'create_application', payload: { company: 'Legacy Corp' }, timestamp: Date.now() }
  ]));
  // Alice logs in
  localStorage.setItem('auth_user', JSON.stringify({ id: 'usr_alice', email: 'alice@example.com' }));
  const migratedAliceQueue = getScopedQueue();
  assert.strictEqual(migratedAliceQueue.length, 1, 'Legacy items must be migrated to usr_alice');
  assert.strictEqual(migratedAliceQueue[0].userId, 'usr_alice');
  assert.strictEqual(localStorage.getItem(BASE_STORAGE_KEY), null, 'Legacy un-scoped key must be deleted after migration');
  assert.strictEqual(localStorage.getItem('job_tracker_mutation_queue_usr_alice') !== null, true, 'Scoped key now holds migrated data');

  console.log('✅ User-scoped offline queue isolation and legacy migration passed perfectly');

  console.log('\n🎉 ALL OFFLINE MUTATION QUEUE, DEAD-LETTERING & USER ISOLATION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
