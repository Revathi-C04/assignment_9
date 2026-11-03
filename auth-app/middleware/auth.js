// Allow only logged-in users.
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  req.session.flash = { type: 'error', message: 'Please log in to continue.' };
  return res.redirect('/login');
}

// Keep logged-in users away from the login / register pages.
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return res.redirect('/dashboard');
  return next();
}

module.exports = { requireAuth, redirectIfAuthenticated };
