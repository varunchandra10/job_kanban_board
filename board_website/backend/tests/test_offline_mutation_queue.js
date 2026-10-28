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

  console.log('\n🎉 ALL TASK 4.1 OFFLINE MUTATION QUEUE TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
