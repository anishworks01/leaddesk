// middleware/ensureAuth.js
// Guards every /admin route except the login page itself. This is what
// makes "real login, not a hardcoded string" actually mean something -
// without this, /admin would be reachable by anyone who guesses the URL.

module.exports = function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Not logged in - send them to the login page instead of a bare 401,
  // this is an admin dashboard for a human, not a JSON API.
  return res.redirect('/admin/login');
};
