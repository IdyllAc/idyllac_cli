require('dotenv').config(); // Always first, to load .env

const env = process.env.NODE_ENV;              // "development" or "production"
const port = process.env.PORT || 3000;
const baseURL = process.env.BASE_URL;
const apiURL = process.env.API_URL;

console.log('Running in:', env);
console.log('Base URL:', baseURL);
console.log('API URL:', apiURL);


// Importing required modules
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const jwt = require('jsonwebtoken');
const RefreshToken = require('./models/RefreshToken');
const flash = require('express-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const sequelize = require('./config/database'); // MySQL connection
const { User } = require('./models');
const jwtMiddleware = require('./middleware/jwtMiddleware');
const publicRoutes = require('./routes/public'); // or user.js if that’s where you added it
const initializePassport = require('./config/passport');

const PORT = process.env.PORT || 3000;

// Initialize Passport strategies
initializePassport(
  passport,
  async email => await User.findOne({ where: { email } }),
  async id => await User.findByPk(id)
);

const app = express();

app.set('trust proxy', 1); // ⚠️ Required if behind Render's HTTPS proxy 

// ✅ MySQL session store setup
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// ✅ Use the session middleware with MySQL store
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: true,       // ⬅️ Must be true in production with HTTPS
    httpOnly: true,     // Prevents JS access to the cookie
    sameSite: 'lax'     // Helps prevent CSRF
  }
}));

// View Engine
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use('/', router); // assuming this is part of your view-rendering server
app.use('/', publicRoutes); // mount routes

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public')); // ✅ allows /js/dashboard.js to be served

app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // ✅ Use MySQL store here
  cookie: { secure: false } // use `true` if behind HTTPS + proxy
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// JWT middleware for API
app.use('/api', jwtMiddleware);
// Auth Routes
app.use('/', require('./routes/public'));      // register, login
app.use('/auth', require('./routes/auth')); // register/login POST
app.use('/user', require('./routes/user'));   // profile, settings, protected stuff


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
  console.log(`🚀 Server running at ${baseURL} on port ${port} (${env} mode)`);
});
