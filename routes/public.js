// routes/public.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/jwtMiddleware'); // ✅ Correct: import as a function

// GET /register - serve register page
router.get('/register', (req, res) => {
  res.render('register'); // assumes views/register.ejs exists
});

// GET /login - serve login page
router.get('/login', (req, res) => {
  res.render('login'); // assumes views/login.ejs exists
});

module.exports = router;
