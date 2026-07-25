// routes/admin.js
// Everything behind the login wall:
// GET  /admin/login              login form
// POST /admin/login              authenticate (passport local strategy)
// POST /admin/logout             end the session
// GET  /admin                    dashboard: search + list leads
// PATCH /admin/api/leads/:id/status   change a lead's status (called via fetch, returns JSON)

const express = require('express');
const passport = require('passport');
const Lead = require('../models/Lead');
const ensureAuth = require('../middleware/ensureAuth');

const router = express.Router();

// --- Login ---------------------------------------------------------------

router.get('/login', (req, res) => {
  // If already logged in, no reason to show the login form again.
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, admin, info) => {
    if (err) return next(err);
    if (!admin) {
      // info.message comes from the LocalStrategy's done(null, false, {message}) call.
      return res.status(401).render('admin/login', {
        error: info && info.message ? info.message : 'Login failed',
      });
    }
    req.logIn(admin, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect('/admin');
    });
  })(req, res, next);
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/admin/login');
  });
});

// --- Dashboard -------------------------------------------------------------

// GET /admin - protected by ensureAuth on every route below this line.
router.use(ensureAuth);

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();

    // Search matches name OR email, case-insensitive, using a MongoDB
    // regex rather than pulling every lead into memory and filtering in
    // JS - this is a search feature, not a display transform, so it
    // belongs in the query.
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();

    res.render('admin/dashboard', {
      leads,
      q,
      statuses: Lead.STATUSES,
      adminEmail: req.user.email,
    });
  } catch (err) {
    next(err);
  }
});

// --- Status toggle -----------------------------------------------------

// PATCH /admin/api/leads/:id/status
// A small JSON API endpoint rather than a full page reload/redirect, so the
// dashboard can update a badge in place (see public/js/admin.js).
router.patch('/api/leads/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!Lead.STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${Lead.STATUSES.join(', ')}` });
  }

  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).lean();

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  return res.json({ id: lead._id, status: lead.status });
});

module.exports = router;
