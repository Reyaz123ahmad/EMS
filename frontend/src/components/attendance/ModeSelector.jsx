import React from 'react';
import { ScanFace, CreditCard, Fingerprint, Lock, Sparkles, AlertCircle } from 'lucide-react';

const MODES = [
  {
    id: 'face',
    title: 'Facial Biometrics',
    description: 'AI-driven 3D depth, liveness & cosine match',
    icon: ScanFace,
    color: 'from-indigo-500 to-purple-600',
    badge: 'High Security',
  },
  {
    id: 'card',
    title: 'Smart RFID Card',
    description: 'NFC contactless tap card credentials',
    icon: CreditCard,
    color: 'from-blue-500 to-cyan-600',
    badge: 'Fast Tap',
  },
  {
    id: 'finger',
    title: 'Hardware Fingerprint',
    description: 'Cryptographic biometric USB sensor',
    icon: Fingerprint,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Hardware Sync',
  },
];

export const ModeSelector = ({
  selectedMode = 'face',
  enabledModes = { face: true, card: true, finger: true },
  onSelect,
  isHoliday = false,
  isWeeklyOff = false,
  isOnLeave = false,
  noShiftAssigned = false,
  holidayName = '',
  leaveTypeName = '',
  blockedReason = null
}) => {
  const isBlocked = isHoliday || isWeeklyOff || isOnLeave || noShiftAssigned || Boolean(blockedReason);

  const getBlockedText = () => {
    if (blockedReason) return blockedReason;
    if (isHoliday) return `Biometric check-in is disabled today due to ${holidayName || 'Public Holiday'}.`;
    if (isWeeklyOff) return 'Biometric check-in is disabled because today is your weekly off.';
    if (isOnLeave) return `Biometric check-in is disabled because you are on approved leave today${leaveTypeName ? ` (${leaveTypeName})` : ''}.`;
    if (noShiftAssigned) return 'Biometric check-in is disabled because no active shift is assigned. Please contact HR.';
    return 'Biometric check-in is currently unavailable.';
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Biometric Verification Mode
        </label>
        <span className="flex items-center gap-1 text-xs text-indigo-400 font-medium">
          <Sparkles className="h-3 w-3" /> Multi-Factor Enabled
        </span>
      </div>

      {isBlocked && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="leading-relaxed">{getBlockText()}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((mode) => {
          const isEnabled = !isBlocked && (enabledModes[mode.id] ?? true);
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => isEnabled && onSelect && onSelect(mode.id)}
              className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                isSelected && isEnabled
                  ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                  : isEnabled
                  ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer'
                  : 'border-slate-800/40 bg-slate-950/40 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${mode.color} text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {!isEnabled ? (
                  <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                    {mode.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-bold text-white">{mode.title}</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{mode.description}</p>
              </div>

              {isSelected && isEnabled && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
