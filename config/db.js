// config/db.js
// Opens a single Mongoose connection using the URI from .env.
// Kept in its own module so server.js and the seed script can both reuse it
// without duplicating connection logic.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Fail loudly and immediately rather than letting every later DB call
    // throw a confusing "ECONNREFUSED" error one at a time.
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  }

  // Mongoose 8 no longer needs the old useNewUrlParser/useUnifiedTopology
  // flags, they are the default behaviour now.
  await mongoose.connect(uri);

  console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);

  // Surface connection drops in the logs instead of failing silently.
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });
}

module.exports = connectDB;
