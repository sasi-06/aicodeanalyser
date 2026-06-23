const Question = require('../models/Question');

// GET /api/questions
const getQuestions = async (req, res) => {
  try {
    const { difficulty, tag, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;
    
    // Full-text search by title, description, or tags
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    
    const skip = (page - 1) * limit;
    const questions = await Question.find(filter)
      .select('-testCases')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Question.countDocuments(filter);
    
    res.json({
      questions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/questions/:id
const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    // Hide expected output for hidden test cases
    const safeQuestion = question.toObject();
    safeQuestion.testCases = safeQuestion.testCases.map(tc => tc.isHidden ? { ...tc, expectedOutput: '***' } : tc);
    res.json(safeQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/questions (recruiter/admin only)
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/questions/:id (update question)
const updateQuestion = async (req, res) => {
  try {
    const { title, description, difficulty, tags, examples, testCases, starterCode, timeLimit, memoryLimit, languagesSupported } = req.body;
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Only creator can update
    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this question' });
    }
    
    if (title) question.title = title;
    if (description) question.description = description;
    if (difficulty) question.difficulty = difficulty;
    if (tags) question.tags = tags;
    if (examples) question.examples = examples;
    if (testCases) question.testCases = testCases;
    if (starterCode) question.starterCode = { ...question.starterCode, ...starterCode };
    if (timeLimit) question.timeLimit = timeLimit;
    if (memoryLimit) question.memoryLimit = memoryLimit;
    if (languagesSupported) question.languagesSupported = languagesSupported;
    
    await question.save();
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion };
