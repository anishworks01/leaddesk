// models/Lead.js
// One document per form submission on the public landing page.
// Design decision: status is an enum with a fixed set of values rather than
// a free-text string, so the admin UI can render it as a predictable badge
// and the /admin search/filter logic never has to deal with typos like
// "contacted" vs "Contacted".

const mongoose = require('mongoose');

const BUDGET_RANGES = ['Under $1k', '$1k - $5k', '$5k - $20k', '$20k+'];
const STATUSES = ['New', 'Contacted', 'Closed'];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      // Simple, readable email check. Deliberately not a giant regex that
      // tries to be RFC-5322 perfect - this is validated again by
      // express-validator on the route, this is just a last line of defence
      // at the data layer.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    budgetRange: {
      type: String,
      required: [true, 'Budget range is required'],
      enum: {
        values: BUDGET_RANGES,
        message: 'Choose one of the listed budget ranges',
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'New',
    },
  },
  {
    // createdAt / updatedAt are both useful in the admin table (when the
    // lead came in, and when it last changed status), so timestamps: true
    // is simpler and less error-prone than adding a manual createdAt field.
    timestamps: true,
  }
);

// Index on status because the admin dashboard's default view and the status
// toggle both filter/sort on it. Also index createdAt since leads are
// listed newest-first.
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

leadSchema.statics.BUDGET_RANGES = BUDGET_RANGES;
leadSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
