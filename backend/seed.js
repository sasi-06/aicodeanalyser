require('dotenv').config();
const connectDB = require('./config/db');
const Question = require('./models/Question');
const User = require('./models/User');

const seed = async () => {
  await connectDB();

  // Seed recruiter
  const existing = await User.findOne({ email: 'recruiter@demo.com' });
  if (!existing) {
    await User.create({ name: 'Demo Recruiter', email: 'recruiter@demo.com', password: 'password123', role: 'recruiter' });
    console.log('✅ Recruiter seeded: recruiter@demo.com / password123');
  }

  // Seed candidate
  const candidate = await User.findOne({ email: 'candidate@demo.com' });
  if (!candidate) {
    await User.create({ name: 'Demo Candidate', email: 'candidate@demo.com', password: 'password123', role: 'candidate' });
    console.log('✅ Candidate seeded: candidate@demo.com / password123');
  }

  // Seed questions
  const qCount = await Question.countDocuments();
  if (qCount === 0) {
    await Question.insertMany([
      {
        title: 'Two Sum',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer in any order.`,
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] == 6' },
        ],
        testCases: [
          { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
          { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: true },
        ],
        starterCode: {
          python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass\n',
          javascript: 'function twoSum(nums, target) {\n    // Write your solution here\n}\n',
          java: 'import java.util.*;\npublic class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n',
          cpp: '#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}\n',
        },
        timeLimit: 30,
      },
      {
        title: 'Reverse a String',
        description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.`,
        difficulty: 'Easy',
        tags: ['String', 'Two Pointers'],
        examples: [
          { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
        ],
        testCases: [
          { input: 'hello', expectedOutput: 'olleh', isHidden: false },
          { input: 'Hannah', expectedOutput: 'hannaH', isHidden: true },
        ],
        starterCode: {
          python: 'def reverse_string(s):\n    # Write your solution here\n    pass\n\ns = input()\nprint(reverse_string(list(s)))\n',
          javascript: 'const s = require("readline").createInterface({input:process.stdin});\n// Write your solution here\n',
          java: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        // Write your solution here\n    }\n}\n',
          cpp: '#include<iostream>\n#include<algorithm>\nusing namespace std;\nint main(){\n    string s;\n    cin >> s;\n    // Write your solution here\n    return 0;\n}\n',
        },
        timeLimit: 20,
      },
      {
        title: 'FizzBuzz',
        description: `Given an integer n, return a string array answer (1-indexed) where:\n\n- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.\n- answer[i] == "Fizz" if i is divisible by 3.\n- answer[i] == "Buzz" if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.`,
        difficulty: 'Easy',
        tags: ['Math', 'String'],
        examples: [
          { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
        ],
        testCases: [
          { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: false },
          { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: true },
        ],
        starterCode: {
          python: 'n = int(input())\nfor i in range(1, n+1):\n    # Write your solution here\n    pass\n',
          javascript: 'const n = parseInt(require("fs").readFileSync("/dev/stdin","utf8").trim());\nfor(let i=1;i<=n;i++){\n    // Write your solution here\n}\n',
          java: 'import java.util.*;\npublic class Solution{\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt();\n        for(int i=1;i<=n;i++){\n            // Write your solution here\n        }\n    }\n}\n',
          cpp: '#include<iostream>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    for(int i=1;i<=n;i++){\n        // Write your solution here\n    }\n    return 0;\n}\n',
        },
        timeLimit: 20,
      },
      {
        title: 'Fibonacci Number',
        description: `The Fibonacci numbers, commonly denoted F(n) form a sequence called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\n\nGiven n, calculate F(n).`,
        difficulty: 'Medium',
        tags: ['Math', 'Dynamic Programming', 'Recursion'],
        examples: [
          { input: 'n = 4', output: '3', explanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3' },
          { input: 'n = 10', output: '55' },
        ],
        testCases: [
          { input: '4', expectedOutput: '3', isHidden: false },
          { input: '10', expectedOutput: '55', isHidden: false },
          { input: '20', expectedOutput: '6765', isHidden: true },
        ],
        starterCode: {
          python: 'n = int(input())\n# Write your solution here\n',
          javascript: 'const n = parseInt(require("fs").readFileSync("/dev/stdin","utf8").trim());\n// Write your solution here\n',
          java: 'import java.util.*;\npublic class Solution{\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt();\n        // Write your solution here\n    }\n}\n',
          cpp: '#include<iostream>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    // Write your solution here\n    return 0;\n}\n',
        },
        timeLimit: 30,
      },
      {
        title: 'Valid Parentheses',
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.`,
        difficulty: 'Medium',
        tags: ['Stack', 'String'],
        examples: [
          { input: 's = "()"', output: 'true' },
          { input: 's = "()[]{}"', output: 'true' },
          { input: 's = "(]"', output: 'false' },
        ],
        testCases: [
          { input: '()', expectedOutput: 'true', isHidden: false },
          { input: '()[{}]', expectedOutput: 'true', isHidden: false },
          { input: '(]', expectedOutput: 'false', isHidden: true },
          { input: '{[]}', expectedOutput: 'true', isHidden: true },
        ],
        starterCode: {
          python: 's = input()\n# Write your solution here\n',
          javascript: 'const s = require("fs").readFileSync("/dev/stdin","utf8").trim();\n// Write your solution here\n',
          java: 'import java.util.*;\npublic class Solution{\n    public static void main(String[] args){\n        Scanner sc=new Scanner(System.in);\n        String s=sc.next();\n        // Write your solution here\n    }\n}\n',
          cpp: '#include<iostream>\n#include<stack>\nusing namespace std;\nint main(){\n    string s; cin>>s;\n    // Write your solution here\n    return 0;\n}\n',
        },
        timeLimit: 30,
      },
    ]);
    console.log('✅ 5 questions seeded');
  }

  console.log('🌱 Seeding complete!');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
