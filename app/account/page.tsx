'use client';
import Link from 'next/link';
import {useEffect, useState, type FormEvent} from 'react';

export default function AccountPage() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [user, setUser] = useState<{email: string}|null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {fetch('/api/auth', {cache: 'no-store'}).then(async r => {
    if (!r.ok) throw new Error('Could not load your session. Please reload.');
    setUser((await r.json() as {user:{email:string}|null}).user);
  }).catch(e => setError(e.message)).finally(() => setLoading(false));}, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth?action=${mode}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: data.get('email'), password: data.get('password')})});
      const result = await response.json().catch(() => ({})) as {error?:string};
      if (!response.ok) throw new Error(result.error || 'Could not sign in. Try again.');
      window.location.assign('/');
    } catch (e) {setError(e instanceof Error ? e.message : 'Could not sign in. Try again.');}
    finally {setBusy(false);}
  }
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth?action=logout', {method: 'POST'});
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      window.location.assign('/');
    } catch (e) {setError((e as Error).message); setBusy(false);}
  }
  return <main className="account-page"><Link href="/">← Back to Super El Nino</Link><h1>{user ? 'Your account' : mode === 'register' ? 'Create an account' : 'Sign in'}</h1>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading…</p> : user ? <><p>Signed in as {user.email}</p><button className="primary" disabled={busy} onClick={logout}>Sign out</button></> : <>
      <p>Use your email and password to contribute and collaborate.</p>
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <label>Password<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={15} maxLength={128} required/></label>
        <p>Use 15–128 characters. Password recovery by email is not available yet; save your password securely.</p>
        <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
      </form>
      <button type="button" disabled={busy} onClick={() => {setMode(mode === 'login' ? 'register' : 'login'); setError('');}}>{mode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}</button>
    </>}
  </main>;
}
