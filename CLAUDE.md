# xbj-apk-store — Project Memory

## What this is
A locked, Google Play Store-style web page for XBJ A5 Pro projector buyers.
Buyers verify their TikTok Shop order number to get access to UK streaming APK updates.
Built and maintained by @karlsmidlifecrisis (Karl), UK TikTok Shop affiliate, home cinema niche.

---

## Stack
- Frontend:  index.html — single file, two screens (verify + app store), vanilla JS, no framework
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
  "name":     "App Name",
  "abbr":     "AB",
  "file":     "AppName.apk",
  "category": "Entertainment",
  "size":     "XX MB",
  "rating":   4.5,
  "color":    "linear-gradient(145deg,#COLOUR1,#COLOUR2)",
  "updated":  "Month Year"
}
```
No changes needed to index.html.

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

## Design spec
- Font: DM Sans (Google Fonts)
- Background: #f2f2f7  Surface: #ffffff
- Blue: #007aff  Blue bg: #e8f1ff
- Green: #34c759  Green bg: #e5ffe9
- Red: #ff3b30  Red bg: #fff0ef
- Amber: #ff9500  Amber bg: #fff9ed
- Card radius: 18px  Button radius: 20px  Icon radius: 22px
- Frosted nav: backdrop-filter blur(20px)
- British English only — no Americanisms anywhere in UI copy

---

## Deployment
- Hosting: GitHub Pages (main branch, root)
- Worker:  Cloudflare Workers (free tier)
- APK size limit: 100MB per file on GitHub. If larger, use GitHub LFS or swap APK_BASE_URL to Cloudflare R2.
