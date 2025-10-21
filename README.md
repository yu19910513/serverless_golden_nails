
# Troubleshooting Supabase Fetch Issues

When fetching data from Supabase, you may encounter `null` results or "permission denied" errors. This guide covers the most common causes and how to fix them.

## Why this Happens

Common causes include:

* The table exists in a non-`public` schema.
* Row-Level Security (RLS) policies are blocking access.
* The `anon` role does not have the proper Postgres permissions.
* You are using incorrect table or column names (they are case-sensitive).

---

## Step-by-Step Fix

### 1. Check Table Schema

Make sure your table is in the `public` schema. The Supabase JavaScript client (`supabase-js`) can only query `public` tables by default.

Run this in the Supabase SQL Editor if your table is in the wrong schema:

```sql
ALTER TABLE auric_db.miscellaneous SET SCHEMA public;
```

### 2. Verify Table and Column Names

Confirm the table and column names match exactly (case-sensitive).

Example columns for fetch: title, context.

### 3. Handle RLS

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

### 4. Grant SELECT Privileges

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

### 5. Grant Full Access (Read, Write, Delete)

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

### 6. Test Fetch

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