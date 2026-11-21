# Star Study Point

A responsive, notes-first Science PDF library for Class 9 and Class 10, built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Run the existing project

```sh
npm install
npm run dev
```

## Configure Supabase

1. `.env.local` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from **Project Settings → API**. The app also accepts the legacy `VITE_SUPABASE_ANON_KEY`. Both are browser-safe project values; never put a secret or service-role key in the frontend. Restart Vite after changing this file.
2. In the Supabase dashboard for `star-study-point1`, open **SQL Editor → New query**. Paste the full contents of `supabase/migrations/20261121000100_create_science_notes.sql` and run it. This creates the notes table, private `science-notes` PDF bucket (50 MiB maximum), admin allow-list, and database/storage RLS policies.
3. In **Authentication → Users**, add the administrator account with the teacher's email and password. Then copy that user's UUID and add it to `public.admin_users` in SQL Editor:

   ```sql
   insert into public.admin_users (user_id)
   values ('YOUR_AUTH_USER_UUID');
   ```

4. To prevent student accounts, turn off public sign-ups in **Authentication → Sign In / Providers → Email** (keep administrator account creation restricted to the dashboard). Open `/admin` to sign in and upload PDFs.

The migration can be safely re-run. The admin UUID insert is idempotent when written as:

```sql
insert into public.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

The website does not offer student accounts. Anonymous students can only read published note metadata and request time-limited access to its private PDF. Admin write access is restricted by the `admin_users` allow-list and database/storage RLS. If Supabase credentials are missing, `/admin` explicitly reports that cloud uploads are not configured.

## Pages

- `/` — Minimal homepage with the two Science classes
- `/class-9` — 12 chapter titles, PDF counts, and chapter search
- `/class-10` — 16 chapter titles, PDF counts, and chapter search
- `/class-9/chapter/9-1` and `/class-10/chapter/10-1` — Chapter PDF library and in-browser viewer
- `/admin` — Authenticated PDF upload and document manager

Run `npm run build` for a production build and `npm run lint` for lint checks.
