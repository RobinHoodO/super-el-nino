// Password gate for the whole site (Vercel Routing Middleware, free on any plan).
// Any username works; the password is the SITE_PASSWORD env var in Vercel.
// Only the exact policy pages below stay public (plugin directories need them).
const PUBLIC = new Set([
  '/privacy', '/privacy/', '/privacy/index.html',
  '/support', '/support/', '/support/index.html',
  '/terms', '/terms/', '/terms/index.html',
  '/legal.css',
]);

// Constant-time string compare (Edge runtime has no crypto.timingSafeEqual).
function safeEqual(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export default function middleware(request) {
  if (PUBLIC.has(new URL(request.url).pathname)) return;
  const expected = process.env.SITE_PASSWORD;
  const [scheme, encoded] = (request.headers.get('authorization') || '').split(' ');
  if (expected && scheme === 'Basic' && encoded) {
    let decoded = '';
    try { decoded = atob(encoded); } catch { /* malformed header: fall through to 401 */ }
    if (safeEqual(decoded.slice(decoded.indexOf(':') + 1), expected)) return;
  }
  return new Response('Password required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Super El Nino", charset="UTF-8"' },
  });
}
