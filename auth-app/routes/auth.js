const express = require('express');
const User = require('../models/User');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

// ---------- Home ----------
router.get('/', (req, res) => {
  res.redirect(req.session.userId ? '/dashboard' : '/login');
});

// ---------- Register ----------
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', { title: 'Register', values: {} });
});

router.post('/register', redirectIfAuthenticated, async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const { password = '', confirmPassword = '' } = req.body;

  const renderError = (message) =>
    res.status(400).render('register', { title: 'Register', error: message, values: { username } });

  if (!username || !password) return renderError('Username and password are required.');
  if (password.length < 8) return renderError('Password must be at least 8 characters long.');
  if (password !== confirmPassword) return renderError('Passwords do not match.');

  try {
    const existing = await User.findOne({ username });
    if (existing) return renderError('That username is already taken.');

    await User.create({ username, password }); // password is hashed in the model's pre-save hook

    req.session.flash = { type: 'success', message: 'Account created. You can now log in.' };
    res.redirect('/login');
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return renderError(first.message);
    }
    if (err.code === 11000) return renderError('That username is already taken.');
    console.error('Register error:', err);
    return renderError('Something went wrong. Please try again.');
  }
});

// ---------- Login ----------
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { title: 'Login', values: {} });
});

router.post('/login', redirectIfAuthenticated, async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const password = req.body.password || '';

  const renderError = (message, status = 401) =>
    res.status(status).render('login', { title: 'Login', error: message, values: { username } });

  if (!username || !password) return renderError('Please enter both username and password.', 400);

  try {
    const user = await User.findOne({ username });
    if (!user) return renderError('Invalid username.');

    const ok = await user.comparePassword(password);
    if (!ok) return renderError('Incorrect password.');

    // Regenerate the session on login to prevent session fixation.
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err);
        return renderError('Could not start a session. Please try again.', 500);
      }
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return renderError('Could not start a session. Please try again.', 500);
        }
        res.redirect('/dashboard');
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    return renderError('Something went wrong. Please try again.', 500);
  }
});

// ---------- Dashboard (protected) ----------
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return req.session.regenerate(() => {
        req.session.flash = { type: 'error', message: 'Your account no longer exists.' };
        res.redirect('/login');
      });
    }
    res.render('dashboard', { title: 'Dashboard', user });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Something went wrong.');
  }
});

// ---------- Logout ----------
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
