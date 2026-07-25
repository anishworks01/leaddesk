// server.js
// Application entry point. Responsible only for wiring - actual route
// logic lives in routes/, data shape in models/, auth setup in config/.

require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const leadsRouter = require('./routes/leads');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function start() {
  await connectDB();

  // --- View engine ---------------------------------------------------------
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // --- Core middleware -------------------------------------------------------
  app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(express.urlencoded({ extended: true })); // parses <form> POSTs
  app.use(express.json()); // parses the JSON body sent by the status-toggle fetch call
  app.use(express.static(path.join(__dirname, 'public')));

  // --- Sessions ----------------------------------------------------------
  // Sessions are stored in MongoDB (via connect-mongo) rather than the
  // default in-memory store. The in-memory store leaks memory and, more
  // importantly, forgets every logged-in admin the moment the process
  // restarts - which happens routinely on Render's free tier. Backing
  // sessions with the same database the app already uses means Task B's
  // "confirm it works from a fresh browser with no local state" holds up
  // across restarts and multiple server instances.
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 8, // 8 hours
        secure: isProduction, // requires HTTPS, which Render provides
        httpOnly: true,
      },
    })
  );

  // --- Auth ----------------------------------------------------------------
  configurePassport(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  // --- Routes --------------------------------------------------------------
  app.use('/', leadsRouter);
  app.use('/admin', adminRouter);

  // --- 404 -----------------------------------------------------------------
  app.use((req, res) => {
    res.status(404).render('404', { path: req.originalUrl });
  });

  // --- Central error handler -------------------------------------------------
  // Every route hands unexpected errors to next(err) instead of throwing,
  // so they all land here as one 500 page instead of crashing the process
  // or leaking a stack trace to the visitor.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(500).render('500', {
      message: isProduction ? 'Something went wrong.' : err.message,
    });
  });

  app.listen(PORT, () => {
    console.log(`[server] LeadDesk Mini running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[startup] failed to start:', err.message);
  process.exit(1);
});
