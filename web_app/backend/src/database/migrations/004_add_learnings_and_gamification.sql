CREATE TABLE IF NOT EXISTS learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  topic TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  date_logged TEXT DEFAULT (date('now')),
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT DEFAULT '',
  resource_url TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO learnings (title, topic, category, date_logged, duration_minutes, notes, resource_url, tags)
SELECT 'System Design: Distributed Caching & Eviction Policies', 'Redis / Memcached Architecture', 'System Design', date('now', '-1 day'), 60, 'Deep dived into LRU vs LFU caching, write-through vs write-back strategies, and cache stampede prevention using probabilistic early expiration.', 'https://highscalability.com', 'SystemDesign,Redis,Distributed'
WHERE NOT EXISTS (SELECT 1 FROM learnings WHERE title LIKE 'System Design: Distributed Caching%');

INSERT INTO learnings (title, topic, category, date_logged, duration_minutes, notes, resource_url, tags)
SELECT 'DSA: Sliding Window & Two-Pointer Optimal Mastery', 'LeetCode Medium / Hard Patterns', 'Algorithms', date('now'), 45, 'Solved 3 tricky medium problems on minimum window substring and longest contiguous subarray. Time complexity maintained at O(N) linear time.', 'https://leetcode.com', 'DSA,Algorithms,LeetCode'
WHERE NOT EXISTS (SELECT 1 FROM learnings WHERE title LIKE 'DSA: Sliding Window%');
