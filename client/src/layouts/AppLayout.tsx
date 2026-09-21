import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileUp, Briefcase, Menu, X, LogOut } from 'lucide-react';
import { getCases, seedData } from '../services/api';
import { Case } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const fetchCases = async () => {
    try {
      const data = await getCases();
      setCases(data || []);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [location.pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSeed = async () => {
    try {
      await seedData();
      await fetchCases();
      alert('Demo data seeded successfully!');
    } catch (err) {
      console.error('Failed to seed data:', err);
      alert('Failed to seed data. Check console for details.');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#111827] overflow-hidden text-slate-300">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 md:z-auto
        w-64 bg-[#0a0f1a] border-r border-slate-800 flex flex-col h-full flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo area */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">CrimeWeb<span className="text-cyan-500">AI</span></h1>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="px-4 py-2 flex flex-col gap-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/' ? 'bg-slate-800/50 text-cyan-400' : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            to="/upload"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/upload' ? 'bg-slate-800/50 text-cyan-400' : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30'
            }`}
          >
            <FileUp className="w-5 h-5" />
            <span className="font-medium">Upload Report</span>
          </Link>
        </nav>

        <div className="mx-4 my-2 border-t border-slate-800"></div>

        {/* Cases List */}
        <div className="px-4 py-2 flex-1 overflow-y-auto scrollbar-subtle">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Active Cases</h2>
          <div className="flex flex-col gap-1">
            {cases.map((c) => (
              <Link
                key={c.id}
                to={`/case/${c.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                  location.pathname.startsWith(`/case/${c.id}`) ? 'bg-slate-800/50 text-cyan-400' : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30'
                }`}
              >
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{c.title}</span>
              </Link>
            ))}
            {cases.length === 0 && (
              <div className="text-sm text-slate-500 px-3 py-2">No active cases.</div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-600 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm font-semibold flex-shrink-0">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSeed}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium border border-slate-700"
          >
            Seed Demo Data
          </button>

          <button
            onClick={signOut}
            id="sign-out-button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/20 hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-subtle h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
