const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  tags: [{ type: String }],
  languagesSupported: {
    type: [{ type: String, enum: ['python', 'javascript', 'java', 'cpp'] }],
    default: ['python', 'javascript', 'java', 'cpp'],
  },
  examples: [
    {
      input: String,
      output: String,
      explanation: String,
    },
  ],
  testCases: [
    {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true },
      isHidden: { type: Boolean, default: false },
    },
  ],
  starterCode: {
    python: { type: String, default: '# Write your solution here\n' },
    javascript: { type: String, default: '// Write your solution here\n' },
    java: { type: String, default: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n' },
    cpp: { type: String, default: '#include <iostream>\nusing namespace std;\nint main() {\n    // Write your solution here\n    return 0;\n}\n' },
  },
  timeLimit: { type: Number, default: 30 }, // minutes
  memoryLimit: { type: Number, default: 256 }, // MB
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Question', questionSchema);
