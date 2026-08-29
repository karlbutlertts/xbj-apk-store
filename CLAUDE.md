# xbj-apk-store — Project Memory

## What this is
A locked, Google Play Store-style web page for XBJ A5 Pro projector buyers.
Buyers verify their TikTok Shop order number to get access to UK streaming APK updates.
Built and maintained by @karlsmidlifecrisis (Karl), UK TikTok Shop affiliate, home cinema niche.

---

## Stack
- Frontend:  index.html — single file, sidebar-menu TV shell (see UI structure below), vanilla JS, no framework
- Backend:   worker.js — Cloudflare Worker, handles order + pin verification
- App data:  apps.json — Karl edits this to add/update apps, never needs to touch index.html
- APK files: /apks/ folder — served via GitHub raw
- Orders:    Google Sheets API — Karl uploads XBJ order CSV exports here

---

## File structure
```
xbj-apk-store/
├── CLAUDE.md          ← this file
├── index.html         ← full app
├── apps.json          ← app manifest
├── worker.js          ← Cloudflare Worker
└── apks/              ← APK files go here
```

---

## Cloudflare Worker environment variables
Set these in dash.cloudflare.com → Workers & Pages → xbj-verify → Settings → Variables

| Variable          | Description                                                      |
|-------------------|------------------------------------------------------------------|
| GOOGLE_SHEET_ID   | Long ID from Google Sheet URL                                    |
| GOOGLE_API_KEY    | Google Cloud Console key with Sheets API enabled                 |
| CREATOR_USERNAME  | Exact string from Column E of XBJ orders sheet e.g. karlsmidlife|
| TOTP_SECRET       | Passphrase Karl chose — must match what's in 2FAS app            |
| ALLOWED_ORIGIN    | GitHub Pages URL e.g. https://username.github.io/xbj-apk-store  |

---

## Config block in index.html (top of <script>)
```javascript
const WORKER_URL      = 'https://xbj-verify.YOUR_SUBDOMAIN.workers.dev';
const MANIFEST_URL    = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/xbj-apk-store/main/apps.json';
const APK_BASE_URL    = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/xbj-apk-store/main/apks/';
const PAID_ACCESS_URL = 'https://ko-fi.com/YOUR_KOFI_OR_STRIPE_LINK';
```

---

## To update an existing app
1. Drop new APK into /apks/ on GitHub (overwrites old one — keep filename identical)
2. Update "updated" date and "size" in apps.json
3. Commit — page updates live instantly on next load

## To add a brand new app
Add a new JSON object to apps.json:
```json
{
  "models":    ["all"],
  "name":      "App Name",
  "abbr":      "AB",
  "icon":      "https://.../icon.png",
  "file":      "AppName.apk",
  "category":  "Entertainment",
  "tags":      ["streaming"],
  "size":      "XX MB",
  "rating":    4.5,
  "color":     "linear-gradient(145deg,#COLOUR1,#COLOUR2)",
  "downloads": "New",
  "updated":   "Month Year",
  "updatedAt": "2026-08-23T00:00:00Z"
}
```
`tags` decides which sidebar section it lands in (`livetv` / `streaming` /
`tools`, plus `movies` / `sports` inside Entertainment). `updatedAt` drives
the Home hero and the "Recently updated" shelf.
No changes needed to index.html.

---

## To notify users of an update ("What's New")
Every device sees a one-time "What's New" popup the first time it opens the
app after a new entry lands in changelog.json — no APK rebuild needed, since
the app's WebView just reloads the live site. Add a new object to the
**front** of the array (or anywhere — order in the file doesn't matter, `id`
does):
```json
{
  "id":    2,
  "date":  "Month Year",
  "title": "Short headline",
  "items": ["Plain-English bullet describing what changed or was added", "..."]
}
```
`id` must be higher than every existing entry — that's the only thing that
decides whether a device has already seen it (stored client-side in
localStorage under `xbj_changelog_seen`). Commit — the popup goes out
instantly, same as any other change to this repo.

**When Claude should add an entry:** only for new/updated apps or other
major changes buyers would actually care about — never for UI/design
tweaks (layout, colours, icons, spacing, animations, wording). Even then,
ask Karl first rather than adding it automatically.

---

## Access code system
- 10-minute TOTP (600 second window), 6 digits
- Use 2FAS app (free, iOS & Android) — NOT Google Authenticator (hardcoded 30s, won't work)
- Add manually in 2FAS: Account name = XBJ Updates, Key = TOTP_SECRET value, Algorithm = SHA-1, Period = 600, Digits = 6
- Karl reads current code to buyers who message him on TikTok
- Worker accepts ±1 window either side (codes valid ~10-30 mins to cover clock drift)

---

## Verification logic
1. Buyer enters TikTok Shop order number
2. Worker fetches Google Sheet (Column A = Order ID, Column E = Creator Username)
3. If order found AND Column E contains CREATOR_USERNAME → access granted
4. If order found AND Column E is a different creator → show creator name + paid access button
5. If order not found → error message with instructions
6. Session saved to localStorage for 30 days — buyer not asked again

---

## UI structure (index.html)
TV-style shell modelled on Reezn/ClipBox: a fixed menu rail down the left, big
poster cards on the right. Screens in order:

1. `#splash` → `#lock` (TOTP) → `#hub` (model picker) → `#shell`
2. `#shell` = `#sidebar` (the menu) + `#stage` (`#topbar` chips, `#viewBody`)

The old sub-hub menu screen is gone — its tiles are now sidebar entries plus
the "Your projector" shelf on Home.

`setView(name)` renders everything into `#viewBody`. Views:
`home` (hero + card shelves), `all` / `livetv` / `streaming` / `tools`
(grids), `entertainment` (code-locked), `search`, `settings`.

### Remote / D-pad
One spatial navigator (`moveFocus`) handles the whole shell: arrow keys jump
to the nearest `.nav-focusable` in that direction, so the sidebar, chips, hero
buttons and every card rail work without per-component wiring. Escape/Back
closes an overlay, else returns to Home. Focus is mirrored onto a `.nav-focus`
class because older Android TV webviews don't all support `:focus-visible`.

### apps.json quirk
The `downloads` field holds either a count ("New", "2.5k") or a one-line
description ("Stream movies & TV shows"). `isCountish()` decides: counts become
a corner badge, prose becomes the card's subtitle line.

## Design spec
- Font: DM Sans (Google Fonts)
- Dark TV theme. Background: #070a11  Surface: rgba(255,255,255,0.06)
- Accent: --accent / --accent-deep in `:root` — one knob, swap both to
  re-brand the whole shell (e.g. #e50914 / #9b1a1a for a red look)
- Card art radius: 18px  Hero radius: 26px  Button radius: 999px
- Rail width: 72px under 900px (icons only), 210px default, 250px at 1400px+
- NO backdrop-filter or blur() in the shell — those layers render blank on the
  projector's GPU. Overlays that predate the redesign still use it.
- British English only — no Americanisms anywhere in UI copy

---

## Deployment
- Hosting: GitHub Pages (main branch, root)
- Worker:  Cloudflare Workers (free tier)
- APK size limit: 100MB per file on GitHub. If larger, use GitHub LFS or swap APK_BASE_URL to Cloudflare R2.
