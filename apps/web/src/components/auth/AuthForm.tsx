import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/Auth';
import { useLanguage } from '../../context/Language';
import { request } from '../../services/api';
export const safeReturn = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : '/my-learning';
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}
export function GoogleButton({ onSuccess }: { onSuccess?: () => void }) {
  const { google, googleEnabled } = useAuth();
  const [error, setError] = useState('');
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useEffect(() => {
    if (!googleEnabled || !clientId || !element) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) =>
          google(response.credential)
            .then(() => {
              onSuccess?.();
              if (!onSuccess) navigate(safeReturn(params.get('returnTo')), { replace: true });
            })
            .catch((e) => setError(e.message)),
      });
      window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with',
      });
    };
    if (window.google) {
      render();
      return () => {
        cancelled = true;
      };
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      script.remove();
    };
  }, [clientId, element, googleEnabled]);
  if (!googleEnabled || !clientId) return null;
  return (
    <div className="mt-5">
      <div ref={setElement} />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
export function AuthForm({
  mode,
  onSuccess,
}: {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
}) {
  const { login, signup } = useAuth();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = safeReturn(params.get('returnTo'));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await signup(name, email, password, confirm);
      else await login(email, password);
      onSuccess?.();
      if (!onSuccess) navigate(next, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2 className="text-3xl">{mode === 'signup' ? t('createAccount') : t('welcome')}</h2>
      <p className="mt-2 text-sm text-muted">
        {mode === 'signup'
          ? 'Save your learning across devices.'
          : 'Sign in to continue your learning.'}
      </p>
      <GoogleButton onSuccess={onSuccess} />
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === 'signup' && (
          <label className="block text-sm font-medium">
            {t('fullName')}
            <input
              className="input mt-2"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          {t('email')}
          <input
            className="input mt-2"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          {t('password')}
          <input
            className="input mt-2"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="Enter password"
            required
            minLength={mode === 'signup' ? 10 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === 'signup' && (
          <label className="block text-sm font-medium">
            {t('confirmPassword')}
            <input
              className="input mt-2"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="button-primary w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signup' ? t('createAccount') : 'Sign in'}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
        {mode === 'login' ? (
          <>
            <Link
              to={`/signup?returnTo=${encodeURIComponent(next)}`}
              className="font-semibold text-blue"
            >
              {t('createAccount')}
            </Link>
            <Link to="/forgot-password" className="text-muted underline">
              {t('forgotPassword')}
            </Link>
          </>
        ) : (
          <Link
            to={`/login?returnTo=${encodeURIComponent(next)}`}
            className="font-semibold text-blue"
          >
            Already have an account? Log in
          </Link>
        )}
      </div>
    </div>
  );
}
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(result.message);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to process request');
    }
  }
  return (
    <main className="container-site max-w-xl py-16">
      <p className="eyebrow">Account access</p>
      <h1 className="mt-4 text-4xl">Reset your password</h1>
      <p className="mt-4 text-muted">
        Enter your email. If email delivery is configured, we will send a reset link.
      </p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <input
          className="input"
          type="email"
          aria-label="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="button-primary">Send reset link</button>
      </form>
      {message && (
        <p role="status" className="mt-4 text-sm text-blue">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </main>
  );
}
export function AuthCallback() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const purpose = params.get('purpose');
  const token = params.get('token') || '';
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      if (purpose === 'verify') {
        await request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
        setMessage('Email verified. You can sign in.');
      } else if (purpose === 'reset') {
        await request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, password, confirmPassword: confirm }),
        });
        setMessage('Password reset. You can sign in.');
      } else setError('Invalid link');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete request');
    }
  }
  return (
    <main className="container-site max-w-xl py-16">
      <p className="eyebrow">Account access</p>
      <h1 className="mt-4 text-4xl">
        {purpose === 'reset' ? 'Choose a new password' : 'Verify your email'}
      </h1>
      {!message && (
        <form onSubmit={submit} className="mt-7 space-y-4">
          {purpose === 'reset' && (
            <>
              <input
                className="input"
                type="password"
                aria-label="New password"
                placeholder="New password"
                minLength={10}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="input"
                type="password"
                aria-label="Confirm new password"
                placeholder="Confirm new password"
                minLength={10}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </>
          )}
          <button className="button-primary">Continue</button>
        </form>
      )}
      {message && (
        <p role="status" className="mt-5 text-blue">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 text-red-700">
          {error}
        </p>
      )}
      <Link className="button-outline mt-6" to="/login">
        Log in
      </Link>
    </main>
  );
}
