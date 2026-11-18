import { AuthForm } from '../components/auth/AuthForm';
export function LoginPage() {
  return (
    <main className="container-site max-w-xl py-16">
      <p className="eyebrow">Skillflix account</p>
      <div className="mt-5 rounded-2xl border border-border bg-white p-8">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
export function SignupPage() {
  return (
    <main className="container-site max-w-xl py-16">
      <p className="eyebrow">Skillflix account</p>
      <div className="mt-5 rounded-2xl border border-border bg-white p-8">
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
