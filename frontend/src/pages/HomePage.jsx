import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Users, CalendarCheck2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export function HomePage() {
  const features = [
    { title: 'Face & Biometric Attendance', desc: 'AI liveness detection, geo-fencing, and RFID smart card integration' },
    { title: 'Automated Payroll & Slips', desc: 'Custom salary heads, compliance, and automated payslip generation' },
    { title: 'Leave & Shift Management', desc: 'Flexible approval workflows, dynamic rosters, and festival calendars' },
    { title: 'Multi-Tenant SaaS Scale', desc: 'Role-based access control, plan-based feature tiers, and full audit logs' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[140px]" />

      {/* Navigation Bar */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/25">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            Mindstocs EMS
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="primary" size="md">
              Sign In
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 text-center lg:px-8 lg:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 shadow-inner mb-8 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation Enterprise Workforce Platform</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Complete Employee & Attendance Management{' '}
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Built for Modern Enterprises
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          Streamline attendance verification with AI face recognition, automate payroll, manage shifts and rosters, and maintain airtight security across all branches.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button variant="primary" size="lg" className="px-8 shadow-xl shadow-blue-600/25">
              Access Enterprise Portal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg" className="px-8">
              Explore Capabilities
            </Button>
          </a>
        </div>

        {/* Feature Grid */}
        <section id="features" className="mt-28 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-blue-500/40 hover:bg-slate-900/90"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-100">{feat.title}</h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Mindstocs EMS. All rights reserved. Enterprise SaaS Suite.
      </footer>
    </div>
  );
}

export default HomePage;
