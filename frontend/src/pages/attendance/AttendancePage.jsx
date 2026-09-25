import React, { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  Coffee,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth.store';
import { useAttendanceStore } from '../../store/attendance.store';
import {
  useTodayStatus,
  useCheckIn,
  useCheckOut,
  useStartBreak,
  useEndBreak,
} from '../../hooks/useAttendance';

import { AttendanceCard } from '../../components/attendance/AttendanceCard';
import { ModeSelector } from '../../components/attendance/ModeSelector';
import { CameraCapture } from '../../components/attendance/CameraCapture';
import { LivenessCheck } from '../../components/attendance/LivenessCheck';
import { FaceMatch } from '../../components/attendance/FaceMatch';
import { GeoLocation } from '../../components/attendance/GeoLocation';
import { BreakTimer } from '../../components/attendance/BreakTimer';
import QRScanModal from '../../components/attendance/QRScanModal';
import { QrCode } from 'lucide-react';

export const AttendancePage = () => {
  const { user } = useAuthStore();
  const {
    todayStatus,
    setTodayStatus,
    isCheckedIn,
    isOnBreak,
    activeBreak,
    breaks,
    activeMode,
    setActiveMode,
  } = useAttendanceStore();

  const { data: statusResponse, isLoading: isLoadingStatus, refetch: refetchStatus } = useTodayStatus();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  // Wizard state for punch operations: null | 'CHECK_IN' | 'CHECK_OUT'
  const [activeAction, setActiveAction] = useState(null);
  const [wizardStep, setWizardStep] = useState(1); // 1: Camera, 2: Liveness, 3: FaceMatch, 4: Geo, 5: Ready
  const [photo, setPhoto] = useState(null);
  const [livenessResult, setLivenessResult] = useState(null);
  const [faceMatchResult, setFaceMatchResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Sync today's status from backend
  useEffect(() => {
    if (statusResponse?.data) {
      setTodayStatus(statusResponse.data);
    }
  }, [statusResponse, setTodayStatus]);

  const resetWizard = () => {
    setActiveAction(null);
    setWizardStep(1);
    setPhoto(null);
    setLivenessResult(null);
    setFaceMatchResult(null);
    setLocation(null);
    setIsLocationValid(true);
    setCardNumber('');
    setRemarks('');
  };

  const startPunchFlow = (actionType) => {
    setActiveAction(actionType);
    setWizardStep(1);
    setPhoto(null);
    setLivenessResult(null);
    setFaceMatchResult(null);
  };

  const handleCameraCapture = (capturedPhoto) => {
    setPhoto(capturedPhoto);
    if (capturedPhoto) {
      // If face mode, proceed to liveness check
      if (activeMode === 'face') {
        setWizardStep(2);
      } else {
        setWizardStep(4); // Skip face layers for card/finger
      }
    }
  };

  const handleLivenessComplete = (res) => {
    setLivenessResult(res);
    setWizardStep(3); // Go to Face Match
  };

  const handleFaceMatchResult = (res) => {
    setFaceMatchResult(res);
    setWizardStep(4); // Go to Geo Location
  };

  const handleLocationValid = (valid) => {
    setIsLocationValid(valid);
  };

  const submitPunch = async () => {
    if (!location) {
      toast.error('Location coordinates required before submission');
      return;
    }
    if (!isLocationValid) {
      toast.error('You are outside the authorized office geofence perimeter');
      return;
    }

    const payload = {
      mode: activeMode,
      photo: photo || undefined,
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        source: location.source || 'gps',
        timestamp: location.timestamp || Date.now(),
      },
      deviceInfo: {
        deviceId: 'web-browser-' + (user?.id || 'client'),
        isMockLocation: location.isMockLocation || false,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      },
      cardNumber: activeMode === 'card' ? cardNumber : undefined,
      remarks: remarks || undefined,
    };

    try {
      if (activeAction === 'CHECK_IN') {
        const res = await checkInMutation.mutateAsync(payload);
        toast.success(res.message || 'Check-in recorded successfully!');
      } else if (activeAction === 'CHECK_OUT') {
        const res = await checkOutMutation.mutateAsync(payload);
        toast.success(res.message || 'Check-out recorded successfully!');
      }
      refetchStatus();
      resetWizard();
    } catch (err) {
      toast.error(err.message || 'Attendance verification rejected');
    }
  };

  const handleStartBreak = async (breakType = 'TEA_BREAK') => {
    try {
      const payload = {
        breakType,
        deviceInfo: {
          deviceId: 'web-browser-' + (user?.id || 'client'),
          userAgent: navigator.userAgent,
        },
      };
      const res = await startBreakMutation.mutateAsync(payload);
      toast.success(res.message || 'Break started. Timer running.');
      refetchStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate break');
    }
  };

  const handleEndBreak = async () => {
    try {
      const payload = {
        deviceInfo: {
          deviceId: 'web-browser-' + (user?.id || 'client'),
          userAgent: navigator.userAgent,
        },
      };
      const res = await endBreakMutation.mutateAsync(payload);
      toast.success(res.message || 'Break ended. Shift resumed.');
      refetchStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to end break');
    }
  };

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Biometric Security Terminal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Attendance Verification
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Multi-layer defense: Optical Liveness, 128-D Cosine Face Match, Haversine Geofence & Device Integrity
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetchStatus()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStatus ? 'animate-spin text-indigo-400' : ''}`} />
          Sync State
        </button>
      </div>

      {/* Active Break Banner */}
      {isOnBreak && (
        <BreakTimer
          activeBreak={activeBreak}
          onEndBreak={handleEndBreak}
          isEnding={endBreakMutation.isPending}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Punch Flow or Status */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today Status Card */}
          <AttendanceCard
            attendance={todayStatus?.attendance}
            breaks={todayStatus?.breaks || breaks}
          />

          {/* Action Trigger Buttons (If not actively in wizard) */}
          {!activeAction && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <ModeSelector
                  selectedMode={activeMode}
                  onSelect={(mode) => setActiveMode(mode)}
                />
              </div>

              <div className="mt-6 space-y-3">
                {activeMode === 'card' ? (
                  <button
                    type="button"
                    onClick={() => setIsQRModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <QrCode className="h-5 w-5" />
                    Open QR Card Scanner Terminal
                  </button>
                ) : !isCheckedIn ? (
                  <button
                    type="button"
                    onClick={() => startPunchFlow('CHECK_IN')}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <LogIn className="h-5 w-5" />
                    Initiate Check-In (Multi-Layer Verification)
                  </button>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={isOnBreak}
                      onClick={() => handleStartBreak('TEA_BREAK')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-40"
                    >
                      <Coffee className="h-4 w-4" />
                      Take Short Break
                    </button>

                    <button
                      type="button"
                      disabled={isOnBreak}
                      onClick={() => handleStartBreak('LUNCH_BREAK')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 hover:bg-orange-500/20 transition-all disabled:opacity-40"
                    >
                      <Coffee className="h-4 w-4" />
                      Lunch Break
                    </button>

                    <button
                      type="button"
                      disabled={isOnBreak}
                      onClick={() => startPunchFlow('CHECK_OUT')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                      <LogOut className="h-4 w-4" />
                      Check Out Shift
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Multi-Layer Verification Wizard */}
          {activeAction && (
            <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
              {/* Wizard Steps Header */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {activeAction === 'CHECK_IN' ? 'Check-In Verification' : 'Check-Out Verification'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step {wizardStep} of 4: {
                        wizardStep === 1 ? 'Optical Camera Capture' :
                        wizardStep === 2 ? 'Anti-Spoof Gesture Liveness' :
                        wizardStep === 3 ? 'Facial Vector Matching' :
                        'Geofence & Device Attestation'
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetWizard}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>

              {/* Wizard Content by Step */}
              <div className="space-y-6">
                {wizardStep === 1 && (
                  <CameraCapture onCapture={handleCameraCapture} />
                )}

                {wizardStep === 2 && (
                  <LivenessCheck
                    employeeId={user?.employeeId || user?.id}
                    onComplete={handleLivenessComplete}
                    onCancel={resetWizard}
                  />
                )}

                {wizardStep === 3 && (
                  <FaceMatch
                    photo={photo}
                    onResult={handleFaceMatchResult}
                  />
                )}

                {wizardStep >= 4 && (
                  <div className="space-y-5">
                    <GeoLocation
                      onLocation={(loc) => setLocation(loc)}
                      onValid={handleLocationValid}
                    />

                    {activeMode === 'card' && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                          RFID / NFC Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CARD-98765"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Optional Remarks / Shift Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Client meeting or on-site deployment"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ← Start Over
                      </button>

                      <button
                        type="button"
                        disabled={
                          !location ||
                          !isLocationValid ||
                          checkInMutation.isPending ||
                          checkOutMutation.isPending
                        }
                        onClick={submitPunch}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {checkInMutation.isPending || checkOutMutation.isPending
                          ? 'Cryptographic Verification...'
                          : `Confirm & Submit ${activeAction === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Shift Info & Multi-Layer Diagnostics */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
              Multi-Layer Defense Status
            </h4>

            <div className="mt-4 space-y-3.5">
              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-slate-200">Interactive 3D Liveness</h5>
                  <p className="text-[11px] text-slate-400">Continuous micro-gesture anti-spoofing</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-slate-200">128-D Cosine Vectorizer</h5>
                  <p className="text-[11px] text-slate-400">75% biometric similarity threshold</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-slate-200">Haversine GPS Geofence</h5>
                  <p className="text-[11px] text-slate-400">100m maximum office boundary radius</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-slate-200">Device Integrity & Mock Location</h5>
                  <p className="text-[11px] text-slate-400">Hardware fingerprint & spoofing detection</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
              Office Shift Guidelines
            </h4>
            <div className="mt-4 space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Standard Shift:</span>
                <span className="font-semibold text-slate-200">09:00 AM - 06:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Grace Window:</span>
                <span className="font-semibold text-emerald-400">15 Minutes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Half-Day Threshold:</span>
                <span className="font-semibold text-amber-400">240 Minutes</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Full-Day Requirement:</span>
                <span className="font-semibold text-indigo-400">480 Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Card Scanner Modal */}
      <QRScanModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          refetchStatus();
        }}
        onSuccess={() => {
          refetchStatus();
        }}
      />
    </div>
  );
};
export default AttendancePage;
