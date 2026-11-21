import { AuthForm } from '../components/auth/AuthForm';
import { figmaAssets } from '../design/FigmaAssets';
function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <h1>
          Keep learning
          <br />
          <span>at your pace.</span>
        </h1>
        <p>Save playlists and resume lessons across devices.</p>
        <div className="auth-art">
          <img src={figmaAssets.react} alt="React learning illustration" />
          <strong>Learn React</strong>
        </div>
      </section>
      <section className="auth-form">
        <AuthForm mode={mode} />
      </section>
    </div>
  );
}
export function LoginPage() {
  return <AuthPage mode="login" />;
}
export function SignupPage() {
  return <AuthPage mode="signup" />;
}
