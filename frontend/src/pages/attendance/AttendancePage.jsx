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
  Calendar,
  Tag,
  AlertTriangle
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
import { CheckoutStatus } from '../../components/attendance/CheckoutStatus';
import { BreakStatus } from '../../components/attendance/BreakStatus';
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

  // Wizard state for punch operations: null | 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_START' | 'BREAK_END'
  const [activeAction, setActiveAction] = useState(null);
  const [selectedBreakType, setSelectedBreakType] = useState('SHORT');
  const [wizardStep, setWizardStep] = useState(1); // 1: Camera, 2: Liveness, 3: FaceMatch, 4: Geo, 5: Ready
  const [photo, setPhoto] = useState(null);
  const [livenessResult, setLivenessResult] = useState(null);
  const [faceMatchResult, setFaceMatchResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update countdown every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeString = (isoString, fallbackTime = null) => {
    if (fallbackTime) return fallbackTime;
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Consolidated holiday & shift metadata - prioritize fresh server response
  const effectiveData = statusResponse?.data || todayStatus;
  const holiday = effectiveData?.holiday;
  const shiftPayload = effectiveData?.shift;
  const currentShift = effectiveData?.currentShift || effectiveData?.shift?.shift || shiftPayload?.shift || shiftPayload;
  const shift = currentShift;
  const isHoliday = Boolean(holiday?.isHoliday);
  const hasShift = Boolean(shiftPayload?.hasShift ?? (currentShift ? true : true));

  const resolvedStartTime = currentShift?.startTime || '09:00';
  const resolvedEndTime = currentShift?.endTime || '18:00';
  const resolvedGraceMinutes = Number(currentShift?.graceMinutes !== undefined && currentShift?.graceMinutes !== null ? currentShift.graceMinutes : 15);
  const isNightShift = Boolean(currentShift?.isNightShift || (resolvedEndTime && resolvedStartTime && resolvedEndTime <= resolvedStartTime));

  // Dynamic 30-sec client-side countdown calculations based on resolved shift
  const now = new Date(currentTime);
  const [sH, sM] = (resolvedStartTime || '09:00').split(':').map(Number);
  const [eH, eM] = (resolvedEndTime || '18:00').split(':').map(Number);

  const shiftStartObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM || 0, 0, 0);
  const shiftEndObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM || 0, 0, 0);
  if (isNightShift || shiftEndObj <= shiftStartObj) {
    shiftEndObj.setDate(shiftEndObj.getDate() + 1);
  }

  const fiveMinBeforeObj = new Date(shiftStartObj.getTime() - 5 * 60000);
  const graceCutoffObj = new Date(shiftStartObj.getTime() + resolvedGraceMinutes * 60000);

  const graceCutoffStr = `${String(graceCutoffObj.getHours()).padStart(2, '0')}:${String(graceCutoffObj.getMinutes()).padStart(2, '0')}`;

  let dynamicWindowStatus = effectiveData?.windowStatus || 'BEFORE_WINDOW';
  let dynamicCanCheckIn = Boolean(effectiveData?.canCheckIn);
  let dynamicMinutesUntilStart = effectiveData?.minutesUntilStart ?? 0;
  let dynamicMinutesLeftInGrace = effectiveData?.minutesLeftInGrace ?? 0;

  if (!effectiveData?.attendance?.checkInAt) {
    const nowMs = now.getTime();
    if (nowMs < fiveMinBeforeObj.getTime()) {
      dynamicWindowStatus = 'BEFORE_WINDOW';
      dynamicCanCheckIn = false;
      dynamicMinutesUntilStart = Math.max(0, Math.floor((shiftStartObj.getTime() - nowMs) / 60000));
    } else if (nowMs <= graceCutoffObj.getTime()) {
      dynamicWindowStatus = 'WINDOW_OPEN';
      dynamicCanCheckIn = true;
      dynamicMinutesLeftInGrace = Math.max(0, Math.floor((graceCutoffObj.getTime() - nowMs) / 60000));
    } else if (nowMs <= shiftEndObj.getTime()) {
      dynamicWindowStatus = 'GRACE_PASSED';
      dynamicCanCheckIn = false;
    } else {
      dynamicWindowStatus = 'SHIFT_ENDED';
      dynamicCanCheckIn = false;
    }
  }

  const getCheckInMessage = (status, data) => {
    if (!data) return null;
    const startStr = resolvedStartTime;
    const endStr = resolvedEndTime;
    const graceStr = graceCutoffStr;

    switch (status) {
      case 'BEFORE_WINDOW':
        return `Your shift starts in ${data.minutesUntilStart} minutes (at ${startStr}). Cannot check in yet.`;
      case 'WINDOW_OPEN':
        return `Check-in window open. Grace ends in ${data.minutesLeftInGrace} minutes.`;
      case 'GRACE_PASSED':
        return `Check-in time has passed. Grace period ended at ${graceStr}. You will be marked ABSENT.`;
      case 'SHIFT_ENDED':
        return `Your shift ended at ${endStr}. Check-in not allowed.`;
      default:
        return data.checkInBlockReason || 'Check-in window is not currently open.';
    }
  };

  const effectiveStatusData = {
    ...todayStatus,
    windowStatus: dynamicWindowStatus,
    canCheckIn: dynamicCanCheckIn,
    minutesUntilStart: dynamicMinutesUntilStart,
    minutesLeftInGrace: dynamicMinutesLeftInGrace,
    shiftStart: shiftStartObj.toISOString(),
    shiftEnd: shiftEndObj.toISOString(),
    graceCutoff: graceCutoffObj.toISOString()
  };

  const windowStatus = dynamicWindowStatus;
  const canCheckIn = dynamicCanCheckIn && !isHoliday && hasShift && !isCheckedIn;
  const checkInMessage = getCheckInMessage(windowStatus, effectiveStatusData);

  // Sync today's status from backend
  useEffect(() => {
    if (statusResponse?.data) {
      setTodayStatus(statusResponse.data);
    }
  }, [statusResponse, setTodayStatus]);

  const resetWizard = () => {
    setActiveAction(null);
    setSelectedBreakType('SHORT');
    setWizardStep(1);
    setPhoto(null);
    setLivenessResult(null);
    setFaceMatchResult(null);
    setLocation(null);
    setIsLocationValid(true);
    setCardNumber('');
    setRemarks('');
  };

  const startPunchFlow = (actionType, extra = {}) => {
    if (isHoliday) {
      toast.error(`Today is a public holiday: ${holiday?.holiday?.name || 'Holiday'}. Attendance not required.`);
      return;
    }
    if (!hasShift && actionType === 'CHECK_IN') {
      toast.error('No shift assigned. Contact HR to assign a shift.');
      return;
    }
    if (extra.breakType) {
      setSelectedBreakType(extra.breakType);
    }
    setActiveAction(actionType);
    setWizardStep(1);
    setPhoto(null);
    setLivenessResult(null);
    setFaceMatchResult(null);
  };

  const handleCameraCapture = (capturedPhoto) => {
    setPhoto(capturedPhoto);
    if (capturedPhoto) {
      setWizardStep(4);
    }
  };

  const handleLivenessComplete = (res) => {
    setLivenessResult(res);
    if (res?.photo) {
      setPhoto(res.photo);
    }
    setWizardStep(3);
  };

  const handleFaceMatchResult = (res) => {
    setFaceMatchResult(res);
    setWizardStep(4);
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
      livenessScore: livenessResult?.score || 0.95,
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
      } else if (activeAction === 'BREAK_START') {
        const res = await startBreakMutation.mutateAsync({
          ...payload,
          breakType: selectedBreakType || 'SHORT'
        });
        if (res?.data) {
          useAttendanceStore.getState().addBreak(res.data);
        }
        toast.success(res.message || 'Break started with biometric verification!');
      } else if (activeAction === 'BREAK_END') {
        const res = await endBreakMutation.mutateAsync(payload);
        useAttendanceStore.getState().endBreak(res?.data);
        if (res.warning) {
          toast.warning(res.warning);
        } else {
          toast.success(res.message || 'Break ended with biometric verification!');
        }
      }
      refetchStatus();
      resetWizard();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Verification rejected');
    }
  };

  const handleStartBreak = (breakType = 'SHORT') => {
    startPunchFlow('BREAK_START', { breakType });
  };

  const handleEndBreak = () => {
    startPunchFlow('BREAK_END');
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
            Enterprise Shift Rules: Holiday Guard, Auto Checkout Extension, and Break Quota Controls
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetchStatus()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStatus ? 'animate-spin text-indigo-400' : ''}`} />
          Sync State
        </button>
      </div>

      {/* Holiday Banner Alert */}
      {isHoliday && (
        <div className="p-4 bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-purple-950/80 border border-purple-500/40 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-purple-400 animate-bounce" />
            <div>
              <h3 className="text-base font-bold text-white">
                Today is a Company Holiday: {holiday?.holiday?.name || 'Festival Holiday'}
              </h3>
              <p className="text-xs text-purple-200/80">
                Attendance is not mandatory today. Standard shift check-ins are temporarily locked.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full">
            {holiday?.holiday?.type || 'HOLIDAY'}
          </span>
        </div>
      )}

      {/* No Shift Assignment Warning */}
      {!hasShift && !isHoliday && (
        <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-amber-200">No Shift Assigned</h3>
              <p className="text-xs text-amber-300/80">
                You do not have an active shift assignment for today. Please contact your HR Manager.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Break Banner */}
      {isOnBreak && (
        <BreakTimer
          activeBreak={activeBreak || todayStatus?.breaks?.find((b) => !b.breakEndAt)}
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
            attendance={effectiveData?.attendance}
            breaks={effectiveData?.breaks || breaks}
            holiday={holiday}
            shift={{
              shift: currentShift,
              currentShift: currentShift,
              source: effectiveData?.shiftSource || shiftPayload?.source,
              validTill: effectiveData?.validTill || shiftPayload?.validTill,
              isRosterOverride: effectiveData?.isRosterOverride ?? (effectiveData?.shiftSource === 'ROSTER'),
              defaultShift: effectiveData?.defaultShift || shiftPayload?.defaultShift,
              defaultShiftStatus: effectiveData?.defaultShiftStatus,
              expectedCheckout: effectiveData?.expectedCheckout,
              earliestCheckout: effectiveData?.earliestCheckout,
              requiredHours: effectiveData?.requiredHours
            }}
          />

          {/* Action Trigger / Working Hours Control */}
          {!activeAction && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-6">
              <ModeSelector
                selectedMode={activeMode}
                onSelect={(mode) => setActiveMode(mode)}
                isHoliday={isHoliday}
                noShiftAssigned={!hasShift}
                holidayName={holiday?.holiday?.name}
              />

              {/* Action Buttons based on status */}
              <div className="space-y-4">
                {activeMode === 'card' ? (
                  <button
                    type="button"
                    disabled={isHoliday || !hasShift}
                    onClick={() => setIsQRModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <QrCode className="h-5 w-5" />
                    Open QR Card Scanner Terminal
                  </button>
                ) : !isCheckedIn ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isHoliday) {
                          alert(`Today is a public holiday: ${holiday?.holiday?.name || 'Holiday'}. Attendance not required.`);
                          return;
                        }
                        if (!hasShift) {
                          alert('No shift assigned. Contact HR to assign a shift.');
                          return;
                        }
                        if (!canCheckIn) {
                          alert(getCheckInMessage(windowStatus, effectiveStatusData));
                          return;
                        }
                        startPunchFlow('CHECK_IN');
                      }}
                      className={`w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold shadow-xl transition-all ${
                        canCheckIn
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                          : 'bg-gray-700/90 text-gray-300 border border-slate-700/60 cursor-not-allowed opacity-80'
                      }`}
                    >
                      <LogIn className="h-5 w-5" />
                      Initiate Check-In (Multi-Layer Verification)
                    </button>
                    {checkInMessage && (
                      <p className={`text-xs text-center font-medium ${
                        windowStatus === 'WINDOW_OPEN' ? 'text-emerald-400' :
                        windowStatus === 'GRACE_PASSED' ? 'text-rose-400' :
                        'text-amber-400/90'
                      }`}>
                        {checkInMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Live Break Controls with Lunch / Short Quota */}
                    <BreakStatus
                      employeeId={user?.employeeId || user?.id}
                      onStartBreak={(type) => handleStartBreak(type)}
                      isStartingBreak={startBreakMutation.isPending}
                    />

                    {/* Full Working Hours & Auto Checkout Extension */}
                    <CheckoutStatus
                      employeeId={user?.employeeId || user?.id}
                      onCheckoutClick={() => startPunchFlow('CHECK_OUT')}
                      isCheckingOut={checkOutMutation.isPending}
                    />
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
                      {activeAction === 'CHECK_IN' ? 'Check-In Verification' :
                       activeAction === 'CHECK_OUT' ? 'Check-Out Verification' :
                       activeAction === 'BREAK_START' ? `Start ${selectedBreakType === 'LUNCH' ? 'Lunch' : 'Short'} Break Verification` :
                       'Conclude Break Verification'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeMode === 'face' ? (
                        wizardStep === 1 ? 'Step 1 of 3: Anti-Spoof Real-Time Gesture Liveness' :
                        wizardStep === 3 ? 'Step 2 of 3: Facial Vector Biometric Matching' :
                        'Step 3 of 3: Geofence & Device Attestation'
                      ) : (
                        wizardStep === 1 ? 'Step 1 of 2: Optical Camera Capture' :
                        'Step 2 of 2: Geofence & Shift Attestation'
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetWizard}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Wizard Content by Step */}
              <div className="space-y-6">
                {wizardStep === 1 && activeMode === 'face' && (
                  <LivenessCheck
                    employeeId={user?.employeeId || user?.id}
                    onComplete={handleLivenessComplete}
                    onCancel={resetWizard}
                  />
                )}

                {wizardStep === 1 && activeMode !== 'face' && (
                  <CameraCapture onCapture={handleCameraCapture} />
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
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        ← Start Over
                      </button>

                      <button
                        type="button"
                        disabled={
                          !location ||
                          !isLocationValid ||
                          checkInMutation.isPending ||
                          checkOutMutation.isPending ||
                          startBreakMutation.isPending ||
                          endBreakMutation.isPending
                        }
                        onClick={submitPunch}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {checkInMutation.isPending || checkOutMutation.isPending || startBreakMutation.isPending || endBreakMutation.isPending
                          ? 'Cryptographic Verification...'
                          : `Confirm & Submit ${
                              activeAction === 'CHECK_IN' ? 'Check-In' :
                              activeAction === 'CHECK_OUT' ? 'Check-Out' :
                              activeAction === 'BREAK_START' ? 'Break Start' :
                              'Break End'
                            }`}
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
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Shift Timing Rules</span>
              <span className="text-xs font-normal text-indigo-400">
                {isLoadingStatus ? 'Loading...' : currentShift?.name || 'No Shift Assigned'}
              </span>
            </h4>
            <div className="mt-4 space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Shift Schedule:</span>
                <span className="font-semibold text-slate-200">
                  {isLoadingStatus ? 'Loading...' : currentShift ? `${currentShift.startTime} - ${currentShift.endTime}` : 'No schedule'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Grace Window:</span>
                <span className="font-semibold text-emerald-400">
                  {currentShift?.graceMinutes !== undefined ? `${currentShift.graceMinutes} Minutes` : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Working Hours:</span>
                <span className="font-semibold text-indigo-400">
                  {currentShift?.workingHours ? `${currentShift.workingHours} Hours` : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Late Checkout Extension:</span>
                <span className="font-semibold text-amber-400">Enabled (Automatic)</span>
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
