# Travlr Getaways

A travel-booking site built three ways at once: a server-rendered Express site,
a REST API behind it, and an Angular admin SPA on top. Built for a full-stack
MEAN course in 2024, then picked back up in 2026 to fix an auth path that never
actually worked.

## How it's put together

The public site (`app_server`) is Express with Handlebars templates, rendered
server-side. That came first — plain pages straight from the server.

The API (`app_api`) came next: REST endpoints over MongoDB via Mongoose, with
JWT auth through Passport. MongoDB made sense here because the trip data has a
loose shape and it drops into a JavaScript stack without an ORM translation layer.

The admin SPA (`app_admin`) is Angular 18, standalone components. It talks to
the same API and handles trip CRUD. Faster after the first load, which is the
tradeoff you take for the bigger initial bundle.

## What I fixed in 2026

The version on `main` didn't run. `register` and `login` referenced an undefined
variable, `getUser` was called but never defined, and express-jwt was imported
the old way — calling the module directly instead of destructuring `expressjwt`
— which broke against the v8 install. Some of that was already fixed on an
unmerged branch — I pulled those fixes forward, converted the leftover
callback-style Mongoose code (unsupported since Mongoose 7) to async/await, and
bumped `jsonwebtoken` so it stops crashing on Node 24+.

Auth works now: register, login, and JWT-protected writes all run correctly
against the fixed code.

## Running it

Requires MongoDB and Node 18+.

```bash
npm install
npm install --prefix app_admin
cp .env.example .env # set JWT_SECRET
npm start # :3000
```

## Known issues

- No login screen in the admin SPA, and no HTTP interceptor attaching the token,
  so admin add/edit returns 401. The plumbing is wired up, the UI isn't.
- `models/travlr.js` has `require: true` instead of `required: true` — no validation.
- Generator scaffolding left in `app_server/routes/users.js` and the stock template
  markup in `public/`.
- `npm audit`: 13 backend, 89 in the Angular toolchain. Clearing the Angular ones
  means a major version bump.
