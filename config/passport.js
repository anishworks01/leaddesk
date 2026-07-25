// config/passport.js
// Wires up Passport's local (email + password) strategy against the Admin
// model. This module exports a function that takes the passport instance
// so server.js stays the single place that owns app-level wiring.

const LocalStrategy = require('passport-local').Strategy;
const Admin = require('../models/Admin');

module.exports = function configurePassport(passport) {
  passport.use(
    new LocalStrategy(
      // The admin login form sends "email", not the default field name
      // "username", so that mapping has to be declared explicitly.
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

          // Deliberately the same error message whether the email doesn't
          // exist or the password is wrong. Distinguishing the two would
          // let an attacker enumerate which admin emails exist.
          if (!admin) {
            return done(null, false, { message: 'Incorrect email or password' });
          }

          const isMatch = await admin.comparePassword(password);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
          }

          return done(null, admin);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Only the admin's id is stored in the session (not the whole document),
  // keeping the session payload tiny.
  passport.serializeUser((admin, done) => {
    done(null, admin.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const admin = await Admin.findById(id);
      done(null, admin);
    } catch (err) {
      done(err);
    }
  });
};
