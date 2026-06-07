/**
 * XBJ Verify — Cloudflare Worker
 * ─────────────────────────────────────────────────────────────────
 * Deploy at: https://dash.cloudflare.com → Workers & Pages → Create
 *
 * Set these Environment Variables in the Worker Settings tab:
 *
 *   GOOGLE_SHEET_ID    The long ID from your Google Sheet URL
 *   GOOGLE_API_KEY     From Google Cloud Console (Sheets API enabled)
 *   CREATOR_USERNAME   Exact string from Column E e.g. "karlsmidlife"
 *   TOTP_SECRET        Any passphrase you choose e.g. "KARLXBJ2026SECRET"
 *   ALLOWED_ORIGIN     Your GitHub Pages URL
 * ─────────────────────────────────────────────────────────────────
 */

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin':  env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const path = new URL(request.url).pathname;

    if (path === '/verify-order' && request.method === 'POST') {
      return handleOrderVerify(request, env, corsHeaders);
    }
    if (path === '/verify-pin' && request.method === 'POST') {
      return handlePinVerify(request, env, corsHeaders);
    }

    return json({ error: 'Not found' }, 404, corsHeaders);
  }
};

// ── ORDER VERIFICATION ────────────────────────────────────────────
// Looks up order number in Google Sheet (Column A)
// Checks Column E matches CREATOR_USERNAME
// ─────────────────────────────────────────────────────────────────
async function handleOrderVerify(request, env, corsHeaders) {
  let body;
  try { body = await request.json(); } catch {
    return json({ error: 'Bad request' }, 400, corsHeaders);
  }

  const order = (body.order || '').trim().replace(/\s/g, '');
  if (!order) return json({ error: 'No order provided' }, 400, corsHeaders);

  try {
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Sheet1!A:E?key=${env.GOOGLE_API_KEY}`;
    const res  = await fetch(sheetUrl);
    const data = await res.json();

    if (!data.values) {
      return json({ error: 'Sheet empty or unreachable' }, 500, corsHeaders);
    }

    // Match order number — handles truncated display in sheet
    const match = data.values.find(row => {
      const rowOrder = (row[0] || '').toString().trim();
      return rowOrder === order ||
             rowOrder.startsWith(order) ||
             order.startsWith(rowOrder.slice(0, 10));
    });

    if (!match) {
      return json({ verified: false, not_found: true }, 200, corsHeaders);
    }

    const creatorInSheet = (match[4] || '').trim().toLowerCase();
    const myUsername     = (env.CREATOR_USERNAME || '').toLowerCase();

    if (creatorInSheet.includes(myUsername)) {
      return json({ verified: true }, 200, corsHeaders);
    } else {
      return json({
        verified:      false,
        wrong_creator: true,
        creator:       match[4] || 'another creator'
      }, 200, corsHeaders);
    }

  } catch (err) {
    return json({ error: 'Verification failed', message: err.message }, 500, corsHeaders);
  }
}

// ── PIN VERIFICATION ──────────────────────────────────────────────
// 10-minute TOTP (600 second window)
// Use 2FAS app — set Period = 600 when adding key manually
// DO NOT use Google Authenticator — it only supports 30s periods
// ─────────────────────────────────────────────────────────────────
async function handlePinVerify(request, env, corsHeaders) {
  let body;
  try { body = await request.json(); } catch {
    return json({ error: 'Bad request' }, 400, corsHeaders);
  }

  const pin    = (body.pin || '').trim();
  const secret = env.TOTP_SECRET || 'DEFAULTSECRET';

  // 600 seconds = 10 minute window
  const timeStep = 600;
  const now      = Math.floor(Date.now() / 1000);

  // Accept ±1 window to cover clock drift
  for (const w of [-1, 0, 1]) {
    const counter = Math.floor((now + w * timeStep) / timeStep);
    const code    = await generateHOTP(secret, counter);
    if (pin === code) {
      return json({ verified: true }, 200, corsHeaders);
    }
  }

  return json({ verified: false }, 200, corsHeaders);
}

// ── HOTP/TOTP (RFC 4226) ──────────────────────────────────────────
async function generateHOTP(secret, counter) {
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setUint32(4, counter & 0xffffffff, false);

  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );

  const sig  = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hash = new Uint8Array(sig);

  const offset = hash[19] & 0xf;
  const code = (
    ((hash[offset]     & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8)  |
     (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
