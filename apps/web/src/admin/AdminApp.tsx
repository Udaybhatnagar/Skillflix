import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/Auth';
import {
  AdminDashboard,
  AdminUsers,
  AdminSettings,
  AdminCategories,
  AdminPlaylists,
} from './AdminPages';
import { AdminCourses, AdminTeachers } from './AdminEntities';
import { AdminResources } from './AdminResources';
import { AdminRoadmaps } from './AdminRoadmaps';
const links = [
  ['Dashboard', 'dashboard'],
  ['Users', 'users'],
  ['Courses', 'courses'],
  ['Exams', 'exams'],
  ['Skills', 'skills'],
  ['Teachers', 'teachers'],
  ['Roadmaps', 'roadmaps'],
  ['Resources', 'resources'],
  ['Playlists', 'playlists'],
  ['Categories', 'categories'],
  ['Settings', 'settings'],
];
export function AdminApp() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <main className="container-site py-20">Checking access…</main>;
  if (!user) return <Navigate to="/login?returnTo=%2Fadmin%2Fdashboard" replace />;
  if (user.role !== 'SUPER_ADMIN')
    return (
      <main className="container-site py-20">
        <h1 className="text-4xl">Access denied</h1>
        <p className="mt-4 text-muted">This area is for the Skillflix administrator.</p>
        <Link className="button-outline mt-6" to="/">
          Return home
        </Link>
      </main>
    );
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={`${open ? 'block' : 'hidden'} border-r border-border bg-white lg:block`}>
        <div className="border-b border-border p-6">
          <Link to="/admin/dashboard" className="font-serif text-3xl text-blue">
            skillflix<span className="text-warm">.</span>
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">
            Administration
          </p>
        </div>
        <nav aria-label="Admin navigation" className="grid gap-1 p-4">
          {links.map(([label, path]) => (
            <NavLink
              onClick={() => setOpen(false)}
              key={path}
              to={`/admin/${path}`}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium ${isActive ? 'bg-softblue text-blue' : 'text-ink hover:bg-paper'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5 lg:px-8">
          <button
            className="rounded-md p-2 lg:hidden"
            aria-label={open ? 'Close admin menu' : 'Open admin menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <p className="hidden text-sm font-semibold text-blue lg:block">Content workspace</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-blue underline">
              View site
            </Link>
            <Link to="/profile" className="text-sm font-semibold">
              {user.full_name}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-site p-5 pb-16 lg:p-8">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="exams" element={<AdminCourses kind="exam" />} />
            <Route path="skills" element={<AdminCourses kind="skill" />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="roadmaps" element={<AdminRoadmaps />} />
            <Route path="resources" element={<AdminResources />} />
            <Route path="playlists" element={<AdminPlaylists />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
