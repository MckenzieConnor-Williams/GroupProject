require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/question_page', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'question_page'));
});

app.get('/question_answer', (req, res) => {
  res.type('html');
  res.sendFile(path.join(__dirname, 'question_answer'));
});

app.use(express.static(path.join(__dirname)));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.post('/api/signup', async (req, res) => {
  try {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
