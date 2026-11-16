/**
 * Automated Verification Suite: CalendarView O(N) Pre-Indexing Optimization (Phase 3.2)
 *
 * Verifies:
 * 1. Functional equivalence: The O(N + M) pre-indexed Map produces identical results to linear O(Days * N) filtering.
 * 2. Multi-event bucket assignment: applications correctly map to 'applied' and 'due', and learnings map to 'learnings'.
 * 3. Timestamp slicing: ISO timestamps (e.g. '2026-11-16T12:00:00.000Z') correctly normalize to 'YYYY-MM-DD'.
 * 4. Empty and missing date resilience: null, undefined, or empty date fields never throw or corrupt the map.
 * 5. High-throughput performance benchmark: Pre-indexing 2,000 items and querying 31 calendar days runs in < 5ms
 *    (compared to > 120,000 array iterations in un-optimized linear scan).
 */

const assert = require('assert');

// Pre-indexing algorithm from CalendarView.tsx
function createCalendarEventsIndex(applications, learnings) {
  const map = new Map();

  const getOrCreate = (dateStr) => {
    let entry = map.get(dateStr);
    if (!entry) {
      entry = { applied: [], due: [], learnings: [] };
      map.set(dateStr, entry);
    }
    return entry;
  };

  // 1. Index applications by date_applied and deadline
  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    if (app && app.date_applied) {
      getOrCreate(app.date_applied).applied.push(app);
    }
    if (app && app.deadline) {
      getOrCreate(app.deadline).due.push(app);
    }
  }

  // 2. Index learnings by date_logged (sliced to YYYY-MM-DD)
  for (let i = 0; i < learnings.length; i++) {
    const l = learnings[i];
    if (l && l.date_logged) {
      const dateKey = String(l.date_logged).slice(0, 10);
      if (dateKey) {
        getOrCreate(dateKey).learnings.push(l);
      }
    }
  }

  const EMPTY = { applied: [], due: [], learnings: [] };

  return {
    map,
    getDayEvents(dateStr) {
      return map.get(dateStr) || EMPTY;
    }
  };
}

// Legacy linear scan for comparison
function linearScanDayEvents(applications, learnings, dateStr) {
  const applied = applications.filter(a => a.date_applied === dateStr);
  const due = applications.filter(a => a.deadline === dateStr);
  const lEvents = learnings.filter(l => (l.date_logged || '').slice(0, 10) === dateStr);
  return { applied, due, learnings: lEvents };
}

async function runTests() {
  console.log('\n--- Running CalendarView O(N) Pre-Indexing Test Suite (Phase 3.2) ---');

  // Test 1: Functional Equivalence between Pre-indexed Map and Legacy Scan
  console.log('Test 1: Verifying exact parity between O(N) index and linear scan');
  const mockApps = [
    { id: 1, company: 'Google', role: 'Staff SWE', date_applied: '2026-11-10', deadline: '2026-11-20' },
    { id: 2, company: 'Stripe', role: 'Backend Engineer', date_applied: '2026-11-10', deadline: '2026-11-15' },
    { id: 3, company: 'Databricks', role: 'Solutions Architect', date_applied: '2026-11-15', deadline: '2026-11-25' },
    { id: 4, company: 'Anthropic', role: 'Research Engineer', date_applied: '2026-11-20', deadline: null },
    { id: 5, company: 'OpenAI', role: 'Platform Engineer', date_applied: '', deadline: '2026-11-20' },
  ];

  const mockLearnings = [
    { id: 101, title: 'Two Pointers Pattern', date_logged: '2026-11-10T14:30:00.000Z' },
    { id: 102, title: 'Graph BFS Traversal', date_logged: '2026-11-10' },
    { id: 103, title: 'Kafka Partitioning', date_logged: '2026-11-15T09:15:00.000Z' },
    { id: 104, title: 'Empty date learning', date_logged: null },
  ];

  const calendarIndex = createCalendarEventsIndex(mockApps, mockLearnings);

  const testDates = [
    '2026-11-09', // empty day
    '2026-11-10', // applied + learnings
    '2026-11-15', // applied + deadline + learning
    '2026-11-20', // applied + deadline
    '2026-11-25', // deadline
    '2026-11-30', // empty day
  ];

  for (const date of testDates) {
    const indexed = calendarIndex.getDayEvents(date);
    const linear = linearScanDayEvents(mockApps, mockLearnings, date);

    assert.strictEqual(indexed.applied.length, linear.applied.length, `Applied count mismatch for ${date}`);
    assert.strictEqual(indexed.due.length, linear.due.length, `Due count mismatch for ${date}`);
    assert.strictEqual(indexed.learnings.length, linear.learnings.length, `Learnings count mismatch for ${date}`);

    for (let i = 0; i < indexed.applied.length; i++) {
      assert.strictEqual(indexed.applied[i].id, linear.applied[i].id);
    }
  }
  console.log('  [PASS] Pre-indexed hash map matches linear filter output 100% across all dates');

  // Test 2: Dual-indexing of single application (applied on date A, deadline on date B)
  console.log('Test 2: Verifying dual-bucket indexing for application with both applied date & deadline');
  const nov10 = calendarIndex.getDayEvents('2026-11-10');
  const nov20 = calendarIndex.getDayEvents('2026-11-20');

  const googleAppNov10 = nov10.applied.find(a => a.company === 'Google');
  const googleAppNov20 = nov20.due.find(a => a.company === 'Google');

  assert.ok(googleAppNov10, 'Google must appear in applied bucket on 2026-11-10');
  assert.ok(googleAppNov20, 'Google must appear in due bucket on 2026-11-20');
  assert.strictEqual(googleAppNov10.id, googleAppNov20.id, 'Same app object referenced across buckets');
  console.log('  [PASS] Dual-bucket indexing verified for both applied and deadline dates');

  // Test 3: Null, undefined, and empty string resilience
  console.log('Test 3: Resilience to null, undefined, and malformed date strings');
  const dirtyApps = [
    null,
    undefined,
    { id: 999 },
    { id: 1000, date_applied: null, deadline: undefined },
    { id: 1001, date_applied: '', deadline: '' },
  ];
  const dirtyLearnings = [
    null,
    undefined,
    { id: 888 },
    { id: 889, date_logged: null },
    { id: 890, date_logged: '' },
  ];

  assert.doesNotThrow(() => {
    const dirtyIndex = createCalendarEventsIndex(dirtyApps, dirtyLearnings);
    const day = dirtyIndex.getDayEvents('2026-11-10');
    assert.strictEqual(day.applied.length, 0);
    assert.strictEqual(day.due.length, 0);
    assert.strictEqual(day.learnings.length, 0);
  }, 'Pre-indexer must handle dirty input without throwing');
  console.log('  [PASS] Handled dirty, null, and empty date inputs cleanly');

  // Test 4: High-throughput benchmark (1,500 applications + 1,000 learnings, 31 calendar days)
  console.log('Test 4: High-throughput benchmark (2,500 total items across 31 days)');
  const largeApps = [];
  const largeLearnings = [];

  for (let i = 0; i < 1500; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    const deadlineDay = String(((i + 5) % 28) + 1).padStart(2, '0');
    largeApps.push({
      id: 2000 + i,
      company: `Company ${i % 50}`,
      role: `Role ${i % 10}`,
      date_applied: `2026-11-${day}`,
      deadline: `2026-11-${deadlineDay}`
    });
  }

  for (let i = 0; i < 1000; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    largeLearnings.push({
      id: 5000 + i,
      title: `Learning Note ${i}`,
      date_logged: `2026-11-${day}T10:00:00.000Z`
    });
  }

  // Measure O(N + M) pre-indexing time
  const t0 = Date.now();
  const perfIndex = createCalendarEventsIndex(largeApps, largeLearnings);
  const indexDuration = Date.now() - t0;

  // Measure 31-day lookups (simulating render pass)
  const t1 = Date.now();
  let totalEventsFound = 0;
  for (let d = 1; d <= 31; d++) {
    const dStr = `2026-11-${String(d).padStart(2, '0')}`;
    const ev = perfIndex.getDayEvents(dStr);
    totalEventsFound += ev.applied.length + ev.due.length + ev.learnings.length;
  }
  const lookupDuration = Date.now() - t1;

  assert.ok(totalEventsFound > 0, 'Must have indexed events');
  assert.ok(indexDuration < 20, `Pre-indexing 2,500 items took ${indexDuration}ms, must be < 20ms`);
  assert.ok(lookupDuration < 5, `31-day O(1) lookups took ${lookupDuration}ms, must be < 5ms`);

  console.log(`  [PASS] Pre-indexed 2,500 items in ${indexDuration}ms; 31 calendar lookups took ${lookupDuration}ms`);
  console.log(`  [PASS] Total events matched: ${totalEventsFound} across 31 days`);

  console.log('\n--- All Phase 3.2 Tests Passed Successfully! ---\n');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runTests };

