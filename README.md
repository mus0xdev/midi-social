# Midylo

Midylo is a dark social library for discovering, playing and sharing MIDI files. It uses Next.js App Router, TypeScript, Supabase Auth, PostgreSQL and Storage.

## Requirements

- Node.js 20.9 or newer
- A Supabase project

## Setup

```bash
git clone <your-repository-url>
cd midi-social
npm install
```

1. Create a project at [supabase.com](https://supabase.com/).
2. Open Supabase **SQL Editor** and run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql). This creates the database tables, reports, RLS policies, triggers and the `midi-files` Storage bucket.
3. Enable Email under **Authentication > Providers**.
4. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings > API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only the public anon/publishable key belongs in the frontend. Never expose the Supabase service role key.

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run lint
npm run build
npm run start
```

## Routes

- `/` - public MIDI library
- `/auth` - email sign up and login
- `/upload` - protected MIDI upload
- `/midi/[id]` - player, metadata, likes, downloads, reports and comments
- `/new` - newest uploads
- `/search?q=...` - search by title, description, creator and tags
- `/user/[username]` - creator profile and uploads
- `/privacy` - privacy policy, cookies and future advertising disclosure
- `/terms` - terms of service
- `/copyright` - copyright and DMCA process
- `/contact` - support and legal contacts
- `/admin/reports` - admin-only moderation queue

## Upload and licensing

Upload accepts `.mid` and `.midi` files up to 10 MB. The form checks the extension, common MIDI MIME types and the `MThd` MIDI header. Storage policies also enforce the authenticated user's UUID path and MIDI filename pattern.

Users may upload only MIDI files they created, own, have permission to distribute, or that are genuinely Public Domain or licensed for redistribution. Available license labels include Public domain, CC0, CC BY 4.0, CC BY-SA 4.0 and All Rights Reserved.

## Reports and moderation

The migration creates a `reports` table with RLS. Authenticated users can report a MIDI or comment once per target. Admins can review reports at `/admin/reports` and update their status. To grant admin access, run this manually in Supabase:

```sql
update public.profiles
set is_admin = true
where username = 'your_username';
```

## Privacy and advertising

The project includes privacy, terms, copyright and contact pages suitable as a starting point for production review. No Google AdSense script or advertising slot is included yet. Before enabling advertising, update the privacy policy, consent flow and third-party cookie disclosures for the final provider configuration.

## Security notes

The browser checks the MIDI header, but client-side checks can be bypassed by a direct request. For production-grade malware or content scanning, use a server-side or Supabase Edge Function upload gateway and keep direct Storage INSERT disabled.

The player uses the open-source `@tonejs/midi` parser and Tone.js Web Audio synth. Browser audio requires a user gesture before playback starts.
