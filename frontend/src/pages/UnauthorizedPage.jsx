import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">403 - Access Denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          You do not have the required administrative role or permissions to access this resource.
        </p>

        <div className="mt-8">
          <Link to="/dashboard">
            <Button variant="primary" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
