module.exports = function handler(_req, res) {
  // OpenAI verifies the exact value issued in the Plugins portal. It is intentionally
  // public at this well-known path. Replace the placeholder after the portal issues
  // the Vercel-domain challenge token.
  const token = 'domain-verification-pending';
  res.statusCode = 200;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(token);
};
