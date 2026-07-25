// seed/createAdmin.js
// Run with: npm run seed:admin
// Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env, or
// updates the password if that email already exists. This is the only
// place an admin account can be created - there is deliberately no public
// "sign up" route, since this is a single small internal tool, not a
// multi-tenant product.

require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.');
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await Admin.hashPassword(password);

  const admin = await Admin.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { email: email.toLowerCase().trim(), passwordHash },
    { upsert: true, new: true }
  );

  console.log(`[seed] admin ready: ${admin.email}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
