import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

const Landing = lazy(() => import('./routes/index'));
const Review = lazy(() => import('./routes/review'));
const Dashboard = lazy(() => import('./routes/dashboard'));
const ProjectDetail = lazy(() => import('./routes/project.$id'));
const Summary = lazy(() => import('./routes/summary'));
const Settings = lazy(() => import('./routes/settings'));

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen text-gray-600">Loading…</div>
  );
}

export default function App() {
  const [dark, setDark] = React.useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  function applyTheme(nextDark: boolean) {
    const root = document.documentElement;
    if (nextDark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    setDark(nextDark);
  }

  return (
    <Suspense fallback={<Loader />}> 
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/review" element={<Review />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          aria-label="Toggle theme"
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 bg-white/80 backdrop-blur shadow-soft hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100"
          onClick={() => applyTheme(!dark)}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-sm hidden sm:inline">{dark ? 'Light' : 'Dark'} mode</span>
        </button>
      </div>
    </Suspense>
  );
}
