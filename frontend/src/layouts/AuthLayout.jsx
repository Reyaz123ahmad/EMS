import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Building2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="block text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Mindstocs EMS
              </span>
              <span className="block text-xs font-medium text-slate-400">Enterprise Workforce Suite</span>
            </div>
          </Link>
        </div>

        {/* Auth Content Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          <Outlet />
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Multi-Layer Enterprise Security Protected</span>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
