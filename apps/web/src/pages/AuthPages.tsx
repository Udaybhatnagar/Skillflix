import { AuthForm } from '../components/auth/AuthForm';
import { Art, Check } from '../design/Common';
function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>
          A little less searching.
          <br />
          <span>A lot more learning.</span>
        </h1>
        <p>
          Save a path. Find your place.
          <br />
          Keep moving at your own pace.
        </p>
        <div className="auth-art">
          <Art title="UI/UX Design" category="Design" />
          <div className="auth-floating">
            <Check className="icon" />A clear next step.
          </div>
        </div>
        <span className="smallprint">LEARN WITH DIRECTION</span>
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
