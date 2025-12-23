
# Serverless Golden Nails

An end-to-end, serverless web application for salon scheduling and customer management. The app combines a modern React frontend with Vercel serverless API routes and Supabase for authentication and data storage. Notification capabilities (email/SMS) are available via Nodemailer and Twilio.

---

## Table of Contents
- **Overview**: What the app does and how it’s organized
- **Architecture**: Frontend, serverless backend, and data layer
- **Tech Stack**: Key libraries and tooling
- **Folder Structure**: How code and functions are laid out
- **Environment**: Required environment variables
- **Setup**: Install, run, test, and build
- **API Overview**: Serverless routes and common patterns
- **Deployment**: Vercel configuration and usage
- **Troubleshooting**: Supabase fetch issues (original notes preserved)
- **Contributing**: How to propose changes

---

## Overview
- **Purpose**: Manage appointments, services, technicians, customers, and notifications for a salon in a serverless architecture.
- **Frontend**: React + Vite + Tailwind for a fast, modern UI.
- **Backend**: Vercel serverless functions under `api/`, organized by domain (appointments, authentication, customers, miscellaneous, notification, services, technicians).
- **Data/Auth**: Supabase (`@supabase/supabase-js`) used for persistence and authentication.
- **Notifications**: Optional integrations via Twilio (SMS) and Nodemailer (email).

---

## Architecture
- **Client**: React app in `src/` rendered by Vite. Styling via Tailwind.
- **Serverless API**: Request handlers in `api/` (Vercel Function routes). Common utilities live in `api/_utils`.
- **Data Layer**: Supabase client configured in `api/_utils/helpers/supabaseClient.js` using `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
- **Legacy Utilities**: `api/_utils/legacy/*` includes auth, helper, notification, and overlap utilities referenced by tests.
- **Testing**: Jest tests in `__tests__/` for API utilities and queries; frontend tests in `src/__tests__/`.

---

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router.
- **Serverless**: Vercel Functions via the `api/` directory.
- **Data & Auth**: Supabase JS client.
- **Notifications**: Twilio, Nodemailer (optional).
- **Tooling**: Jest, Babel, ESLint, PostCSS, concurrently.

---

## Folder Structure (high-level)
- **`src/`**: React app (components, hooks, pages, services, utils).
- **`api/`**: Serverless routes by domain with shared utilities under `_utils/`.
- **`__tests__/`**: Jest tests for API utilities and queries.
- **`src/__tests__/`**: Jest tests for UI/services.
- **`vercel.json`**: Vercel configuration.
- **`vite.config.js`**: Vite configuration.
- **`tailwind.config.js`** / **`postcss.config.cjs`**: Styling pipeline.
- **`jest.config.js`** / **`babel.config.*`**: Testing/transpilation setup.

---

## Environment
Set these variables for local and deployed environments. Only include secrets in secure environments.

- **`SUPABASE_URL`**: Your Supabase project URL.
- **`SUPABASE_ANON_KEY`**: Supabase anon key for client operations.
- **`JWT_SECRET`**: Secret used by legacy auth utilities.
- **`ALLOWED_REFERRERS`**: Comma-separated list of allowed referrers for auth checks.
- **`ADMIN_TOKEN_EXPIRATION`** / **`CUSTOMER_TOKEN_EXPIRATION`**: Token TTLs used in legacy auth.
- **Twilio (optional)**: `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_NUMBER`.
- **Email (optional)**: `BUSINESS_EMAIL`, `APP_PASSWORD`, `STORE_EMAIL`, `OWNER_EMAIL`.

For local development, create a `.env.local` (Vite) or configure environment in Vercel. Do not commit secrets.

---

## Setup & Scripts
Install dependencies, run locally, test, and build using `npm` scripts from `package.json`.

### Install
```bash
npm install
```

### Run (frontend + serverless locally)
```bash
# Starts Vite dev server and Vercel dev together
npm run start

# Alternatively, run them separately
npm run dev          # Vite frontend
npm run vercel-dev   # Vercel functions
```

### Test
```bash
npm test                 # Run all tests
npm run coverage         # Coverage for all tests
npm run test:api-utils   # API utility tests
npm run test:src         # Frontend tests
```

### Build & Preview
```bash
npm run build    # Production build
npm run preview  # Preview locally
```

---

## API Overview
Serverless functions are organized by domain under `api/` with route folders (e.g., `appointments`, `authentication`, `customers`, `miscellaneouses`, `notification`, `services`, `technicians`). Many folders include an `index.js` and dynamic routes like `[...all].js` plus `_routes/` handlers.

- **Routing**: Vercel maps files in `api/` to `/api/*` endpoints.
- **Patterns**: Common REST-style handlers (e.g., `GET /api/appointments`, `POST /api/customers`). Dynamic routes catch path variations via `[...all].js`.
- **Utilities**: Shared helpers in `api/_utils/helpers/*` (e.g., `supabaseClient.js`, `response.js`, `validate.js`, `errors.js`).
- **Auth**: Legacy auth helpers live in `api/_utils/legacy/authentication.js` and are covered by tests.

Refer to tests in `__tests__/queries/*` and `__tests__/api-utils/*` for examples of expected payloads and flows.

---

## Deployment
- **Platform**: Vercel (see `vercel.json`).
- **Local Emulation**: `npm run vercel-dev` starts the local Vercel dev server.
- **Environment**: Configure environment variables in the Vercel project settings for production.
- **Build**: `npm run build` generates the frontend assets; serverless routes are deployed by Vercel automatically.

---

## Troubleshooting

### Troubleshooting Supabase Fetch Issues

When fetching data from Supabase, you may encounter `null` results or "permission denied" errors. This guide covers the most common causes and how to fix them.

#### Why this Happens

Common causes include:

- The table exists in a non-`public` schema.
- Row-Level Security (RLS) policies are blocking access.
- The `anon` role does not have the proper Postgres permissions.
- You are using incorrect table or column names (they are case-sensitive).

---

#### Step-by-Step Fix

1) **Check Table Schema**

Make sure your table is in the `public` schema. The Supabase JavaScript client (`supabase-js`) can only query `public` tables by default.

Run this in the Supabase SQL Editor if your table is in the wrong schema:

```sql
ALTER TABLE auric_db.miscellaneous SET SCHEMA public;
```

2) **Verify Table and Column Names**

Confirm the table and column names match exactly (case-sensitive).

Example columns for fetch: title, context.

3) **Handle RLS**

If Row-Level Security is enabled, create a policy for the anon role:

```sql
ALTER TABLE public.miscellaneous ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select"
ON public.miscellaneous
FOR SELECT
TO anon
USING (true);
```

If RLS is disabled, you can skip this step.

4) **Grant SELECT Privileges**

Even with RLS disabled, the anon role must have `SELECT` privileges:

```sql
-- Grant SELECT on all tables in public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon;', r.table_name);
    END LOOP;
END $$;
```

-- Optional: future tables
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;
```

5) **Grant Full Access (Read, Write, Delete)**

⚠️ Warning: Use this script only if you want your public anon key to have full control over any table that does not have RLS enabled.

```sql
-- Grant ALL permissions for all EXISTING tables in the 'public' schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions for all FUTURE tables in the 'public' schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;

-- Grant permissions for all EXISTING sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant permissions for all FUTURE sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;
```

6) **Test Fetch**

SQL test:

```sql
SET ROLE anon;
SELECT * FROM public.miscellaneous LIMIT 5;
```

JS fetch example:

```javascript
const { data, error } = await supabase
  .from('miscellaneous')
  .select('title, context')
  .eq('title', title.trim());
```

data should now contain results, error should be null.

Quick Checklist

✅ Table is in public schema

✅ Column names match code exactly

✅ RLS policy exists for anon or RLS is disabled

✅ Postgres SELECT privileges granted to anon

---

## Contributing
- **Issues/PRs**: Please open issues and submit PRs with concise descriptions.
- **Style**: Follow ESLint rules (run `npm run lint`) and existing code patterns.
- **Tests**: Add or update Jest tests for serverless routes and utilities when you change behavior.
