import { Link } from 'react-router-dom';
export function About() {
  return (
    <main className="container-site max-w-4xl py-16">
      <p className="eyebrow">About Skillflix</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Learning starts with clarity.</h1>
      <p className="mt-8 text-lg leading-8 text-muted">
        Skillflix helps people in India discover exam preparation and professional skill resources.
        Our initial guides offer starting points and topic outlines, not official exam instructions
        or a promise of outcomes.
      </p>
      <p className="mt-5 text-lg leading-8 text-muted">
        You can browse without an account. Create one to save courses, bookmark resources, and
        synchronize your learning progress across devices.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="button-primary" to="/exams">
          Explore exams
        </Link>
        <Link className="button-outline" to="/skills">
          Explore skills
        </Link>
      </div>
    </main>
  );
}
