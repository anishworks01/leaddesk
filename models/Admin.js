// models/Admin.js
// A deliberately separate collection from any future "customer" concept.
// Task B requires "real login, not a hardcoded string" - this model plus
// Passport's local strategy (config/passport.js) is what makes that true:
// the password is hashed with bcrypt and never stored or compared in
// plaintext.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Instance method: compare a plaintext password (from the login form)
// against the stored bcrypt hash. Keeping this on the model means the
// comparison logic lives next to the data it operates on, instead of being
// duplicated wherever login happens.
adminSchema.methods.comparePassword = function comparePassword(plainText) {
  return bcrypt.compare(plainText, this.passwordHash);
};

// Static helper used by the seed script so hashing logic isn't duplicated
// between "create the first admin" and "an admin resets their password".
adminSchema.statics.hashPassword = function hashPassword(plainText) {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(plainText, SALT_ROUNDS);
};

module.exports = mongoose.model('Admin', adminSchema);
