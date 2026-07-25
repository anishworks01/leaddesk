// routes/leads.js
// Everything a member of the public can hit without logging in:
// GET  /            the landing page with the intake form
// POST /leads        create a new lead (server-side validated)

const express = require('express');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');

const router = express.Router();

// Validation chain shared by the POST route. Kept as a named array (rather
// than inline in router.post) so it's easy to see every rule at a glance.
const leadValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name is too long'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('budgetRange')
    .notEmpty()
    .withMessage('Choose a budget range')
    .isIn(Lead.BUDGET_RANGES)
    .withMessage('Choose one of the listed budget ranges'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message is too long (max 2000 characters)'),
];

// GET / - the landing page.
// `values` and `errors` are passed in so the same template can render
// either a fresh form or one that's re-showing what the visitor typed
// alongside inline error messages (see the POST handler below).
router.get('/', (req, res) => {
  res.render('index', {
    values: { name: '', email: '', budgetRange: '', message: '' },
    errors: {},
    submitted: false,
  });
});

// POST /leads - create a lead.
// Deliberately re-renders the same landing page on a validation failure
// instead of redirecting, so the visitor doesn't have to re-type
// everything - only fix the flagged fields.
router.post('/leads', leadValidation, async (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    // Turn express-validator's array of errors into a { fieldName: message }
    // map, which is far easier for the EJS template to check per-field.
    const errors = {};
    result.array().forEach((err) => {
      if (!errors[err.path]) errors[err.path] = err.msg;
    });

    return res.status(400).render('index', {
      values: req.body,
      errors,
      submitted: false,
    });
  }

  try {
    await Lead.create({
      name: req.body.name,
      email: req.body.email,
      budgetRange: req.body.budgetRange,
      message: req.body.message,
    });

    // Render a success state on the same page rather than a separate
    // "/thanks" route - one less page to build and it keeps the confirmation
    // in context.
    return res.render('index', {
      values: { name: '', email: '', budgetRange: '', message: '' },
      errors: {},
      submitted: true,
    });
  } catch (err) {
    // A Mongoose validation error (e.g. someone bypassed the browser and
    // POSTed an invalid budgetRange directly) falls through to here.
    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach((field) => {
        errors[field] = err.errors[field].message;
      });
      return res.status(400).render('index', {
        values: req.body,
        errors,
        submitted: false,
      });
    }
    // Anything unexpected (e.g. DB temporarily unreachable) goes to the
    // central error handler in server.js instead of crashing the process.
    return next(err);
  }
});

module.exports = router;
