# LeadDesk Mini

A small lead-capture product: a public landing page with a validated intake
form, and a password-protected `/admin` dashboard to search leads and move
them through New → Contacted → Closed.

Built for the **Digital Heroes Full Stack Development** internship
qualification task (Tasks A + B).

**Live URL:** _add your deployed Render URL here before submitting_
**Admin URL:** `<your-url>/admin` — see [test credentials](#test-credentials) below

---

## Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Views:** EJS (server-rendered, no build step — fast to ship, easy to deploy)
- **Auth:** Passport.js (local strategy) + bcrypt password hashing + MongoDB-backed sessions (`connect-mongo`)
- **Validation:** `express-validator` on the server, a small vanilla-JS layer on the client

## Project structure

```
leaddesk-mini/
├── server.js              # app entry point — wires everything together
├── config/
│   ├── db.js               # mongoose connection
│   └── passport.js         # passport local strategy + serialize/deserialize
├── models/
│   ├── Lead.js              # the intake record
│   └── Admin.js             # admin account, password stored as a bcrypt hash
├── middleware/
│   └── ensureAuth.js        # guards every /admin route
├── routes/
│   ├── leads.js              # public: GET / , POST /leads
│   └── admin.js               # protected: login, dashboard, status API
├── views/                    # EJS templates
├── public/                   # CSS + client-side JS
└── seed/createAdmin.js       # one-time script to create/reset the admin login
```

## Local setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Environment variables** — copy the example file and fill it in:
   ```
   cp .env.example .env
   ```
   At minimum set `MONGODB_URI` (a local `mongodb://127.0.0.1:27017/leaddesk`
   or an Atlas connection string works), `SESSION_SECRET` (any long random
   string), and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the seed script.

3. **Start MongoDB** if running locally:
   ```
   mongod
   ```

4. **Create the admin account** (run once, and again any time you want to reset the password):
   ```
   npm run seed:admin
   ```

5. **Run the app**
   ```
   npm run dev
   ```
   Visit `http://localhost:3000` for the landing page and
   `http://localhost:3000/admin` for the dashboard.

## Data model

**`Lead`** — one document per form submission:

| Field       | Type   | Notes                                              |
|-------------|--------|-----------------------------------------------------|
| name        | String | required                                            |
| email       | String | required, validated format                         |
| budgetRange | String | required, one of a fixed enum (see assumption below)|
| message     | String | required, max 2000 chars                            |
| status      | String | enum `New` / `Contacted` / `Closed`, defaults `New` |
| createdAt   | Date   | via Mongoose `timestamps`                           |

`status` and `budgetRange` are both fixed enums rather than free text. That
was a deliberate call: an enum means the admin table and the status badges
can never end up with inconsistent values like `"contacted"` vs `"Contacted"`
vs `"in progress"`, and search/filtering stays predictable.

**`Admin`** — kept as its own collection rather than a `role` flag on some
generic `User` model, since this app has exactly one kind of internal user
and no public accounts at all. Passwords are hashed with bcrypt
(12 salt rounds) — the plaintext password is never stored, logged, or
compared directly.

**Assumption:** the brief didn't specify budget tiers, so I picked four
reasonable ranges for a small agency's inbound leads: Under $1k, $1k–$5k,
$5k–$20k, $20k+. These live as a single source of truth in `Lead.js`
(`BUDGET_RANGES`) and are reused by both the form dropdown and server-side
validation, so they only need to change in one place.

## API / routes

| Method | Route                             | Auth       | Purpose                                |
|--------|------------------------------------|------------|------------------------------------------|
| GET    | `/`                                 | public     | Landing page + intake form               |
| POST   | `/leads`                             | public     | Create a lead (validated)                |
| GET    | `/admin/login`                        | public     | Login form                               |
| POST   | `/admin/login`                        | public     | Authenticate (Passport local)            |
| POST   | `/admin/logout`                       | admin      | End session                              |
| GET    | `/admin`                               | admin      | Dashboard, supports `?q=` search          |
| PATCH  | `/admin/api/leads/:id/status`           | admin      | Update a lead's status, returns JSON      |

## Auth approach

Login uses `passport-local`: the admin submits email + password, Passport
looks up the `Admin` document and compares the password against the stored
bcrypt hash. On success, only the admin's Mongo `_id` is stored in the
session (`serializeUser`) — not the whole document — keeping the session
payload small.

Sessions are backed by MongoDB via `connect-mongo`, using the same
`MONGODB_URI` the app already connects to, rather than the default
in-memory session store. Two reasons that matters in practice:

1. The in-memory store leaks memory over a long-running process.
2. More importantly for a free-tier deploy: Render's free instances spin
   down and restart, which would silently log every admin out and lose all
   sessions if they lived only in process memory. A MongoDB-backed store
   survives restarts.

Every `/admin` route below the login/logout routes is wrapped in an
`ensureAuth` middleware that checks `req.isAuthenticated()` and redirects
anonymous visitors to `/admin/login` — so there's no way to reach the
dashboard or the status-update API by URL alone.

## Test credentials

Create your own via `npm run seed:admin` using the `ADMIN_EMAIL` /
`ADMIN_PASSWORD` values in your `.env`. Use the same command against your
deployed database (with the `MONGODB_URI` pointed at your production
database) to create the account you'll hand over as test credentials.

## Deploying to Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables in the Render dashboard: `MONGODB_URI`
   (Atlas connection string — Render's free tier has no persistent disk, so
   a local `mongod` won't survive a restart), `SESSION_SECRET`, `NODE_ENV=production`.
5. After the first deploy, run `npm run seed:admin` **locally** with
   `MONGODB_URI` temporarily pointed at the same Atlas database, so the
   admin account exists in production too.
6. Confirm the live form and admin login both work from a fresh
   incognito window.

## What I'd do with another day

- Rate-limit `POST /leads` to prevent basic spam submissions.
- Add pagination to the admin table once lead volume grows past a page or two.
- Add a "forgot password" flow for the admin account instead of only the seed script.

## AI usage note

_Add your own paragraph here before submitting: where you used AI (e.g.
scaffolding routes, the CSS token system) and specifically what you changed
or rewrote afterward. This should be in your own words, not generated._
