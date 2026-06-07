# XBJ App Updater — Setup Guide

Follow these steps in order. Takes about 30 minutes total.

---

## Step 1 — Add your APK files
Copy your APK files into the /apks/ folder:
- BBCiPlayer.apk
- Channel4.apk
- FreeVee.apkm
- GooglePlayStore.apk
- ITVX.apk
- Downloader.apk
- RemoteADBShell.apk

---

## Step 2 — Google Sheet (5 mins)
1. Go to sheets.google.com → create a new sheet
2. Import your XBJ orders CSV: File → Import → upload the CSV
3. Make sure Column A = Order ID, Column E = Creator Username
4. Share the sheet: click Share → change to "Anyone with the link can view"
5. Copy the Sheet ID from the URL:
   docs.google.com/spreadsheets/d/ **COPY_THIS_PART** /edit

---

## Step 3 — Google API Key (10 mins)
1. Go to console.cloud.google.com
2. Create a new project (call it "XBJ Verify")
3. Search for "Google Sheets API" → Enable it
4. Go to Credentials → Create Credentials → API Key
5. Click the key → restrict it to "Google Sheets API" only
6. Copy the key

---

## Step 4 — GitHub (5 mins)
1. Go to github.com → sign in (or create free account)
2. Click + → New repository
3. Name it: xbj-apk-store
4. Set to Public → click Create
5. Upload all files from this folder (drag and drop the whole folder)
6. Go to Settings → Pages → Source: Deploy from branch → main → / (root) → Save
7. Your URL will be: https://YOUR_USERNAME.github.io/xbj-apk-store
8. Copy that URL

---

## Step 5 — Cloudflare Worker (10 mins)
1. Go to dash.cloudflare.com → create free account if needed
2. Click Workers & Pages → Create application → Create Worker
3. Name it: xbj-verify
4. Click Edit code → delete everything → paste the contents of worker.js → Deploy
5. Go to Settings → Variables → add these one by one:

   GOOGLE_SHEET_ID    = [paste your Sheet ID from Step 2]
   GOOGLE_API_KEY     = [paste your API key from Step 3]
   CREATOR_USERNAME   = karlsmidlife   (or whatever appears in Column E)
   TOTP_SECRET        = [choose any passphrase e.g. KARLXBJ2026SECRET]
   ALLOWED_ORIGIN     = [your GitHub Pages URL from Step 4]

6. Click Save and deploy
7. Copy your Worker URL — looks like: https://xbj-verify.SOMETHING.workers.dev

---

## Step 6 — Update index.html config (2 mins)
Open index.html in any text editor (Notepad is fine).
Find these four lines near the bottom and replace the placeholder values:

   const WORKER_URL      = 'https://xbj-verify.YOUR_SUBDOMAIN.workers.dev';
   const MANIFEST_URL    = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/xbj-apk-store/main/apps.json';
   const APK_BASE_URL    = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/xbj-apk-store/main/apks/';
   const PAID_ACCESS_URL = 'https://ko-fi.com/YOUR_KOFI_OR_STRIPE_LINK';

Save the file, then re-upload it to GitHub (drag and drop to replace).

---

## Step 7 — Set up 2FAS for your 10-minute codes (3 mins)
1. Download 2FAS (free) from the App Store
2. Tap + → Enter key manually
3. Fill in:
   - Account name: XBJ Updates
   - Key: [whatever you set as TOTP_SECRET in Step 5]
   - Algorithm: SHA-1
   - Refresh time: 600 seconds
   - Digits: 6
4. Tap Save
5. The 6-digit code shown is what you give buyers who message you on TikTok

NOTE: Do NOT use Google Authenticator — it is hardcoded to 30-second codes and will not work.

---

## Step 8 — Test it
1. Go to your GitHub Pages URL
2. Try entering a real order number from your XBJ sheet
3. Try entering a wrong order number
4. Open 2FAS and try the current code
5. All three should work correctly

---

## Updating apps in future
When XBJ releases a new app version:
1. Go to your GitHub repo → /apks/ folder
2. Upload the new APK file (same filename = overwrites old one)
3. Open apps.json → update the "updated" date and "size" if needed → commit
Done — the page updates itself automatically.

---

## Your live URL to share with buyers
https://YOUR_GITHUB_USERNAME.github.io/xbj-apk-store
