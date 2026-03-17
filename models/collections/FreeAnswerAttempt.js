const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  flashcardId: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  userAnswer: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

const freeAnswerAttemptSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  answers: {
    type: [answerSchema],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

freeAnswerAttemptSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model('FreeAnswerAttempt', freeAnswerAttemptSchema);
