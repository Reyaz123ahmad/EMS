import React from 'react';
import { cn } from '../../lib/utils.js';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';

export function EmailPreview({
  type = 'OTP', // 'OTP' | 'CREDENTIALS' | 'WELCOME'
  recipientName = 'John Doe',
  recipientEmail = 'john.doe@example.com',
  companyName = 'Acme Corp',
  otp = '123456',
  temporaryPassword = 'SecurePass@123',
  role = 'EMPLOYEE',
  onClose
}) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-4">
      {/* Email Client Simulated Header */}
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl text-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-semibold text-slate-300">Live Email Preview</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-16">From:</span>
          <span className="text-slate-300 font-mono">Mindstocs EMS &lt;no-reply@mindstocs.com&gt;</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-16">To:</span>
          <span className="text-slate-300 font-mono">{recipientName} &lt;{recipientEmail}&gt;</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-16">Subject:</span>
          <span className="text-slate-200 font-medium">
            {type === 'OTP' && `Your Verification Code: ${otp} - ${companyName}`}
            {type === 'CREDENTIALS' && `Welcome to ${companyName} - Account Credentials`}
            {type === 'WELCOME' && `Welcome to ${companyName}!`}
          </span>
        </div>
      </div>

      {/* Rendered Template Body */}
      <div className="rounded-2xl border border-slate-700 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden font-sans">
        {/* Header Gradient */}
        <div
          className={cn(
            'rounded-xl p-6 text-center text-white mb-6 shadow-md',
            type === 'OTP'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-600'
              : type === 'CREDENTIALS'
              ? 'bg-gradient-to-r from-emerald-700 to-teal-600'
              : 'bg-gradient-to-r from-sky-600 to-blue-700'
          )}
        >
          <h2 className="text-xl sm:text-2xl font-bold">{companyName}</h2>
          <p className="text-xs sm:text-sm text-slate-100 mt-1 opacity-90">
            {type === 'OTP' && 'Security & Verification Center'}
            {type === 'CREDENTIALS' && 'Enterprise Portal Access'}
            {type === 'WELCOME' && 'Your Workspace is Ready'}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900 text-base">Hello {recipientName},</p>

          {type === 'OTP' && (
            <>
              <p>
                We received a request to verify your account for <strong>{companyName}</strong>. Use the one-time verification code below to complete setup:
              </p>
              <div className="my-6 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/50 p-6 text-center">
                <div className="font-mono text-3xl font-extrabold tracking-widest text-blue-700">
                  {otp}
                </div>
                <div className="text-xs text-slate-500 mt-2">Valid for 10 minutes</div>
              </div>
              <div className="rounded-lg bg-amber-50 border-l-4 border-amber-500 p-3 text-xs text-amber-900">
                <strong>Security Notice:</strong> Never share this code with anyone.
              </div>
            </>
          )}

          {type === 'CREDENTIALS' && (
            <>
              <p>
                Your account on <strong>{companyName}</strong> has been created. Below are your initial credentials:
              </p>
              <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Login Email:</span>
                  <span className="font-mono font-semibold text-slate-900">{recipientEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Temporary Password:</span>
                  <span className="font-mono font-semibold text-emerald-700">{temporaryPassword}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-slate-900">{role}</span>
                </div>
              </div>
              <div className="text-center my-6">
                <span className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md">
                  Login to Portal
                </span>
              </div>
            </>
          )}

          {type === 'WELCOME' && (
            <>
              <p>Welcome to the team! Your portal gives you access to geo-fenced attendance, payroll, leaves, and documents.</p>
              <div className="text-center my-6">
                <span className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md">
                  Explore Workspace
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {companyName}. Powered by Mindstocs EMS.
        </div>
      </div>
    </div>
  );
}

export default EmailPreview;
