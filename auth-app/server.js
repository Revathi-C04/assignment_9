require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const isProd = process.env.NODE_ENV === 'production';

if (!MONGODB_URI || !SESSION_SECRET) {
  console.error('Missing MONGODB_URI or SESSION_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();

// View engine + static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing (for the HTML forms)
app.use(express.urlencoded({ extended: false }));

if (isProd) app.set('trust proxy', 1);

// Sessions stored in MongoDB so they survive server restarts
app.use(
  session({
    name: 'connect.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: 'sessions' }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);

// Make flash message + login state available to every template
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.currentUser = req.session.userId ? { username: req.session.username } : null;
  res.locals.error = null;
  next();
});

app.use('/', authRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not found' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
