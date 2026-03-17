require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/collections/User');
const Flashcard = require('./models/collections/Flashcard');
const FreeAnswerAttempt = require('./models/collections/FreeAnswerAttempt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return null;
  const trimmed = rawOptions.map((opt) => String(opt || '').trim());
  if (trimmed.length !== 4) return null;
  if (trimmed.some((opt) => !opt)) return null;
  return trimmed;
}

function normalizeCorrectIndex(rawIndex) {
  const parsed = Number(rawIndex);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 0 || parsed > 3) return null;
  return parsed;
}

function ensureDatabaseAvailable(res) {
  if (!process.env.MONGO_URI) {
    res.status(503).json({ message: 'Database is not configured. Set MONGO_URI in .env.' });
    return false;
  }

  if (!isMongoReady()) {
    res.status(503).json({ message: 'Database is unavailable. Start MongoDB and try again.' });
    return false;
  }

  return true;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/question_page', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'question_page'));
});

app.get('/quiz_builder', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'quiz_builder.html'));
});

app.get('/question_answer', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'question_answer.html'));
});

app.get('/short_answer', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'short_answer.html'));
});

app.get('/free_answer', (req, res) => {
  res.redirect(302, '/short_answer');
});

app.get('/short_answer_history', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'short_answer_history.html'));
});

app.get('/free_answer_history', (req, res) => {
  res.redirect(302, '/short_answer_history');
});

app.get('/flashcards', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'flashcards.html'));
});

app.use(express.static(path.join(__dirname)));

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));
} else {
  console.warn('MONGO_URI is not set. Running without MongoDB connection.');
}

app.post('/api/signup', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const name = (req.body.name || email.split('@')[0] || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    await User.create({ name, email, password });
    return res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during signup' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/flashcards', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const flashcards = await Flashcard
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      flashcards: flashcards.map((item) => ({
        id: String(item._id),
        question: item.question,
        answer: item.answer,
        options: item.options,
        correctIndex: typeof item.correctIndex === 'number' ? item.correctIndex : undefined,
        createdAt: item.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while loading flashcards' });
  }
});

app.post('/api/short-answer/attempts', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const userEmail = String(req.body.userEmail || '').trim().toLowerCase();
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const providedScore = Number(req.body.score);
    const providedTotal = Number(req.body.total);

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (answers.length === 0) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    const sanitizedAnswers = [];
    for (const item of answers) {
      const flashcardId = String(item.flashcardId || '').trim();
      const question = String(item.question || '').trim();
      const correctAnswer = String(item.correctAnswer || '').trim();
      const userAnswer = String(item.userAnswer || '').trim();
      const isCorrect = Boolean(item.isCorrect);

      if (!flashcardId || !question || !correctAnswer || !userAnswer) {
        return res.status(400).json({ message: 'Each answer needs flashcardId, question, correctAnswer, and userAnswer' });
      }

      sanitizedAnswers.push({
        flashcardId,
        question,
        correctAnswer,
        userAnswer,
        isCorrect
      });
    }

    const total = Number.isInteger(providedTotal) && providedTotal > 0 ? providedTotal : sanitizedAnswers.length;
    const computedScore = sanitizedAnswers.reduce((sum, item) => sum + (item.isCorrect ? 1 : 0), 0);
    const score = Number.isInteger(providedScore) && providedScore >= 0 ? providedScore : computedScore;

    const attempt = await FreeAnswerAttempt.create({
      userEmail,
      score,
      total,
      answers: sanitizedAnswers
    });

    return res.status(201).json({
      message: 'Short-answer attempt saved',
      attempt: {
        id: String(attempt._id),
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while saving short-answer attempt' });
  }
app.post('/api/free-answer/attempts', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const userEmail = String(req.body.userEmail || '').trim().toLowerCase();
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const providedScore = Number(req.body.score);
    const providedTotal = Number(req.body.total);

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (answers.length === 0) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    const sanitizedAnswers = [];
    for (const item of answers) {
      const flashcardId = String(item.flashcardId || '').trim();
      const question = String(item.question || '').trim();
      const correctAnswer = String(item.correctAnswer || '').trim();
      const userAnswer = String(item.userAnswer || '').trim();
      const isCorrect = Boolean(item.isCorrect);

      if (!flashcardId || !question || !correctAnswer || !userAnswer) {
        return res.status(400).json({ message: 'Each answer needs flashcardId, question, correctAnswer, and userAnswer' });
      }

      sanitizedAnswers.push({
        flashcardId,
        question,
        correctAnswer,
        userAnswer,
        isCorrect
      });
    }

    const total = Number.isInteger(providedTotal) && providedTotal > 0 ? providedTotal : sanitizedAnswers.length;
    const computedScore = sanitizedAnswers.reduce((sum, item) => sum + (item.isCorrect ? 1 : 0), 0);
    const score = Number.isInteger(providedScore) && providedScore >= 0 ? providedScore : computedScore;

    const attempt = await FreeAnswerAttempt.create({
      userEmail,
      score,
      total,
      answers: sanitizedAnswers
    });

    return res.status(201).json({
      message: 'Short-answer attempt saved',
      attempt: {
        id: String(attempt._id),
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while saving short-answer attempt' });
  }


});

app.get('/api/short-answer/attempts', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const attempts = await FreeAnswerAttempt
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      attempts: attempts.map((attempt) => ({
        id: String(attempt._id),
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt,
        answers: attempt.answers || []
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while loading short-answer attempts' });
  }
app.get('/api/free-answer/attempts', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const attempts = await FreeAnswerAttempt
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      attempts: attempts.map((attempt) => ({
        id: String(attempt._id),
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt,
        answers: attempt.answers || []
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while loading short-answer attempts' });
  }


});

app.post('/api/flashcards', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const userEmail = String(req.body.userEmail || '').trim().toLowerCase();
    const question = String(req.body.question || '').trim();
    let answer = String(req.body.answer || '').trim();
    const normalizedOptions = normalizeOptions(req.body.options);
    const normalizedCorrectIndex = normalizeCorrectIndex(req.body.correctIndex);

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    if (normalizedOptions || normalizedCorrectIndex !== null) {
      if (!normalizedOptions || normalizedCorrectIndex === null) {
        return res.status(400).json({ message: 'Provide 4 options and a valid correct index (0-3)' });
      }
      answer = normalizedOptions[normalizedCorrectIndex];
    }

    if (!answer) {
      return res.status(400).json({ message: 'Answer is required' });
    }

    const flashcard = await Flashcard.create({
      userEmail,
      question,
      answer,
      options: normalizedOptions || undefined,
      correctIndex: normalizedCorrectIndex !== null ? normalizedCorrectIndex : undefined
    });
    return res.status(201).json({
      message: 'Flashcard created',
      flashcard: {
        id: String(flashcard._id),
        question: flashcard.question,
        answer: flashcard.answer,
        options: flashcard.options,
        correctIndex: typeof flashcard.correctIndex === 'number' ? flashcard.correctIndex : undefined,
        createdAt: flashcard.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while creating flashcard' });
  }
});

app.put('/api/flashcards/:id', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const id = String(req.params.id || '').trim();
    const userEmail = String(req.body.userEmail || '').trim().toLowerCase();
    const question = String(req.body.question || '').trim();
    let answer = String(req.body.answer || '').trim();
    const normalizedOptions = normalizeOptions(req.body.options);
    const normalizedCorrectIndex = normalizeCorrectIndex(req.body.correctIndex);

    if (!id) {
      return res.status(400).json({ message: 'Flashcard id is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    if (normalizedOptions || normalizedCorrectIndex !== null) {
      if (!normalizedOptions || normalizedCorrectIndex === null) {
        return res.status(400).json({ message: 'Provide 4 options and a valid correct index (0-3)' });
      }
      answer = normalizedOptions[normalizedCorrectIndex];
    }

    if (!answer) {
      return res.status(400).json({ message: 'Answer is required' });
    }

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: id, userEmail },
      {
        question,
        answer,
        options: normalizedOptions || undefined,
        correctIndex: normalizedCorrectIndex !== null ? normalizedCorrectIndex : undefined
      },
      { returnDocument: 'after' }
    );

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    return res.status(200).json({
      message: 'Flashcard updated',
      flashcard: {
        id: String(flashcard._id),
        question: flashcard.question,
        answer: flashcard.answer,
        options: flashcard.options,
        correctIndex: typeof flashcard.correctIndex === 'number' ? flashcard.correctIndex : undefined,
        createdAt: flashcard.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while updating flashcard' });
  }
});

app.delete('/api/flashcards/:id', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const id = String(req.params.id || '').trim();
    const userEmail = String(req.query.userEmail || '').trim().toLowerCase();

    if (!id) {
      return res.status(400).json({ message: 'Flashcard id is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const deleted = await Flashcard.findOneAndDelete({ _id: id, userEmail });
    if (!deleted) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    return res.status(200).json({ message: 'Flashcard deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while deleting flashcard' });
  }
});

app.post('/api/flashcards/seed', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const userEmail = String(req.body.userEmail || '').trim().toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const items = Array.isArray(req.body.questions) ? req.body.questions : [];
    if (items.length === 0) {
      return res.status(400).json({ message: 'Questions array is required' });
    }

    const prepared = [];
    for (const item of items) {
      const question = String(item.question || '').trim();
      const normalizedOptions = normalizeOptions(item.options);
      const normalizedCorrectIndex = normalizeCorrectIndex(item.correctIndex);
      if (!question || !normalizedOptions || normalizedCorrectIndex === null) {
        return res.status(400).json({ message: 'Each question needs text, 4 options, and a valid correct index' });
      }
      prepared.push({
        userEmail,
        question,
        options: normalizedOptions,
        correctIndex: normalizedCorrectIndex,
        answer: normalizedOptions[normalizedCorrectIndex]
      });
    }

    const inserted = await Flashcard.insertMany(prepared);
    return res.status(201).json({
      message: 'Seeded questions',
      count: inserted.length
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while seeding flashcards' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
