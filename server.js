require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Flashcard = require('./models/Flashcard');

const app = express();
const PORT = process.env.PORT || 3000;
let lastMongoError = '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function ensureDatabaseAvailable(res) {
  if (!process.env.MONGO_URI) {
    res.status(503).json({ message: 'Database is not configured. Set MONGO_URI in .env.' });
    return false;
  }

  if (!isMongoReady()) {
    const reason = lastMongoError ? ` Last error: ${lastMongoError}` : '';
    res.status(503).json({ message: `Database is unavailable. Start MongoDB and try again.${reason}` });
    return false;
  }

  return true;
}

function getMongoStateLabel() {
  const state = mongoose.connection.readyState;
  if (state === 0) return 'disconnected';
  if (state === 1) return 'connected';
  if (state === 2) return 'connecting';
  if (state === 3) return 'disconnecting';
  return 'unknown';
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/question_page', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'question_page'));
});

app.get('/question_answer', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'question_answer.html'));
});

app.get('/flashcards', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'flashcards.html'));
});

app.use(express.static(path.join(__dirname)));

mongoose.connection.on('error', (err) => {
  lastMongoError = err && err.message ? err.message : String(err);
  console.error('MongoDB connection error:', lastMongoError);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

app.get('/api/health/db', (req, res) => {
  res.status(200).json({
    hasMongoUri: Boolean(process.env.MONGO_URI),
    mongoState: getMongoStateLabel(),
    mongoReadyState: mongoose.connection.readyState,
    lastMongoError: lastMongoError || null
  });
});

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
        createdAt: item.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while loading flashcards' });
  }
});

app.post('/api/flashcards', async (req, res) => {
  try {
    if (!ensureDatabaseAvailable(res)) return;

    const userEmail = String(req.body.userEmail || '').trim().toLowerCase();
    const question = String(req.body.question || '').trim();
    const answer = String(req.body.answer || '').trim();

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const flashcard = await Flashcard.create({ userEmail, question, answer });
    return res.status(201).json({
      message: 'Flashcard created',
      flashcard: {
        id: String(flashcard._id),
        question: flashcard.question,
        answer: flashcard.answer,
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
    const answer = String(req.body.answer || '').trim();

    if (!id) {
      return res.status(400).json({ message: 'Flashcard id is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: id, userEmail },
      { question, answer },
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

async function startServer() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB Connected');
    } catch (err) {
      lastMongoError = err && err.message ? err.message : String(err);
      console.error('Failed to connect to MongoDB on startup:', lastMongoError);
      process.exit(1);
    }
  } else {
    console.warn('MONGO_URI is not set. Running without MongoDB connection.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
