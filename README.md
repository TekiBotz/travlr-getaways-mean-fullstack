# Travlr Getaways

A MEAN-stack travel booking demo built in three tiers: a server-rendered
marketing site (`app_server`), a REST API with JWT auth (`app_api`), and an
Angular admin SPA for managing trips (`app_admin`). The backend tiers share one
Express process; the Angular app is a separate project with its own dev server.

Started as coursework (originally `cs465-fullstack`), now cleaned up as a
portfolio piece. The API runs, and passport-local login plus JWT-protected
`POST`/`PUT` writes work end to end. See [Known issues](#known-issues) for
what's left — mostly the admin SPA's missing login screen.

## Contents

- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [How the three tiers fit together](#how-the-three-tiers-fit-together)
- [Why it's split this way](#why-its-split-this-way)
- [API endpoints](#api-endpoints)
- [Setup and running locally](#setup-and-running-locally)
- [Environment variables](#environment-variables)
- [Known issues](#known-issues)
- [License](#license)

## Screenshots

<!-- Add screenshots of the /travel SSR page and the Angular admin trip list here. -->

_TODO: drop in screenshots of the public travel page and the admin trip list._

## Tech stack

| Area | What | Version |
|------|------|---------|
| Runtime | Node.js | no `engines` field; tested on Node 26.8.2 |
| Web framework | Express | 4.19.2 |
| Server-side views | hbs (Handlebars) | 4.2.0 |
| Database | MongoDB via Mongoose | 8.4.1 |
| Auth | Passport + passport-local | 0.7.0 / 1.0.0 |
| Tokens | jsonwebtoken, express-jwt | 9.0.3 / 8.4.1 |
| Password hashing | Node `crypto` pbkdf2 (sha512) | built-in |
| Admin SPA | Angular (standalone components) | 18.0 |
| SPA UI | Bootstrap | 5.3.3 |
| SPA reactive | RxJS | 7.8 |
| SPA language | TypeScript | 5.4 |
| SPA tests | Karma + Jasmine | 6.4 / 5.1 |

## Repository layout

```
app.js                    Express app: loads DB + passport, then middleware, view engine, CORS on /api, routes
bin/www                   HTTP server bootstrap (reads PORT, default 3000)

app_server/               Server-rendered tier (Handlebars)
  routes/                 index.js (/), users.js (/users, generator stub), travel.js (/travel)
  controllers/            main.js  -> renders index.hbs
                          travel.js -> fetches /api/trips, renders travel.hbs
  views/                  *.hbs templates, layouts/, partials/ (header, footer)

app_api/                  REST API tier, mounted at /api
  routes/index.js         /login, /register, /trips, /trips/:tripCode
  controllers/            authentication.js (register, login -> signed JWT)
                          trips.js (list, find-by-code, add, update)
  models/                 db.js      Mongoose connection + graceful shutdown
                          travlr.js  Trip schema
                          user.js    User schema: pbkdf2 hash+salt, generateJwt()
                          seed.js    loads data/trips.json, then exits
  config/passport.js      local strategy (email + password)

public/                   Static marketing site (freewebsitetemplates.com template)
data/trips.json           Seed data: 3 trips

app_admin/                Angular 18 SPA — separate npm project
  src/app/
    trip-listing/         lists trips as cards (GET /api/trips)
    trip-card/            one trip card + "edit" button
    add-trip/             reactive form -> POST /api/trips
    edit-trip/            reactive form -> PUT /api/trips/:code
    services/             trip-data.service.ts (trip CRUD + login/register HTTP calls)
                          authentication.service.ts (token in localStorage)
    app.routes.ts         '' listing, 'add-trip', 'edit-trip'
```

## How the three tiers fit together

**`app_server` (Express + Handlebars).** Serves the static pages in `public/`
directly, plus one server-rendered page at `/travel`. The travel controller
(`app_server/controllers/travel.js`) does a server-side `fetch` to
`http://localhost:3000/api/trips`, then renders `travel.hbs` with the trip list.
If the API returns a non-array or an empty list it renders a fallback message
instead of failing. So the SSR tier is a client of the API tier, over
localhost, in the same process.

**`app_api` (REST API).** An Express router mounted at `/api` in `app.js`. Reads
are open; writes (`POST`/`PUT`) go through `express-jwt`. Auth is
passport-local: `config/passport.js` looks up the user by email and checks the
password against a per-user pbkdf2-sha512 hash + salt (`app_api/models/user.js`),
so passwords are never stored in the clear. On success the API returns a JWT
signed with `JWT_SECRET`, 7-day expiry. Data access is Mongoose 8 against
`mongodb://<DB_HOST>/travlr`.

**`app_admin` (Angular 18 SPA).** A standalone-components app for trip
management. `trip-listing` loads `GET /api/trips` and renders `trip-card`s;
`add-trip` and `edit-trip` are reactive forms that POST/PUT back to the API. The
selected trip code is stashed in `localStorage` between the list and the edit
form. `authentication.service.ts` keeps the JWT in `localStorage` under
`travlr-token` and decodes the expiry client-side. It runs on its own dev server
(`ng serve`, port 4200); `app.js` sets `Access-Control-Allow-Origin:
http://localhost:4200` on `/api` so the SPA can call the API cross-origin during
development.

## Why it's split this way

**Two front-end approaches, on purpose.** The customer-facing site is mostly
static HTML served straight from Express, with server-side Handlebars rendering
for the one page that needs live data (`/travel`). Rendering that page on the
server means the first response is a complete HTML document — nothing waits on a
JS bundle — which is what you want for public pages that get shared and crawled.

**The admin side is a different job.** Logged-in users doing repeated
create/edit work don't benefit from full page reloads. After the Angular bundle
loads once, navigation and form round-trips just hit the JSON API. That's the
case where a SPA earns its extra initial payload.

**MongoDB via Mongoose.** The whole stack is JavaScript, a trip is a flat
document with no joins, and the shape is still changing. A document store keeps
the model in one file (`app_api/models/travlr.js`) and skips migrations while
the schema settles. JSON on the wire, JSON-ish in the database, plain objects in
between.

## API endpoints

Base URL `http://localhost:3000/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trips` | none | List all trips |
| GET | `/trips/:tripCode` | none | One trip by its `code` |
| POST | `/trips` | JWT | Create a trip |
| PUT | `/trips/:tripCode` | JWT | Update a trip by `code` |
| POST | `/register` | none | Create a user, return a JWT |
| POST | `/login` | none | Authenticate, return a JWT |

Send the token as `Authorization: Bearer <jwt>` on the protected routes.

## Setup and running locally

Prerequisites: Node.js 18 or newer (tested on 26.8.2), and a MongoDB instance
(a local `mongod` on `127.0.0.1`, or set `DB_HOST` to point elsewhere).

### Backend (`app_server` + `app_api`)

```bash
npm install
cp .env.example .env          # set JWT_SECRET; set DB_HOST if Mongo isn't on 127.0.0.1
node app_api/models/seed.js   # optional: load data/trips.json (3 trips), then exits
npm start                     # node ./bin/www  ->  http://localhost:3000
```

`/` and the other `.html` routes serve the static site from `public/`.
`/travel` is the server-rendered page; it needs the API (same process) and a
seeded database to show anything.

### Admin SPA (`app_admin`)

```bash
cd app_admin
npm install
npm start                     # ng serve  ->  http://localhost:4200
```

The SPA calls `http://localhost:3000/api`, so run the backend too. Other admin
scripts:

```bash
npm run build                 # output to app_admin/dist/travlr-admin
npm test                      # Karma + Jasmine
```

## Environment variables

From `.env.example` (copy to `.env`, which is gitignored):

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Express HTTP port, read in `bin/www` | `3000` |
| `DB_HOST` | Mongo host; the URI is built as `mongodb://<DB_HOST>/travlr` | `127.0.0.1` |
| `JWT_SECRET` | Signing secret for auth tokens (`app_api/models/user.js`) | none — required for auth |

## Known issues

The API runs and the auth path works end to end: `POST /api/register` and
`POST /api/login` return a signed JWT, and `express-jwt` gates `POST`/`PUT
/api/trips` on a valid `Authorization: Bearer` token. This was verified locally
against an in-memory user store; a real MongoDB wasn't available in the test
environment, so nothing has been run against the actual database driver yet.
With no reachable database the read endpoints now return 500 after Mongoose's
buffer timeout instead of crashing the process.

**Admin add/edit returns 401.** `app_admin` has no login screen and no HTTP
interceptor, so `add-trip` and `edit-trip` submit their forms with no token and
the API rejects the write. `TripDataService.login()` / `.register()` and
`AuthenticationService` are wired up, but nothing calls them yet. Adding a login
component plus a token interceptor is the next step.

**`.toPromise()` deprecation.** `TripDataService.makeAuthApiCall` uses RxJS
`.toPromise()`, deprecated in RxJS 7 and removed in 8. It builds today on
Angular 18 / RxJS 7.8; switch to `firstValueFrom` before upgrading RxJS.

**Trip schema isn't validated.** `app_api/models/travlr.js` uses `require: true`
instead of `required: true`, so Mongoose doesn't enforce the trip fields on save.

**Dependency advisories** (`npm audit`, 2026-09-09):

- Backend: 13 advisories (2 critical, 4 high, 2 moderate, 5 low). Criticals are
  `handlebars` (via `hbs`) and `mongoose`. Bumping `jsonwebtoken` to 9.0.3
  cleared the `jws` advisory and fixed a Node 24+ startup crash — old `jwa`
  required `buffer-equal-constant-time` (which touches the removed `SlowBuffer`
  global) at load time; `jwa` 2 defers that require.
- `app_admin`: 89 advisories (3 critical, 56 high, 21 moderate, 9 low), almost
  all in the Angular 18 build toolchain (`webpack`, `vite`, `undici`, `tar`)
  plus the Angular framework packages. Clearing them fully means moving Angular
  to a current major.

**Leftover generator scaffolding.** `app_server/routes/users.js` is the Express
generator stub, still mounted at `/users`; `layouts/layout.hbs` links a
`/stylesheets/style.css` that doesn't exist; `views/index.hbs` is the generator
stub (unreachable while `public/index.html` exists); `app_admin/README.md` is
stock Angular CLI text.

Nothing here is deployed, so the advisories are dev-time concerns.

## License

MIT — see [LICENSE](LICENSE).
