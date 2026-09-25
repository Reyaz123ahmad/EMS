import React from 'react';
import { ShieldCheck, UserCheck, QrCode } from 'lucide-react';

export default function CardPreview({
  employee = {},
  company = {},
  card = {},
  qrCodeUrl = null,
  compact = false
}) {
  const firstName = employee?.firstName || 'John';
  const lastName = employee?.lastName || 'Doe';
  const employeeCode = employee?.employeeCode || 'EMP-001';
  const departmentName = employee?.department?.name || 'Engineering';
  const designationName = employee?.designation?.name || 'Full Stack Engineer';
  const cardNumber = card?.cardNumber || 'EMP0001';
  const photoUrl = employee?.photoUrl;
  const companyName = company?.name || employee?.company?.name || 'Edudibon EMS';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 shadow-2xl text-white ${
        compact ? 'w-80 p-4' : 'w-full max-w-sm p-6'
      }`}
    >
      {/* Background Holographic Ribbon */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            {companyName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-slate-100">{companyName}</h3>
            <span className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">Identity Badge</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>VERIFIED</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="mt-4 flex items-center gap-4">
        {/* Avatar Photo */}
        <div className="relative w-20 h-24 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-600 shadow-inner flex items-center justify-center shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Employee" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
              <UserCheck className="w-8 h-8 opacity-60" />
              <span className="text-[9px] mt-1 font-mono">PHOTO</span>
            </div>
          )}
        </div>

        {/* Employee Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-base font-bold text-slate-100 truncate">{`${firstName} ${lastName}`}</h4>
          <p className="text-xs font-semibold text-indigo-300 truncate">{designationName}</p>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p className="truncate">Dept: <span className="text-slate-200">{departmentName}</span></p>
            <p>Code: <span className="font-mono text-slate-200">{employeeCode}</span></p>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Card ID</p>
          <p className="font-mono text-xs font-bold text-amber-400">{cardNumber}</p>
          <p className="text-[9px] text-slate-500">Secured with HMAC-SHA256</p>
        </div>

        <div className="w-16 h-16 bg-white rounded-lg p-1 shadow-md flex items-center justify-center">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
          ) : card?.qrUrl ? (
            <img src={card.qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-12 h-12 text-slate-800" />
          )}
        </div>
      </div>

      {/* Footer Strip */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 text-center">
        <p className="text-[9px] text-slate-500 tracking-tight">
          Property of {companyName} • If found, please return to security desk.
        </p>
      </div>
    </div>
  );
}
