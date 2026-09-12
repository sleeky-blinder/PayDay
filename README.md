# Payday

pHiLo's payday routine as a personal app: record spending, tick the monthly run, reconcile
against the apps, watch the plan. Installable on iPhone and Android, works offline, syncs
between devices through your own Supabase project.

Plain HTML, CSS and JavaScript. No build step, no framework, nothing to compile.

## Files

| File | What it is |
|---|---|
| `index.html` | The app shell |
| `app.js` | The whole sheet: data model, plan engine, prompts, rendering |
| `app.css` | Styles, light and dark, phone layout with the bottom tab bar |
| `sync.js` | Sign-in and live sync through Supabase; runs device-only without it |
| `config.js` | Your Supabase URL and anon key (optional, see below) |
| `vendor/supabase.js` | The Supabase client library (v2.116.0), kept local so the app has no CDN dependency |
| `sw.js`, `manifest.webmanifest`, `icons/` | What makes it installable and offline-capable |
| `supabase/schema.sql` | One table, its security rules, and a merge function |

## 1. Put it online (GitHub Pages)

1. Create a new GitHub repository, for example `payday`. Public or private both work for Pages on a personal account (private needs GitHub Pro).
2. From this folder:
   ```sh
   git init
   git add .
   git commit -m "Payday app"
   git branch -M main
   git remote add origin git@github.com:<you>/payday.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**. Save.
4. After a minute the app is live at `https://<you>.github.io/payday/`.

Every later change is `git add . && git commit -m "…" && git push`. Installed copies pick the update
up on their next open and show a "Payday updated — Reload" notice.

## 2. Sync (Supabase, free tier)

1. Create a project at supabase.com. Any region; Frankfurt or London is closest to Lagos.
2. **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, run it.
3. **Authentication → Providers → Email**: leave Email enabled; you can turn off "Confirm email"
   since sign-in is by link anyway.
4. **Authentication → URL Configuration**: set *Site URL* to your Pages address
   (`https://<you>.github.io/payday/`) and add it under *Redirect URLs* too.
5. **Project Settings → API**: copy the *Project URL* and the *anon public* key.
6. Either paste them into `config.js` and push, or open the app, go to
   **Settings → Backup → Sync connection**, paste them there and tap *Save and reload*.
   The anon key is meant to be public; row-level security means each signed-in user only ever sees their own rows.
7. Open the app, enter your email, tap the link that arrives. Do this once per device.

Without Supabase the app still works fully, saving on the device, with backup and restore under Settings.

## 3. Put it on your phone

**iPhone**: open the address in Safari → Share → *Add to Home Screen*. Sign in from the installed app
(the email link opens back into it).

**Android**: open the address in Chrome → the *Install* prompt, or ⋮ → *Add to Home screen*.

## 4. Bring your data across

**Settings → Backup → Import a backup file** and choose the `payday-backup.json` that was sent to you
separately. Do it once, on one device, after signing in — sync carries it everywhere else.

Keep that backup file out of this folder. Everything here is served publicly once deployed, so a
backup placed here would put every balance on the open web. Backups belong in your Downloads or
a private folder, never in the repo.

## Notes

- Data lives in your Supabase project and in each device's local storage. Take a backup from
  Settings now and then; it is the same JSON the sheet used.
- The service worker caches the app shell and fonts. Supabase calls always go to the network;
  entries made offline queue on the device and sync when you are back.
- Fee rules, salaries, routine lines and one-offs are all editable under Settings, as in the sheet.
