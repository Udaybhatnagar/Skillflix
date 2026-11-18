import { useEffect, useRef, useState } from 'react';
import { AuthForm, GoogleButton } from './AuthForm';
import { useLanguage } from '../../context/Language';
export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'choice' | 'login' | 'signup'>('choice');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    setMode('choice');
    const before = document.activeElement as HTMLElement | null;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && ref.current) {
        const focusable = [
          ...ref.current.querySelectorAll<HTMLElement>('button,a,input,select,textarea'),
        ].filter((x) => !x.hasAttribute('disabled'));
        if (!focusable.length) return;
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('button')?.focus());
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      before?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-paper p-7 shadow-xl"
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="rounded-md px-2 py-1 text-2xl"
          >
            ×
          </button>
        </div>
        <p className="eyebrow">Skillflix account</p>
        <h2 id="auth-title" className="mt-3 text-4xl">
          Your learning journey starts here.
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Create a free account to watch lessons, save roadmaps, and track your progress.
        </p>
        {mode === 'choice' ? (
          <div className="mt-7 space-y-3">
            <GoogleButton onSuccess={onClose} />
            <button className="button-primary w-full" onClick={() => setMode('login')}>
              {t('continueEmail')}
            </button>
            <button className="button-outline w-full" onClick={() => setMode('signup')}>
              {t('createAccount')}
            </button>
            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <button
                className="font-semibold text-blue underline"
                onClick={() => setMode('login')}
              >
                {t('login')}
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <AuthForm mode={mode} onSuccess={onClose} />
            <button className="mt-5 text-sm text-blue underline" onClick={() => setMode('choice')}>
              Back to options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
