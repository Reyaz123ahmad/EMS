import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';

export function RegisterPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
        <Building2 className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white">Company Registration</h2>
        <p className="text-xs text-slate-400">
          Tenant companies and employee profiles are provisioned directly by the Platform Super Administrator.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs text-slate-400">
        If you are an employee awaiting onboarding, please check your registered email for your invitation and temporary login credentials.
      </div>

      <Link to="/login" className="inline-block w-full">
        <Button variant="secondary" className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </Link>
    </div>
  );
}

export default RegisterPage;
