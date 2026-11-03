# Native accounts on Cloudflare

The canonical authenticated app is https://super-el-nino.thrivbe.workers.dev.
Use **Sign in → Create an account**, then an email and a password of 15–128
characters. Account → Sign out revokes the current server session. Sessions have
an absolute seven-day expiry. Password reset and email verification are not
configured; users should keep their password in a password manager.

The managed ChatGPT Sites copy is a separate deployment and is not republished
by this change. Native credentials/cookie support on that runtime is unverified.
The new API never accepts ChatGPT identity headers, including those from a
managed dispatch. Existing community records and ChatGPT-owned identities are
preserved without being copied or linked to native accounts.

## Trust boundaries

- Passwords use native `node:crypto` scrypt, with an independent 16-byte random
  salt, N=16384, r=8, p=5, a 32-byte derived key and a versioned encoding. This is
  OWASP's N=2^14/r=8/p=5 profile and uses Cloudflare's `nodejs_compat` support.
- The browser holds a random 32-byte session token in a `__Host-` cookie with
  Secure, HttpOnly, SameSite=Lax and Path=/. Only its SHA-256 hash is stored in
  D1. Login rotates the presented session; logout revokes it; expiry is checked
  on every authenticated request. Expired sessions are purged on sign-in.
- All API actors are resolved from D1 sessions. Private reads have no-store
  responses. Existing ownership checks still govern writes and private data.
- Every cookie-authenticated mutation, including MCP tools/call, requires an
  exact same-origin Origin header. No credential CORS support is enabled.
- Input is JSON with a 4 KiB streaming bound, normalized email, and a bounded
  password. Login errors do not distinguish missing accounts/wrong passwords.
  Duplicate registration gives a generic failure and never issues a session.
- Atomic D1 windows limit credential attempts to 10 per normalized email and 30
  per Cloudflare-provided client IP per 15 minutes, shared by all isolates.
  NAT users share an IP limit. This is basic abuse control, not a bot challenge.
- Email is self-asserted, not verified. Native actors always have
  `emailVerified: false`; they cannot inherit ADMIN_EMAIL or the legacy
  administrators email allowlist. Moderation requires a separately designed,
  explicit verified provisioning path. No new native administrator is granted.
- The app never logs credential input, password hashes or session tokens.
  There is no password/token in browser storage or a JavaScript-readable cookie.

References: [Cloudflare Node crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/),
[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Migration and release

Prior deployed source: `428325f` (Show legacy research in split reader).
Prior deployed Worker version: `d1ce3ce2-f432-4609-b18d-3577fc2d2dfe`.

`drizzle/0005_native_auth.sql` and its generated Drizzle metadata add only
`auth_users`, `auth_sessions`, `auth_attempts` and their indexes. They do not
alter/drop legacy tables or populate/link accounts. Before deployment, verify
none of those three tables exists remotely; if one exists, inspect migration
state rather than replaying SQL. Keep the existing D1 binding and database ID.

After merging and pulling main, use the existing Thrivbe credential wrapper:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
node scripts/prepare-map-worker.mjs
pnpm build
pnpm typecheck
oprun --env-file /Users/robinsverd/Thrivbe-AI/Thrivbe-OS/.env -- node node_modules/wrangler/bin/wrangler.js d1 execute DB --remote --config wrangler.jsonc --file drizzle/0005_native_auth.sql
oprun --env-file /Users/robinsverd/Thrivbe-AI/Thrivbe-OS/.env -- node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.jsonc --tag "$(git rev-parse HEAD)" --message 'Native email/password auth'
```

Do not replay old production migrations. Verify HTTP 200, browser registration,
session persistence, logout/login, an owned contribution write, cross-origin
rejection and forged ChatGPT header rejection on the public Worker URL.
Disposable production test accounts use `sen-auth-smoke-<timestamp>@example.test`.
Delete only their own test contribution through the authenticated API. Leave the
clearly named account: there is no production account deletion path. Never run
broad cleanup SQL against user tables.

## Rollback

Restore the exact prior Worker version; leave the additive D1 tables/data in
place. The old app ignores them and becomes read-only again on Cloudflare.
This avoids destroying accounts or community data and allows a later redeploy.

```sh
oprun --env-file /Users/robinsverd/Thrivbe-AI/Thrivbe-OS/.env -- node node_modules/wrangler/bin/wrangler.js rollback d1ce3ce2-f432-4609-b18d-3577fc2d2dfe --config wrangler.jsonc --message 'Rollback native auth'
```

If that version is unavailable, redeploy source `428325f` from a clean checkout
using the same D1 binding. Do not revert main or apply destructive schema SQL.

## Hosting target

`vercel.json` sets the supported `git.deploymentEnabled: false` option because
this Vinext/D1 service is deployed to Cloudflare. The old Vercel Git integration
expected a static `site` output directory and failed after a successful build.
Git-triggered Vercel deployments are explicitly disabled rather than publishing
an incomplete static copy or changing integration permissions. This does not
remove any existing deployment. [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
documents the option; Cloudflare build/tests remain mandatory in CI.
