// Password gate for the whole site (Vercel Routing Middleware, free on any plan).
// Any username works; the password is the SITE_PASSWORD env var in Vercel.
// Policy pages stay public: plugin directories need them.
export const config = {
  matcher: '/((?!privacy|support|terms|legal\\.css|favicon).*)',
};

export default function middleware(request) {
  const expected = process.env.SITE_PASSWORD;
  const [scheme, encoded] = (request.headers.get('authorization') || '').split(' ');
  if (expected && scheme === 'Basic' && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(':') + 1) === expected) return; // continue to the page
  }
  return new Response('Password required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Super El Nino", charset="UTF-8"' },
  });
}
