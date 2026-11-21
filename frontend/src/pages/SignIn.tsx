import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { signIn, signUp, useSession } from '../api/auth';

type Mode = 'sign-in' | 'sign-up';

const MIN_PASSWORD = 8; // Better Auth's default minimum

export default function SignIn() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  // Pages can send users here with state={{ from: '/somewhere' }} to come back after.
  // Only same-app paths, so this can never bounce someone to another site.
  const requested = (location.state as { from?: string } | null)?.from;
  const from = requested && /^\/(?![/\\])/.test(requested) ? requested : '/';

  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isPending && session) return <Navigate to={from} replace />;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } =
      mode === 'sign-in'
        ? await signIn.email({ email, password })
        : await signUp.email({ name: name.trim(), email, password });
    setSubmitting(false);
    if (error) {
      setError(
        error.message ??
          (error.status >= 500 || !error.status
            ? "Can't reach the server. Is the backend running? (Run npm run dev from the kansou folder.)"
            : 'Something went wrong. Please try again.'),
      );
      return;
    }
    navigate(from, { replace: true });
  }

  const isSignUp = mode === 'sign-up';

  return (
    <div className="page auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">
          感想 <span>kansou</span>
        </div>
        <p className="muted small auth-tagline">
          {isSignUp ? 'Create an account to keep your anime diary.' : 'Welcome back.'}
        </p>

        <div className="tabs auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!isSignUp} className={isSignUp ? '' : 'active'} onClick={() => switchMode('sign-in')}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => switchMode('sign-up')}>
            Create account
          </button>
        </div>

        {isSignUp && (
          <label className="field">
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" required maxLength={40} />
          </label>
        )}
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? MIN_PASSWORD : undefined}
            required
          />
          {isSignUp && <span className="small">At least {MIN_PASSWORD} characters.</span>}
        </label>

        {error && (
          <p className="auth-error small" role="alert">
            {error}
          </p>
        )}

        <button className="btn block" disabled={submitting}>
          {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
