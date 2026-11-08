import { DsaCategory } from '../types';

export const DSA_CATEGORIES: DsaCategory[] = [
  {
    id: 'arrays',
    name: 'Arrays',
    iconName: 'ListOrdered',
    subtopics: [
      'Array traversal',
      'Two pointers',
      'Sliding window',
      'Prefix sums',
      "Kadane's Algorithm",
      'In-place modification',
      'Matrix traversal',
      'Intervals'
    ],
    problems: [
      {
        id: 'two-sum',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy'
      },
      {
        id: 'best-time-to-buy-and-sell-stock',
        title: 'Best Time to Buy and Sell Stock',
        url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
        difficulty: 'Easy'
      },
      {
        id: 'product-of-array-except-self',
        title: 'Product of Array Except Self',
        url: 'https://leetcode.com/problems/product-of-array-except-self/',
        difficulty: 'Medium'
      },
      {
        id: 'maximum-subarray',
        title: 'Maximum Subarray',
        url: 'https://leetcode.com/problems/maximum-subarray/',
        difficulty: 'Medium'
      },
      {
        id: '3sum',
        title: '3Sum',
        url: 'https://leetcode.com/problems/3sum/',
        difficulty: 'Medium'
      },
      {
        id: 'container-with-most-water',
        title: 'Container With Most Water',
        url: 'https://leetcode.com/problems/container-with-most-water/',
        difficulty: 'Medium'
      },
      {
        id: 'subarray-sum-equals-k',
        title: 'Subarray Sum Equals K',
        url: 'https://leetcode.com/problems/subarray-sum-equals-k/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'strings',
    name: 'Strings',
    iconName: 'Type',
    subtopics: [
      'Character frequency counting',
      'Two pointers',
      'Sliding window',
      'String parsing',
      'Palindromes',
      'Anagrams',
      'Substrings'
    ],
    problems: [
      {
        id: 'valid-anagram',
        title: 'Valid Anagram',
        url: 'https://leetcode.com/problems/valid-anagram/',
        difficulty: 'Easy'
      },
      {
        id: 'valid-palindrome',
        title: 'Valid Palindrome',
        url: 'https://leetcode.com/problems/valid-palindrome/',
        difficulty: 'Easy'
      },
      {
        id: 'longest-substring-without-repeating-characters',
        title: 'Longest Substring Without Repeating Characters',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        difficulty: 'Medium'
      },
      {
        id: 'longest-repeating-character-replacement',
        title: 'Longest Repeating Character Replacement',
        url: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
        difficulty: 'Medium'
      },
      {
        id: 'group-anagrams',
        title: 'Group Anagrams',
        url: 'https://leetcode.com/problems/group-anagrams/',
        difficulty: 'Medium'
      },
      {
        id: 'longest-palindromic-substring',
        title: 'Longest Palindromic Substring',
        url: 'https://leetcode.com/problems/longest-palindromic-substring/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'linked-lists',
    name: 'Linked Lists',
    iconName: 'GitCommitHorizontal',
    subtopics: [
      'Traversal',
      'Slow and fast pointers',
      'Cycle detection',
      'Reversing a linked list',
      'Merging linked lists',
      'Finding the middle',
      'Dummy node technique',
      'Pointer manipulation'
    ],
    problems: [
      {
        id: 'reverse-linked-list',
        title: 'Reverse Linked List',
        url: 'https://leetcode.com/problems/reverse-linked-list/',
        difficulty: 'Easy'
      },
      {
        id: 'linked-list-cycle',
        title: 'Linked List Cycle',
        url: 'https://leetcode.com/problems/linked-list-cycle/',
        difficulty: 'Easy'
      },
      {
        id: 'middle-of-the-linked-list',
        title: 'Middle of the Linked List',
        url: 'https://leetcode.com/problems/middle-of-the-linked-list/',
        difficulty: 'Easy'
      },
      {
        id: 'merge-two-sorted-lists',
        title: 'Merge Two Sorted Lists',
        url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
        difficulty: 'Easy'
      },
      {
        id: 'remove-nth-node-from-end-of-list',
        title: 'Remove Nth Node From End of List',
        url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
        difficulty: 'Medium'
      },
      {
        id: 'reorder-list',
        title: 'Reorder List',
        url: 'https://leetcode.com/problems/reorder-list/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'trees-and-tries',
    name: 'Trees and Tries',
    iconName: 'Network',
    subtopics: [
      'DFS',
      'BFS / level-order traversal',
      'Preorder traversal',
      'Inorder traversal',
      'Postorder traversal',
      'Binary Search Trees',
      'Tree height and depth',
      'Lowest Common Ancestor',
      'Tree construction',
      'Trie insertion',
      'Prefix search',
      'Word search'
    ],
    problems: [
      {
        id: 'maximum-depth-of-binary-tree',
        title: 'Maximum Depth of Binary Tree',
        url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
        difficulty: 'Easy'
      },
      {
        id: 'invert-binary-tree',
        title: 'Invert Binary Tree',
        url: 'https://leetcode.com/problems/invert-binary-tree/',
        difficulty: 'Easy'
      },
      {
        id: 'binary-tree-level-order-traversal',
        title: 'Binary Tree Level Order Traversal',
        url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
        difficulty: 'Medium'
      },
      {
        id: 'validate-binary-search-tree',
        title: 'Validate Binary Search Tree',
        url: 'https://leetcode.com/problems/validate-binary-search-tree/',
        difficulty: 'Medium'
      },
      {
        id: 'lowest-common-ancestor-of-a-binary-search-tree',
        title: 'Lowest Common Ancestor of a BST',
        url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
        difficulty: 'Medium'
      },
      {
        id: 'diameter-of-binary-tree',
        title: 'Diameter of Binary Tree',
        url: 'https://leetcode.com/problems/diameter-of-binary-tree/',
        difficulty: 'Easy'
      },
      {
        id: 'implement-trie-prefix-tree',
        title: 'Implement Trie (Prefix Tree)',
        url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
        difficulty: 'Medium'
      },
      {
        id: 'word-search-ii',
        title: 'Word Search II',
        url: 'https://leetcode.com/problems/word-search-ii/',
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'stacks-and-queues',
    name: 'Stacks and Queues',
    iconName: 'Layers',
    subtopics: [
      'Stack operations',
      'Queue operations',
      'Monotonic stack',
      'Parentheses matching',
      'Expression evaluation',
      'BFS queues',
      'Min/max tracking'
    ],
    problems: [
      {
        id: 'valid-parentheses',
        title: 'Valid Parentheses',
        url: 'https://leetcode.com/problems/valid-parentheses/',
        difficulty: 'Easy'
      },
      {
        id: 'min-stack',
        title: 'Min Stack',
        url: 'https://leetcode.com/problems/min-stack/',
        difficulty: 'Medium'
      },
      {
        id: 'evaluate-reverse-polish-notation',
        title: 'Evaluate Reverse Polish Notation',
        url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/',
        difficulty: 'Medium'
      },
      {
        id: 'daily-temperatures',
        title: 'Daily Temperatures',
        url: 'https://leetcode.com/problems/daily-temperatures/',
        difficulty: 'Medium'
      },
      {
        id: 'largest-rectangle-in-histogram',
        title: 'Largest Rectangle in Histogram',
        url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/',
        difficulty: 'Hard'
      },
      {
        id: 'implement-queue-using-stacks',
        title: 'Implement Queue Using Stacks',
        url: 'https://leetcode.com/problems/implement-queue-using-stacks/',
        difficulty: 'Easy'
      }
    ]
  },
  {
    id: 'graphs',
    name: 'Graphs',
    iconName: 'Share2',
    subtopics: [
      'Graph representation',
      'Adjacency lists',
      'BFS',
      'DFS',
      'Connected components',
      'Cycle detection',
      'Topological sort',
      'Shortest path',
      'Multi-source BFS',
      'Union Find',
      "Dijkstra's Algorithm"
    ],
    problems: [
      {
        id: 'number-of-islands',
        title: 'Number of Islands',
        url: 'https://leetcode.com/problems/number-of-islands/',
        difficulty: 'Medium'
      },
      {
        id: 'clone-graph',
        title: 'Clone Graph',
        url: 'https://leetcode.com/problems/clone-graph/',
        difficulty: 'Medium'
      },
      {
        id: 'course-schedule',
        title: 'Course Schedule',
        url: 'https://leetcode.com/problems/course-schedule/',
        difficulty: 'Medium'
      },
      {
        id: 'rotting-oranges',
        title: 'Rotting Oranges',
        url: 'https://leetcode.com/problems/rotting-oranges/',
        difficulty: 'Medium'
      },
      {
        id: 'pacific-atlantic-water-flow',
        title: 'Pacific Atlantic Water Flow',
        url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/',
        difficulty: 'Medium'
      },
      {
        id: 'network-delay-time',
        title: 'Network Delay Time',
        url: 'https://leetcode.com/problems/network-delay-time/',
        difficulty: 'Medium'
      },
      {
        id: 'redundant-connection',
        title: 'Redundant Connection',
        url: 'https://leetcode.com/problems/redundant-connection/',
        difficulty: 'Medium'
      },
      {
        id: 'word-ladder',
        title: 'Word Ladder',
        url: 'https://leetcode.com/problems/word-ladder/',
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'dp-and-recursion',
    name: 'Dynamic Programming & Recursion',
    iconName: 'Boxes',
    subtopics: [
      'Base cases',
      'Recursive calls',
      'Backtracking',
      'Subsets',
      'Permutations',
      'Combinations',
      'Memoization',
      'Tabulation',
      '1D DP',
      '2D DP',
      'Knapsack',
      'Subsequences',
      'State transitions'
    ],
    problems: [
      {
        id: 'climbing-stairs',
        title: 'Climbing Stairs',
        url: 'https://leetcode.com/problems/climbing-stairs/',
        difficulty: 'Easy'
      },
      {
        id: 'house-robber',
        title: 'House Robber',
        url: 'https://leetcode.com/problems/house-robber/',
        difficulty: 'Medium'
      },
      {
        id: 'coin-change',
        title: 'Coin Change',
        url: 'https://leetcode.com/problems/coin-change/',
        difficulty: 'Medium'
      },
      {
        id: 'longest-increasing-subsequence',
        title: 'Longest Increasing Subsequence',
        url: 'https://leetcode.com/problems/longest-increasing-subsequence/',
        difficulty: 'Medium'
      },
      {
        id: 'longest-common-subsequence',
        title: 'Longest Common Subsequence',
        url: 'https://leetcode.com/problems/longest-common-subsequence/',
        difficulty: 'Medium'
      },
      {
        id: 'unique-paths',
        title: 'Unique Paths',
        url: 'https://leetcode.com/problems/unique-paths/',
        difficulty: 'Medium'
      },
      {
        id: 'subsets',
        title: 'Subsets',
        url: 'https://leetcode.com/problems/subsets/',
        difficulty: 'Medium'
      },
      {
        id: 'permutations',
        title: 'Permutations',
        url: 'https://leetcode.com/problems/permutations/',
        difficulty: 'Medium'
      },
      {
        id: 'combination-sum',
        title: 'Combination Sum',
        url: 'https://leetcode.com/problems/combination-sum/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'heaps',
    name: 'Heaps & Priority Queues',
    iconName: 'Cpu',
    subtopics: [
      'Min heap',
      'Max heap',
      'Top K elements',
      'Kth largest / smallest',
      'Running median',
      'Merging sorted data',
      'Two-heap pattern'
    ],
    problems: [
      {
        id: 'kth-largest-element-in-an-array',
        title: 'Kth Largest Element in an Array',
        url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
        difficulty: 'Medium'
      },
      {
        id: 'top-k-frequent-elements',
        title: 'Top K Frequent Elements',
        url: 'https://leetcode.com/problems/top-k-frequent-elements/',
        difficulty: 'Medium'
      },
      {
        id: 'k-closest-points-to-origin',
        title: 'K Closest Points to Origin',
        url: 'https://leetcode.com/problems/k-closest-points-to-origin/',
        difficulty: 'Medium'
      },
      {
        id: 'merge-k-sorted-lists',
        title: 'Merge K Sorted Lists',
        url: 'https://leetcode.com/problems/merge-k-sorted-lists/',
        difficulty: 'Hard'
      },
      {
        id: 'find-median-from-data-stream',
        title: 'Find Median from Data Stream',
        url: 'https://leetcode.com/problems/find-median-from-data-stream/',
        difficulty: 'Hard'
      },
      {
        id: 'task-scheduler',
        title: 'Task Scheduler',
        url: 'https://leetcode.com/problems/task-scheduler/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'hashing',
    name: 'Hashing',
    iconName: 'Hash',
    subtopics: [
      'HashMaps',
      'HashSets',
      'Frequency counting',
      'Duplicate detection',
      'Value-to-index mapping',
      'Grouping',
      'Prefix sum + hashmap',
      'Caching previously seen values'
    ],
    problems: [
      {
        id: 'two-sum-hash',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy'
      },
      {
        id: 'contains-duplicate',
        title: 'Contains Duplicate',
        url: 'https://leetcode.com/problems/contains-duplicate/',
        difficulty: 'Easy'
      },
      {
        id: 'valid-anagram-hash',
        title: 'Valid Anagram',
        url: 'https://leetcode.com/problems/valid-anagram/',
        difficulty: 'Easy'
      },
      {
        id: 'group-anagrams-hash',
        title: 'Group Anagrams',
        url: 'https://leetcode.com/problems/group-anagrams/',
        difficulty: 'Medium'
      },
      {
        id: 'longest-consecutive-sequence',
        title: 'Longest Consecutive Sequence',
        url: 'https://leetcode.com/problems/longest-consecutive-sequence/',
        difficulty: 'Medium'
      },
      {
        id: 'subarray-sum-equals-k-hash',
        title: 'Subarray Sum Equals K',
        url: 'https://leetcode.com/problems/subarray-sum-equals-k/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    iconName: 'Binary',
    subtopics: [
      'AND',
      'OR',
      'XOR',
      'NOT',
      'Left shift',
      'Right shift',
      'Checking bits',
      'Setting bits',
      'Clearing bits',
      'XOR cancellation',
      'Counting set bits'
    ],
    problems: [
      {
        id: 'single-number',
        title: 'Single Number',
        url: 'https://leetcode.com/problems/single-number/',
        difficulty: 'Easy'
      },
      {
        id: 'number-of-1-bits',
        title: 'Number of 1 Bits',
        url: 'https://leetcode.com/problems/number-of-1-bits/',
        difficulty: 'Easy'
      },
      {
        id: 'counting-bits',
        title: 'Counting Bits',
        url: 'https://leetcode.com/problems/counting-bits/',
        difficulty: 'Easy'
      },
      {
        id: 'reverse-bits',
        title: 'Reverse Bits',
        url: 'https://leetcode.com/problems/reverse-bits/',
        difficulty: 'Easy'
      },
      {
        id: 'missing-number',
        title: 'Missing Number',
        url: 'https://leetcode.com/problems/missing-number/',
        difficulty: 'Easy'
      },
      {
        id: 'sum-of-two-integers',
        title: 'Sum of Two Integers',
        url: 'https://leetcode.com/problems/sum-of-two-integers/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'sorting',
    name: 'Sorting',
    iconName: 'ArrowDownUp',
    subtopics: [
      'Bubble Sort',
      'Selection Sort',
      'Insertion Sort',
      'Merge Sort',
      'Quick Sort',
      'Counting Sort',
      'Bucket Sort',
      'Custom comparators',
      'Interval sorting'
    ],
    problems: [
      {
        id: 'sort-an-array',
        title: 'Sort an Array',
        url: 'https://leetcode.com/problems/sort-an-array/',
        difficulty: 'Medium'
      },
      {
        id: 'merge-intervals',
        title: 'Merge Intervals',
        url: 'https://leetcode.com/problems/merge-intervals/',
        difficulty: 'Medium'
      },
      {
        id: 'insert-interval',
        title: 'Insert Interval',
        url: 'https://leetcode.com/problems/insert-interval/',
        difficulty: 'Medium'
      },
      {
        id: 'meeting-rooms-ii',
        title: 'Meeting Rooms II',
        url: 'https://leetcode.com/problems/meeting-rooms-ii/',
        difficulty: 'Medium'
      },
      {
        id: 'largest-number',
        title: 'Largest Number',
        url: 'https://leetcode.com/problems/largest-number/',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'searching',
    name: 'Searching & Binary Search',
    iconName: 'Search',
    subtopics: [
      'Linear search',
      'Binary search',
      'Binary search on sorted arrays',
      'Binary search on answer',
      'Rotated arrays',
      'Lower bound',
      'Upper bound',
      'Matrix search'
    ],
    problems: [
      {
        id: 'binary-search',
        title: 'Binary Search',
        url: 'https://leetcode.com/problems/binary-search/',
        difficulty: 'Easy'
      },
      {
        id: 'search-in-rotated-sorted-array',
        title: 'Search in Rotated Sorted Array',
        url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
        difficulty: 'Medium'
      },
      {
        id: 'find-minimum-in-rotated-sorted-array',
        title: 'Find Minimum in Rotated Sorted Array',
        url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
        difficulty: 'Medium'
      },
      {
        id: 'search-a-2d-matrix',
        title: 'Search a 2D Matrix',
        url: 'https://leetcode.com/problems/search-a-2d-matrix/',
        difficulty: 'Medium'
      },
      {
        id: 'koko-eating-bananas',
        title: 'Koko Eating Bananas',
        url: 'https://leetcode.com/problems/koko-eating-bananas/',
        difficulty: 'Medium'
      },
      {
        id: 'find-first-and-last-position-of-element-in-sorted-array',
        title: 'First & Last Position in Sorted Array',
        url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
        difficulty: 'Medium'
      }
    ]
  }
];

