if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Importing required modules
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const session = require('express-session');
const jwt = require('jsonwebtoken');
const RefreshToken = require('./models/RefreshToken');
const flash = require('express-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const sequelize = require('./config/database'); // MySQL connection
const { User } = require('./models');
const jwtMiddleware = require('./middleware/jwtMiddleware');
const initializePassport = require('./config/passport');

const PORT = process.env.PORT || 3000;

// Initialize Passport strategies
initializePassport(
  passport,
  async email => await User.findOne({ where: { email } }),
  async id => await User.findByPk(id)
);

const app = express();

// View Engine
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use('/', router); // assuming this is part of your view-rendering server

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public')); // ✅ allows /js/dashboard.js to be served

app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// JWT middleware for API
app.use('/api', jwtMiddleware);
// Auth Routes
app.use('/auth', require('./routes/auth'));

// Sync and Authenticate Database
sequelize.sync()
  .then(() => console.log('✅ All models synced successfully.'))
  .catch(err => console.error('❌ Error syncing models:', err));

sequelize.authenticate()
  .then(() => console.log('✅ Database connected.'))
  .catch(err => console.error('❌ Database connection error:', err));

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register');
});

// POST /register
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const { name, email, cemail, password } = req.body;

    if (email !== cemail) {
      return res.status(400).send("Emails do not match.");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = crypto.randomBytes(20).toString('hex');

    await User.create({
      name,
      email,
      password: hashedPassword,
      isConfirmed: false,
      confirmationToken,
    });

    res.redirect('/login');
  } catch (err) {
    console.error('Registration error', err);
    res.redirect('/register');
  }
});

// POST /login — Use only one strategy
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

// DELETE /logout
app.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/login');
    console.log('✅ Logged out');
  });
});

// Middleware helpers
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Views & Auth Pages
app.get('/dashboard', (req, res) => {
  res.render('dashboard'); // assuming dashboard.ejs is in views/
});
app.get('/profile', (req, res) => {
  res.render('profile'); // assuming profile.ejs is in views/
});
app.get('/sittings', (req, res) => {
  res.render('sittings'); // assuming sittings.ejs is in views/
});
app.get('/submit/personal_info', (req, res) => {
  res.render('personal'); // assuming personal.ejs is in views/
});

app.get('/submit/upload/document', (req, res) => {
  res.render('document'); // assuming document.ejs is in views/
});
app.get('/submit/upload/selfie', (req, res) => {
  res.render('selfie'); // assuming selfie.ejs is in views/
});
app.get('/selfie/success', (req, res) => {
  res.render('success');
});

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/');
  next();
}

// Start Server on port PORT
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
