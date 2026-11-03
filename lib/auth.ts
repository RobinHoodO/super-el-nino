import {db as database} from './storage';
import {randomBytes, scrypt, timingSafeEqual} from 'node:crypto';
import {z} from 'zod';

export const SESSION_COOKIE = '__Host-sen-session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
// OWASP's scrypt N=2^14, r=8, p=5 profile. nodejs_compat provides native scrypt.
const SCRYPT = {N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024};
const credentials = z.object({
  email: z.string().trim().max(254).email().transform(v => v.toLowerCase()),
  password: z.string().min(15).max(128),
}).strict();
export type SessionUser = {id: string; email: string; emailVerified: false};
async function digest(value: string) {
  return Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))).toString('hex');
}
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 32, SCRYPT, (error, key) => error ? reject(error) : resolve(key)));
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
async function passwordMatches(password: string, encoded: string) {
  const [algorithm, salt, hash] = encoded.split('$');
  if (algorithm !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{64}$/.test(hash ?? '')) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, 'hex'));
}
function sessionToken(req: Request) {
  const value = req.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
export async function sessionUser(req: Request): Promise<SessionUser | null> {
  const token = sessionToken(req);
  if (!token) return null;
  const row = await database().prepare(`SELECT u.id,u.email FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(await digest(token), Date.now()).first<{id: string; email: string}>();
  return row ? {...row, emailVerified: false} : null;
}
export function sameOrigin(req: Request) {
  return req.headers.get('origin') === new URL(req.url).origin && req.headers.get('sec-fetch-site') !== 'cross-site';
}
function json(data: unknown, status = 200, cookie?: string) {
  const headers = new Headers({'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  if (cookie) headers.set('Set-Cookie', cookie);
  return Response.json(data, {status, headers});
}
function cookie(token: string, seconds = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}
async function revokeSession(req: Request) {
  const token = sessionToken(req);
  if (token) await database().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await digest(token)).run();
}
// Atomic, persistent fixed windows shared by Worker isolates. Keys contain hashes only.
async function throttle(req: Request, email: string) {
  const now = Date.now(), window = Math.floor(now / 900000), expires = (window + 1) * 900000;
  const keys = [await digest(`ip:${req.headers.get('cf-connecting-ip') ?? 'unknown'}:${window}`), await digest(`email:${email}:${window}`)];
  const results = await database().batch(keys.map(key => database().prepare(`INSERT INTO auth_attempts (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts`).bind(key, expires)));
  await database().prepare('DELETE FROM auth_attempts WHERE expires_at<=?').bind(now).run();
  return results.every((r, i) => Number((r.results[0] as {attempts: number}).attempts) <= (i === 0 ? 30 : 10));
}
async function readCredentials(req: Request) {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Invalid input');
  if (Number(req.headers.get('content-length') ?? 0) > 4096) throw new Error('Invalid input');
  const reader = req.body?.getReader();
  if (!reader) throw new Error('Invalid input');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 4096) throw new Error('Invalid input');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return credentials.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
}
export async function authGet(req: Request) {
  try { return json({user: await sessionUser(req)}); }
  catch { return json({error: 'Authentication temporarily unavailable.'}, 503); }
}
export async function authPost(req: Request) {
  if (!sameOrigin(req)) return json({error: 'Invalid request origin.'}, 403);
  const action = new URL(req.url).searchParams.get('action');
  try {
    if (action === 'logout') {
      await revokeSession(req);
      return json({signedIn: false}, 200, cookie('', 0));
    }
    if (action !== 'register' && action !== 'login') return json({error: 'Unknown authentication action.'}, 400);
    let input: z.infer<typeof credentials>;
    try { input = await readCredentials(req); }
    catch { return json({error: 'Use a valid email and a password of 15–128 characters.'}, 400); }
    if (!await throttle(req, input.email)) return json({error: 'Too many attempts. Try again in 15 minutes.'}, 429);
    let userId: string;
    if (action === 'register') {
      userId = `native:${crypto.randomUUID()}`;
      const hash = await passwordHash(input.password);
      // The unique email constraint makes concurrent registration safe.
      const result = await database().prepare('INSERT INTO auth_users (id,email,password_hash,created_at) VALUES (?,?,?,?) ON CONFLICT(email) DO NOTHING RETURNING id').bind(userId, input.email, hash, Date.now()).all();
      if (!result.results.length) return json({error: 'Unable to create an account with those details.'}, 400);
    } else {
      const user = await database().prepare('SELECT id,password_hash FROM auth_users WHERE email=?').bind(input.email).first<{id: string; password_hash: string}>();
      // Equal work for absent accounts; dummy hash never authenticates.
      const matches = await passwordMatches(input.password, user?.password_hash ?? `scrypt-v1$${'0'.repeat(32)}$${'0'.repeat(64)}`);
      if (!user || !matches) return json({error: 'Email or password is incorrect.'}, 401);
      userId = user.id;
    }
    const token = randomBytes(32).toString('base64url'), now = Date.now();
    await revokeSession(req);
    await database().batch([
      database().prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now),
      database().prepare('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token), userId, now + SESSION_SECONDS * 1000),
    ]);
    return json({user: {id: userId, email: input.email, emailVerified: false}}, action === 'register' ? 201 : 200, cookie(token));
  } catch {
    // Never log input, database errors, credentials, hashes or tokens.
    return json({error: 'Authentication temporarily unavailable.'}, 503);
  }
}
