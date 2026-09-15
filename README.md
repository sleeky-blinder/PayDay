# Payday

> **Frozen — 15 September 2026.** Day-to-day money lives in the Claude artifact for now;
> this app is not being updated while the screens are redesigned. Its data is whatever was
> last imported here (the 13 September backup) and has not kept pace. When the redesign is
> ready, start again from a fresh export of the artifact rather than trusting what is stored
> here. Do not enter spending in both places in the meantime — they cannot be merged.

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
3. **Authentication → Sign In / Providers → Email**: keep Email enabled and turn **Confirm email**
   off. Sign-in is an email and a password you choose; no email is ever sent, so nothing depends on
   mail delivery.
4. **Project Settings → API Keys**: copy the *Project URL* and the *anon public* key.
6. Either paste them into `config.js` and push, or open the app, go to
   **Settings → Backup → Sync connection**, paste them there and tap *Save and reload*.
   The anon key is meant to be public; row-level security means each signed-in user only ever sees their own rows.
5. Open the app, type your email and a password, tap **Create account**. On every other device, the
   same email and password, tap **Sign in**.

Without Supabase the app still works fully, saving on the device, with backup and restore under Settings.

## 3. Put it on your phone

**iPhone**: open the address in **Safari** (not Chrome) → Share → *Add to Home Screen*. Adding it from
any other browser makes a shortcut that reopens that browser instead of running as an app.

**Android**: open the address in Chrome → the *Install* prompt, or ⋮ → *Install app*.

If the icon opens a browser with an address bar, the manifest or icons were missing when you added it.
Remove the icon and add it again.

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
