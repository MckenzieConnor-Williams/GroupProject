const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    default: undefined
  },
  correctIndex: {
    type: Number,
    default: undefined
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

flashcardSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
