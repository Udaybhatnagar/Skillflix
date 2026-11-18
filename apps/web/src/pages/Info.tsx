import { Link } from 'react-router-dom';
export function Contact() {
  return (
    <main className="container-site max-w-3xl py-16">
      <p className="eyebrow">Get in touch</p>
      <h1 className="mt-4 text-5xl">Contact Skillflix</h1>
      <p className="mt-6 leading-7 text-muted">
        For questions about your account, content, or a resource link, contact the site operator.
        Add an operational support address before public launch.
      </p>
      <Link className="button-outline mt-8" to="/about">
        About Skillflix
      </Link>
    </main>
  );
}
export function Privacy() {
  return (
    <main className="container-site max-w-3xl py-16">
      <p className="eyebrow">Information</p>
      <h1 className="mt-4 text-5xl">Privacy policy</h1>
      <div className="mt-8 space-y-5 leading-7 text-muted">
        <p>
          Skillflix stores account details, saved courses and resources, lesson progress, and
          learning activity in PostgreSQL so you can continue learning across devices.
        </p>
        <p>
          Authentication uses an HttpOnly session cookie. Passwords are stored as password hashes.
          Google sign in is available only when configured by the site operator.
        </p>
        <p>
          Embedded YouTube playback connects your browser to YouTube, which may process playback
          data under its own policies. Skillflix does not host or download YouTube videos.
        </p>
        <p>
          Contact the site operator to request access to or deletion of your account data. This
          policy requires legal review and operator details before public launch.
        </p>
      </div>
    </main>
  );
}
export function Terms() {
  return (
    <main className="container-site max-w-3xl py-16">
      <p className="eyebrow">Information</p>
      <h1 className="mt-4 text-5xl">Terms of service</h1>
      <div className="mt-8 space-y-5 leading-7 text-muted">
        <p>
          Skillflix provides learning paths and links to educational resources. Roadmaps are study
          guides and are not official exam syllabi or a guarantee of outcomes.
        </p>
        <p>
          Creator videos are played through YouTube and remain subject to YouTube terms and
          availability. Creators retain their own rights.
        </p>
        <p>
          Keep your account credentials secure and use the service lawfully. The site operator may
          suspend accounts that misuse the service.
        </p>
        <p>
          This draft needs legal review, an effective date, and operator contact details before
          public launch.
        </p>
      </div>
    </main>
  );
}
