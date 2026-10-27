// Cloudflare Worker: password gate for /meetings, plus /mcp and the OpenAI challenge.
// Every other path is a plain static asset.
// Password-only form, no username. A valid login sets an HttpOnly cookie for /meetings.
// The password is the SITE_PASSWORD Worker secret; changing it logs everyone out.
import { handleMcp, handleChallenge } from './mcp.js';

const COOKIE = 'senri_meetings';

async function token(pw) {
  const bytes = new TextEncoder().encode('senri-meetings:' + pw);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string compare (plain JS, no dependency on crypto.timingSafeEqual).
function safeEqual(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function cookieValue(request) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]+)`));
  return m ? m[1] : '';
}

function loginPage(wrong) {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Meetings · Super El Niño</title>
<style>
:root{--bg:#f6f8f9;--fg:#14232b;--muted:#56666f;--line:#d8e0e4;--accent:#d2491f;--surface:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#0e171c;--fg:#e4ecef;--muted:#9aabb3;--line:#2a3a43;--accent:#ff7a4d;--surface:#15222a;color-scheme:dark}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;padding:16px}
form{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:1.5rem;width:100%;max-width:22rem;display:grid;gap:.75rem}
h1{font-size:1.2rem;margin:0} p{margin:0;color:var(--muted);font-size:.9rem}
input{font:inherit;padding:.6rem .7rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg)}
button{font:inherit;font-weight:600;padding:.6rem;border:0;border-radius:6px;background:var(--accent);color:#fff;cursor:pointer}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px} .err{color:var(--accent)} a{color:var(--muted)}
</style></head><body>
<form method="post" action="/meetings/login">
<h1>Meeting transcripts</h1>
<p>Private to the Super El Niño Response group.</p>
${wrong ? '<p class="err" role="alert">Wrong password. Try again.</p>' : ''}
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Open transcripts</button>
<p><a href="/">← Back to the overview</a></p>
</form></body></html>`;
  return new Response(body, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function handle(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === '/mcp') return handleMcp(request);
  if (pathname === '/.well-known/openai-apps-challenge') return handleChallenge();

  const expected = env.SITE_PASSWORD;
  if (!expected) return loginPage(false); // fail closed if the secret is missing
  const url = new URL(request.url);
  const good = await token(expected);

  if (url.pathname === '/meetings/login') {
    if (request.method !== 'POST') return Response.redirect(new URL('/meetings/', url), 303);
    const form = await request.formData().catch(() => null);
    const pw = String(form?.get('password') || '');
    if (!safeEqual(pw, expected)) return Response.redirect(new URL('/meetings/?wrong=1', url), 303);
    return new Response(null, {
      status: 303,
      headers: {
        location: '/meetings/',
        'set-cookie': `${COOKIE}=${good}; Path=/meetings; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      },
    });
  }

  if (safeEqual(cookieValue(request), good)) return env.ASSETS.fetch(request); // logged in: serve the page
  return loginPage(url.searchParams.has('wrong'));
}

export default { fetch: handle };
