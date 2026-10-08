import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import attendanceService from '../../services/attendance.service';
import CameraModal from '../../components/CameraModal';
import {
  Clock,
  Camera,
  LogOut,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  ShieldCheck,
  MapPin,
  RefreshCw,
  CreditCard,
  ScanFace,
  Sparkles,
  Tag,
  AlertTriangle,
  Timer,
  Lock,
} from 'lucide-react-native';

// Custom Crisp Fingerprint SVG Icon
function FingerprintIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 13.6569 2.40177 15.2201 3.11108 16.5962M22 12C22 6.47715 17.5228 2 12 2M22 12C22 14.2091 21.2844 16.2513 20.0718 17.9048M12 6C8.68629 6 6 8.68629 6 12C6 14.5308 7.56846 16.6953 9.78912 17.5755M18 12C18 8.68629 15.3137 6 12 6M12 10C10.8954 10 10 10.8954 10 12C10 13.9189 11.3414 15.5244 13.1257 15.9084M14 12C14 10.8954 13.1046 10 12 10M12 18V22M8 21V22M16 21V22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AttendanceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('face'); // 'face' | 'rfid' | 'fingerprint'
  const [rfidCardNumber, setRfidCardNumber] = useState('');
  const [showRfidInput, setShowRfidInput] = useState(false);

  // High-precision realtime 1-second ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's full attendance status (30s interval with 15s staleTime)
  const {
    data: todayData,
    isLoading: todayLoading,
    refetch: refetchToday,
  } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getTodayStatus(),
    staleTime: 15000,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 2000,
  });

  // Fetch dedicated break status (shared key, 30s interval with 15s staleTime)
  const {
    data: breakData,
    refetch: refetchBreakStatus,
  } = useQuery({
    queryKey: ['attendance', 'break-status'],
    queryFn: () => attendanceService.getBreakStatus(),
    staleTime: 15000,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 2000,
  });

  // Fetch attendance logs history
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['attendance', 'logs'],
    queryFn: () => attendanceService.getLogs({ page: 1, limit: 15 }),
    staleTime: 30000,
    retry: 2,
    retryDelay: 2000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
    setRefreshing(false);
  }, [refetchToday, refetchBreakStatus, refetchLogs]);

  // Derived Attendance States
  const todayLog = todayData?.log || todayData?.attendance;
  const checkedIn = Boolean(
    todayData?.checkedIn ||
    todayData?.isCheckedIn ||
    todayData?.checkIn ||
    todayLog?.checkInAt
  );
  const checkedOut = Boolean(
    todayData?.checkedOut ||
    todayData?.isCheckedOut ||
    todayData?.checkOut ||
    todayLog?.checkOutAt
  );
  const canCheckIn = Boolean(todayData?.canCheckIn);
  const canCheckOut = Boolean(todayData?.canCheckOut ?? true);
  const checkInBlockReason = todayData?.checkInBlockReason;

  // Derived Break States
  const onBreak = Boolean(breakData?.onBreak || todayData?.isOnBreak || todayData?.onBreak);
  const breakStart = breakData?.breakStart || todayData?.activeBreak?.startTime || breakData?.activeBreak?.startTime;
  const totalBreakMinutes = breakData?.totalBreakMinutes ?? (todayData?.breaks?.reduce((acc, b) => acc + (b.totalBreakMinutes || b.durationMinutes || 0), 0) ?? 0);
  const sessionCount = breakData?.sessionCount ?? (todayData?.breaks?.length ?? 0);

  // Live Break Elapsed Timer (ticking every 1s)
  const [breakElapsed, setBreakElapsed] = useState(0);

  useEffect(() => {
    if (!onBreak || !breakStart) {
      setBreakElapsed(0);
      return;
    }
    const startTimeMs = new Date(breakStart).getTime();
    const updateElapsed = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
      setBreakElapsed(diffSecs);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [onBreak, breakStart]);

  // Holiday, Leave, Weekly Off Metadata
  const holiday = todayData?.holiday;
  const weeklyOff = todayData?.weeklyOff;
  const leave = todayData?.leave;
  const isHoliday = Boolean(holiday?.isHoliday);
  const isWeeklyOff = Boolean(weeklyOff?.isWeeklyOff);
  const isOnLeave = Boolean(leave?.isOnLeave);

  // Shift details
  const shift = todayData?.currentShift || todayData?.shift?.shift || todayData?.shift;
  const hasShift = Boolean(shift?.name || shift?.startTime);
  const resolvedShiftName = shift?.name || (hasShift ? 'Assigned Shift' : 'No shift assigned');
  const resolvedStartTime = shift?.startTime || (hasShift ? '21:00' : '--:--');
  const resolvedEndTime = shift?.endTime || (hasShift ? '06:00' : '--:--');
  const resolvedGraceMinutes = Number(shift?.graceMinutes !== undefined ? shift.graceMinutes : 0);
  const isNightShift = Boolean(shift?.isNightShift || (resolvedEndTime && resolvedStartTime && resolvedEndTime <= resolvedStartTime));
  const isRoster = shift?.source === 'ROSTER' || shift?.isRosterOverride || todayLog?.shiftSource === 'ROSTER';

  // Planned shift working hours calculation
  const calculateShiftHours = (start, end, isNight = false) => {
    if (!start || !end) return 9;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    if (isNaN(sH) || isNaN(eH)) return 9;
    let sMin = sH * 60 + (sM || 0);
    let eMin = eH * 60 + (eM || 0);
    if (isNight || eMin <= sMin) eMin += 1440;
    return Number(((eMin - sMin) / 60).toFixed(1));
  };
  const plannedShiftHours = calculateShiftHours(resolvedStartTime, resolvedEndTime, isNightShift);

  // Dynamic 1-second countdown calculations based on resolved shift
  const now = currentTime;
  let shiftStartObj = null;
  let shiftEndObj = null;
  let fiveMinBeforeObj = null;
  let graceCutoffObj = null;
  let graceCutoffStr = '--:--';

  if (resolvedStartTime && resolvedEndTime) {
    const [sH, sM] = resolvedStartTime.split(':').map(Number);
    const [eH, eM] = resolvedEndTime.split(':').map(Number);

    shiftStartObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM || 0, 0, 0);
    shiftEndObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM || 0, 0, 0);
    if (isNightShift || shiftEndObj <= shiftStartObj) {
      shiftEndObj.setDate(shiftEndObj.getDate() + 1);
    }

    fiveMinBeforeObj = new Date(shiftStartObj.getTime() - 5 * 60000);
    graceCutoffObj = new Date(shiftStartObj.getTime() + resolvedGraceMinutes * 60000);
    graceCutoffStr = `${String(graceCutoffObj.getHours()).padStart(2, '0')}:${String(graceCutoffObj.getMinutes()).padStart(2, '0')}`;
  }

  // Determine Window Status & Countdown seconds
  let dynamicWindowStatus = todayData?.windowStatus || 'BEFORE_WINDOW';
  let countdownSecs = 0;

  if (!isHoliday && !isWeeklyOff && !isOnLeave && !checkedIn && fiveMinBeforeObj && graceCutoffObj && shiftEndObj && shiftStartObj) {
    const nowMs = now.getTime();
    if (nowMs < fiveMinBeforeObj.getTime()) {
      dynamicWindowStatus = 'BEFORE_WINDOW';
      countdownSecs = Math.max(0, Math.floor((shiftStartObj.getTime() - nowMs) / 1000));
    } else if (nowMs <= graceCutoffObj.getTime()) {
      dynamicWindowStatus = 'WINDOW_OPEN';
      countdownSecs = Math.max(0, Math.floor((graceCutoffObj.getTime() - nowMs) / 1000));
    } else if (nowMs <= shiftEndObj.getTime()) {
      dynamicWindowStatus = 'GRACE_PASSED';
      countdownSecs = 0;
    } else {
      dynamicWindowStatus = 'SHIFT_ENDED';
      countdownSecs = 0;
    }
  }

  // Expected Checkout calculation
  const expectedCheckoutTimeStr = useMemo(() => {
    if (todayData?.expectedCheckout) {
      return new Date(todayData.expectedCheckout).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (todayLog?.adjustedCheckOutTime) {
      return new Date(todayLog.adjustedCheckOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return resolvedEndTime;
  }, [todayData?.expectedCheckout, todayLog?.adjustedCheckOutTime, resolvedEndTime]);

  // Format Helpers
  const formatCountdown = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Status Banner Configurations
  let windowStatusInfo = {
    title: 'Checking Status',
    desc: 'Connecting to attendance server...',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  };

  if (isHoliday) {
    windowStatusInfo = {
      title: 'PUBLIC HOLIDAY',
      desc: `Today is a public holiday: ${holiday?.holiday?.name || 'Holiday'}. Attendance is optional.`,
      color: '#9333EA',
      bgColor: '#FAF5FF',
      borderColor: '#E9D5FF',
    };
  } else if (isWeeklyOff) {
    windowStatusInfo = {
      title: 'WEEKLY OFF',
      desc: 'Today is your scheduled weekly off. Enjoy your rest day!',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      borderColor: '#BAE6FD',
    };
  } else if (isOnLeave) {
    windowStatusInfo = {
      title: 'ON APPROVED LEAVE',
      desc: `You are on approved leave today${leave?.leave?.leaveTypeName ? ` (${leave.leave.leaveTypeName})` : ''}.`,
      color: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
    };
  } else if (!hasShift) {
    windowStatusInfo = {
      title: 'NO SHIFT ASSIGNED',
      desc: 'No active shift assigned. Please contact your HR administrator.',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
    };
  } else if (checkedOut) {
    windowStatusInfo = {
      title: 'WORKDAY COMPLETED',
      desc: `You clocked out at ${formatTime(todayLog?.checkOutAt || todayData?.checkOut)}. Have a great evening!`,
      color: '#475569',
      bgColor: '#F8FAFC',
      borderColor: '#E2E8F0',
    };
  } else if (checkedIn) {
    windowStatusInfo = {
      title: onBreak ? 'ON BREAK' : 'CHECKED IN (PRESENT)',
      desc: `Clocked in at ${formatTime(todayLog?.checkInAt || todayData?.checkIn)}. Expected checkout: ${expectedCheckoutTimeStr}.`,
      color: onBreak ? '#D97706' : '#059669',
      bgColor: onBreak ? '#FFFBEB' : '#ECFDF5',
      borderColor: onBreak ? '#FDE68A' : '#A7F3D0',
    };
  } else if (dynamicWindowStatus === 'BEFORE_WINDOW') {
    windowStatusInfo = {
      title: 'BEFORE SHIFT WINDOW',
      desc: `Your shift starts in ${formatCountdown(countdownSecs)} (at ${resolvedStartTime}). Cannot check in yet.`,
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
    };
  } else if (dynamicWindowStatus === 'WINDOW_OPEN') {
    windowStatusInfo = {
      title: 'CHECK-IN WINDOW OPEN',
      desc: `Check-in window open. Grace period ends in ${formatCountdown(countdownSecs)}.`,
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
    };
  } else if (dynamicWindowStatus === 'GRACE_PASSED') {
    windowStatusInfo = {
      title: 'GRACE PERIOD PASSED',
      desc: `Grace ended at ${graceCutoffStr}. You will be marked ABSENT.`,
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
    };
  } else if (dynamicWindowStatus === 'SHIFT_ENDED') {
    windowStatusInfo = {
      title: 'SHIFT ENDED',
      desc: `Your shift ended at ${resolvedEndTime}. Check-in not allowed.`,
      color: '#475569',
      bgColor: '#F8FAFC',
      borderColor: '#E2E8F0',
    };
  }

  // Check-In Tap Handler (Always responsive with alert on disabled)
  const handleCheckInTap = () => {
    if (isHoliday) {
      Alert.alert('Cannot Check In', `Today is a holiday: ${holiday?.holiday?.name || 'Public Holiday'}. Check-in is not required.`);
      return;
    }
    if (isWeeklyOff) {
      Alert.alert('Cannot Check In', 'Today is your weekly off.');
      return;
    }
    if (isOnLeave) {
      Alert.alert('Cannot Check In', `You are on approved leave today${leave?.leave?.leaveTypeName ? ` (${leave.leave.leaveTypeName})` : ''}.`);
      return;
    }
    if (!hasShift) {
      Alert.alert('Cannot Check In', 'No shift is assigned to your profile. Please contact HR.');
      return;
    }
    if (!canCheckIn) {
      Alert.alert('Cannot Check In', checkInBlockReason || windowStatusInfo.desc || 'Check-in is not allowed at this time.');
      return;
    }

    // Window is open, execute selected biometric mode
    if (selectedMode === 'face') {
      setCameraVisible(true);
    } else if (selectedMode === 'fingerprint') {
      handleFingerprintCheckIn();
    } else if (selectedMode === 'rfid') {
      setShowRfidInput(true);
    }
  };

  // Helper to fetch real device GPS location with permission check & mock detection
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions in device settings to record attendance.'
      );
      throw new Error('Location permission denied');
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: Math.round(loc.coords.accuracy || 5),
      source: 'gps',
      isMockLocation: Boolean(loc.mocked),
    };
  };

  // Fingerprint verification via LocalAuthentication
  const handleFingerprintCheckIn = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Hardware Unavailable', 'Fingerprint/Biometric sensor is not available on this device.');
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Not Enrolled', 'No biometric credentials registered in device settings.');
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your fingerprint to check in',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (authResult.success) {
        setActionLoading(true);
        console.log('[ATTENDANCE] Fingerprint verified, fetching GPS...');
        const location = await getCurrentLocation();
        console.log('[ATTENDANCE] Submitting fingerprint punch with location:', location);
        await attendanceService.checkIn({
          mode: 'fingerprint',
          location,
          remarks: 'Biometric fingerprint verified check-in',
        });
        Alert.alert(
          'Success 🎉',
          `Fingerprint check-in confirmed at ${new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}.`
        );
        await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
      } else {
        Alert.alert('Verification Cancelled', 'Fingerprint authentication was not completed.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Fingerprint check-in failed.';
      Alert.alert('Fingerprint Punch Error', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // RFID Card Punch
  const handleRfidCheckIn = async () => {
    if (!rfidCardNumber.trim()) {
      Alert.alert('Missing Badge ID', 'Please enter or scan your RFID Badge ID.');
      return;
    }
    setShowRfidInput(false);
    setActionLoading(true);
    try {
      console.log('[ATTENDANCE] Fetching GPS for RFID punch...');
      const location = await getCurrentLocation();
      console.log('[ATTENDANCE] Submitting RFID badge check-in:', rfidCardNumber.trim(), location);
      await attendanceService.checkIn({
        mode: 'rfid',
        cardNumber: rfidCardNumber.trim(),
        location,
        remarks: `RFID Badge ID: ${rfidCardNumber.trim()}`,
      });
      Alert.alert(
        'Success 🎉',
        `RFID badge punch recorded at ${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}.`
      );
      setRfidCardNumber('');
      await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || err.message || 'RFID check-in failed.';
      Alert.alert('RFID Punch Error', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Face Check-In from Camera
  const handleFaceCheckIn = async ({ photo, location }) => {
    setCameraVisible(false);
    setActionLoading(true);
    try {
      const loc = location || (await getCurrentLocation());
      console.log('[ATTENDANCE] Submitting face check-in with GPS location:', loc);
      await attendanceService.checkIn({
        mode: 'face',
        photo,
        location: loc,
        remarks: 'Mobile biometric face check-in',
      });

      Alert.alert(
        'Check-In Successful 🎉',
        `Face verified and clocked in at ${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}.`
      );
      await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Face check-in failed.';
      Alert.alert('Face Check-In Error', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Break Actions
  const handleStartBreak = async (type = 'SHORT') => {
    setActionLoading(true);
    try {
      let location = null;
      try {
        location = await getCurrentLocation();
      } catch {}
      console.log('[ATTENDANCE] Starting break of type:', type, location);
      await attendanceService.startBreak({ breakType: type, mode: selectedMode, location });
      Alert.alert('Break Started ☕', `${type === 'LUNCH' ? 'Lunch' : 'Short'} break timer has started.`);
      await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || err.message || 'Could not start break.';
      Alert.alert('Break Error', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setActionLoading(true);
    try {
      let location = null;
      try {
        location = await getCurrentLocation();
      } catch {}
      console.log('[ATTENDANCE] Ending active break session...', location);
      await attendanceService.endBreak({ mode: selectedMode, location });
      Alert.alert('Break Ended 💼', 'Welcome back! Workday timer resumed.');
      await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || err.message || 'Could not end break.';
      Alert.alert('Break Error', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Check-Out Tap Handler (Always responsive with alert on disabled)
  const handleCheckOutTap = () => {
    if (!canCheckOut) {
      Alert.alert(
        'Cannot Check Out Yet',
        `You need to work more. Expected checkout: ${expectedCheckoutTimeStr}`
      );
      return;
    }

    Alert.alert(
      'Confirm Check-Out',
      'Are you sure you want to end your workday and clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const location = await getCurrentLocation();
              await attendanceService.checkOut({
                mode: selectedMode,
                location,
                remarks: `Mobile ${selectedMode} check-out`,
              });
              Alert.alert('Checked Out', 'Your check-out timestamp has been recorded.');
              await Promise.all([refetchToday(), refetchBreakStatus(), refetchLogs()]);
            } catch (err) {
              const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Check-out failed.';
              Alert.alert('Check-Out Error', errorMsg);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const logsList = logsData?.logs || logsData?.data || (Array.isArray(logsData) ? logsData : []);

  const biometricModes = [
    { id: 'face', label: 'Face', icon: ScanFace },
    { id: 'rfid', label: 'RFID', icon: CreditCard },
    { id: 'fingerprint', label: 'Fingerprint', isCustom: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* SECTION 1: LIVE CLOCK HEADER */}
        <View style={styles.clockCard}>
          <Text style={styles.liveClock}>{timeString}</Text>
          <Text style={styles.clockDate}>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {/* Today Status Badge */}
          <View style={styles.statusPillRow}>
            <View
              style={[
                styles.statusPill,
                onBreak
                  ? { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }
                  : checkedIn && !checkedOut
                  ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                  : checkedOut
                  ? { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
                  : { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  onBreak
                    ? { backgroundColor: '#D97706' }
                    : checkedIn && !checkedOut
                    ? { backgroundColor: '#10B981' }
                    : checkedOut
                    ? { backgroundColor: '#64748B' }
                    : { backgroundColor: '#EF4444' },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  onBreak
                    ? { color: '#B45309' }
                    : checkedIn && !checkedOut
                    ? { color: '#065F46' }
                    : checkedOut
                    ? { color: '#475569' }
                    : { color: '#B91C1C' },
                ]}
              >
                {onBreak
                  ? 'ON BREAK'
                  : checkedIn && !checkedOut
                  ? 'CHECKED IN (PRESENT)'
                  : checkedOut
                  ? 'WORKDAY COMPLETED'
                  : 'NOT MARKED YET'}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 2: STATUS BANNER (Conditional based on windowStatus) */}
        <View
          style={[
            styles.countdownBanner,
            {
              backgroundColor: windowStatusInfo.bgColor,
              borderColor: windowStatusInfo.borderColor,
            },
          ]}
        >
          <View style={styles.countdownTop}>
            <View style={styles.countdownTitleRow}>
              {dynamicWindowStatus === 'WINDOW_OPEN' || (checkedIn && !checkedOut) ? (
                <Sparkles size={18} color={windowStatusInfo.color} />
              ) : (
                <AlertCircle size={18} color={windowStatusInfo.color} />
              )}
              <Text style={[styles.countdownTitle, { color: windowStatusInfo.color }]}>
                {windowStatusInfo.title}
              </Text>
            </View>
            {countdownSecs > 0 && !checkedIn && (
              <View style={[styles.timerBadge, { backgroundColor: windowStatusInfo.color }]}>
                <Text style={styles.timerBadgeText}>{formatCountdown(countdownSecs)}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.countdownDesc, { color: windowStatusInfo.color }]}>
            {windowStatusInfo.desc}
          </Text>
        </View>

        {/* SECTION 3: SHIFT DETAILS CARD */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftRow}>
            <View style={styles.shiftLeft}>
              <Clock size={16} color="#4F46E5" />
              <Text style={styles.shiftName}>{resolvedShiftName}</Text>
              {isRoster && (
                <View style={styles.rosterTag}>
                  <Sparkles size={10} color="#0891B2" />
                  <Text style={styles.rosterTagText}>ROSTER</Text>
                </View>
              )}
            </View>
            <View style={styles.shiftBadgeContainer}>
              <Text style={styles.shiftTimes}>
                {resolvedStartTime} - {resolvedEndTime}
              </Text>
              <Text style={styles.graceBadge}>Grace {resolvedGraceMinutes}m</Text>
            </View>
          </View>

          {/* Planned Hours & Shift Timings Grid */}
          <View style={styles.shiftTimingsGrid}>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Shift Hours</Text>
              <Text style={styles.shiftVal}>{plannedShiftHours}h</Text>
            </View>
            <View style={styles.shiftColDivider} />
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Check In</Text>
              <Text style={styles.shiftVal}>{formatTime(todayLog?.checkInAt || todayData?.checkIn)}</Text>
            </View>
            <View style={styles.shiftColDivider} />
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Expected Out</Text>
              <Text style={[styles.shiftVal, { color: '#0F172A' }]}>{expectedCheckoutTimeStr}</Text>
            </View>
            <View style={styles.shiftColDivider} />
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Total Worked</Text>
              <Text style={[styles.shiftVal, { color: '#4F46E5' }]}>
                {todayLog?.totalWorkedMinutes
                  ? `${Math.floor(todayLog.totalWorkedMinutes / 60)}h ${todayLog.totalWorkedMinutes % 60}m`
                  : checkedIn && !checkedOut
                  ? 'In Progress'
                  : '0h 0m'}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: LIVE 1-SECOND COUNTDOWN TIMER */}
        {!checkedIn && countdownSecs > 0 && (
          <View style={styles.liveTimerCard}>
            <View style={styles.liveTimerHeader}>
              <Timer size={18} color="#4F46E5" />
              <Text style={styles.liveTimerLabel}>
                {dynamicWindowStatus === 'BEFORE_WINDOW'
                  ? 'UNTIL SHIFT START'
                  : 'GRACE PERIOD ENDS IN'}
              </Text>
            </View>
            <Text style={styles.liveTimerDigits}>{formatCountdown(countdownSecs)}</Text>
            <Text style={styles.liveTimerSubtext}>
              {dynamicWindowStatus === 'BEFORE_WINDOW'
                ? `Window opens 5 minutes before ${resolvedStartTime}`
                : `Grace cutoff: ${graceCutoffStr}`}
            </Text>
          </View>
        )}

        {/* SECTION 6: BREAK CONTROLS (Visible ONLY if checkedIn === true AND !checkedOut) */}
        {checkedIn && !checkedOut && (
          <View style={styles.breakSectionCard}>
            <View style={styles.breakHeaderRow}>
              <View style={styles.breakTitleLeft}>
                <Coffee size={18} color={onBreak ? '#D97706' : '#4F46E5'} />
                <Text style={styles.breakSectionTitle}>
                  {onBreak ? 'Break In Progress' : 'Break Controls'}
                </Text>
              </View>
              <Text style={styles.breakTotalText}>
                Break: {totalBreakMinutes}m ({sessionCount} sessions)
              </Text>
            </View>

            {onBreak ? (
              /* Ongoing Break Timer + End Break Button */
              <View style={styles.activeBreakBanner}>
                <View style={styles.activeBreakTimerRow}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.activeBreakDigits}>{formatCountdown(breakElapsed)}</Text>
                </View>
                <Text style={styles.activeBreakSub}>
                  {breakData?.breakType || todayData?.activeBreak?.breakType || 'SHORT'} break running
                </Text>

                <TouchableOpacity
                  style={styles.endBreakBtn}
                  onPress={handleEndBreak}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.endBreakBtnText}>End Break</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Break Start Buttons */
              <View style={styles.breakActionButtonsRow}>
                <TouchableOpacity
                  style={styles.startShortBreakBtn}
                  onPress={() => handleStartBreak('SHORT')}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Coffee size={16} color="#4F46E5" />
                  <Text style={styles.startShortBreakText}>Take Short Break</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startLunchBreakBtn}
                  onPress={() => handleStartBreak('LUNCH')}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Coffee size={16} color="#0891B2" />
                  <Text style={styles.startLunchBreakText}>Take Lunch Break</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* SECTION 7: 3 BIOMETRIC MODES SELECTOR (Visible ONLY if !checkedIn) */}
        {!checkedIn && (
          <View style={styles.modeSection}>
            <Text style={styles.sectionTitle}>Select Biometric Mode</Text>
            <View style={styles.modeSelectorRow}>
              {biometricModes.map((m) => {
                const isActive = selectedMode === m.id;
                const IconComp = m.icon;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modeCard, isActive && styles.modeCardActive]}
                    onPress={() => setSelectedMode(m.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.modeIconCircle,
                        isActive ? styles.modeIconCircleActive : styles.modeIconCircleInactive,
                      ]}
                    >
                      {m.isCustom ? (
                        <FingerprintIcon
                          size={22}
                          color={isActive ? '#FFFFFF' : '#64748B'}
                        />
                      ) : (
                        <IconComp
                          size={22}
                          color={isActive ? '#FFFFFF' : '#64748B'}
                        />
                      )}
                    </View>
                    <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* RFID Card Input Modal/Inline */}
        {!checkedIn && showRfidInput && (
          <View style={styles.rfidInputCard}>
            <View style={styles.rfidCardHeader}>
              <CreditCard size={18} color="#4F46E5" />
              <Text style={styles.rfidTitle}>RFID Badge Check-In</Text>
            </View>
            <TextInput
              style={styles.rfidInput}
              placeholder="e.g. CARD-88392"
              placeholderTextColor="#94A3B8"
              value={rfidCardNumber}
              onChangeText={setRfidCardNumber}
              autoCapitalize="characters"
            />
            <View style={styles.rfidChipsRow}>
              <TouchableOpacity
                style={styles.rfidChip}
                onPress={() => setRfidCardNumber('RFID-EMP-092')}
              >
                <Text style={styles.rfidChipText}>RFID-EMP-092</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rfidChip}
                onPress={() => setRfidCardNumber('BADGE-4891')}
              >
                <Text style={styles.rfidChipText}>BADGE-4891</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rfidButtonsRow}>
              <TouchableOpacity
                style={styles.rfidCancelBtn}
                onPress={() => setShowRfidInput(false)}
              >
                <Text style={styles.rfidCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rfidSubmitBtn}
                onPress={handleRfidCheckIn}
              >
                <Text style={styles.rfidSubmitText}>Submit Badge Punch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION 5: CHECK-IN / CHECK-OUT BUTTONS WITH ALERT ON DISABLED */}
        <View style={styles.actionsContainer}>
          {actionLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.loadingBoxText}>Processing transaction...</Text>
            </View>
          ) : !checkedIn ? (
            /* CHECK-IN BUTTON (Always visible before check-in; clickable even when disabled to show alert) */
            <TouchableOpacity
              style={[
                styles.primaryCheckInBtn,
                !canCheckIn && styles.primaryCheckInBtnDisabled,
              ]}
              onPress={handleCheckInTap}
              activeOpacity={0.8}
            >
              {!canCheckIn ? (
                <Lock size={20} color="#FFFFFF" />
              ) : selectedMode === 'face' ? (
                <ScanFace size={22} color="#FFFFFF" />
              ) : selectedMode === 'fingerprint' ? (
                <FingerprintIcon size={22} color="#FFFFFF" />
              ) : (
                <CreditCard size={22} color="#FFFFFF" />
              )}
              <Text style={styles.primaryBtnText}>
                {selectedMode === 'face'
                  ? 'Face Check-In'
                  : selectedMode === 'fingerprint'
                  ? 'Fingerprint Check-In'
                  : 'RFID Check-In'}
              </Text>
            </TouchableOpacity>
          ) : checkedIn && !checkedOut && !onBreak ? (
            /* CHECK-OUT BUTTON (Visible only if checkedIn === true AND !onBreak) */
            <TouchableOpacity
              style={[
                styles.checkOutBtn,
                !canCheckOut && styles.checkOutBtnDisabled,
              ]}
              onPress={handleCheckOutTap}
              activeOpacity={0.8}
            >
              {!canCheckOut && <Lock size={18} color="#FFFFFF" />}
              <LogOut size={20} color="#FFFFFF" />
              <Text style={styles.checkOutBtnText}>Check-Out</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* SECTION 9: RECENT LOGS */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyHeaderTitle}>Recent Attendance Logs</Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <RefreshCw size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {logsLoading && logsList.length === 0 ? (
          <View style={styles.historyLoadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.historyLoadingText}>Loading attendance logs...</Text>
          </View>
        ) : logsList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Attendance Records Found</Text>
            <Text style={styles.emptySubtitle}>
              Your biometric punches and clock-in logs will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {logsList.map((item, idx) => {
              const status = item.status || 'PRESENT';
              const isPresent = status === 'PRESENT';
              const isAbsent = status === 'ABSENT';
              const isHalfDay = status === 'HALF_DAY';

              return (
                <View key={item.id || idx} style={styles.logCard}>
                  <View style={styles.logCardTop}>
                    <View style={styles.logDateRow}>
                      <Calendar size={14} color="#64748B" />
                      <Text style={styles.logDateText}>
                        {new Date(item.attendanceDate || item.date || item.createdAt).toLocaleDateString(
                          'en-US',
                          { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.logStatusBadge,
                        isPresent
                          ? { backgroundColor: '#ECFDF5' }
                          : isAbsent
                          ? { backgroundColor: '#FEF2F2' }
                          : isHalfDay
                          ? { backgroundColor: '#FEF3C7' }
                          : { backgroundColor: '#EEF2FF' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.logStatusText,
                          isPresent
                            ? { color: '#059669' }
                            : isAbsent
                            ? { color: '#DC2626' }
                            : isHalfDay
                            ? { color: '#D97706' }
                            : { color: '#4F46E5' },
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.logTimesRow}>
                    <View style={styles.logTimeCol}>
                      <Text style={styles.logTimeLabel}>In</Text>
                      <Text style={styles.logTimeVal}>{formatTime(item.checkInAt)}</Text>
                    </View>
                    <View style={styles.logTimeCol}>
                      <Text style={styles.logTimeLabel}>Out</Text>
                      <Text style={styles.logTimeVal}>{formatTime(item.checkOutAt)}</Text>
                    </View>
                    <View style={styles.logTimeCol}>
                      <Text style={styles.logTimeLabel}>Worked</Text>
                      <Text style={[styles.logTimeVal, { color: '#0F172A' }]}>
                        {item.totalWorkedMinutes
                          ? `${Math.floor(item.totalWorkedMinutes / 60)}h ${item.totalWorkedMinutes % 60}m`
                          : '--'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Face Check-In Camera Modal with Oval Guide & GPS */}
      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handleFaceCheckIn}
        actionTitle="Face Biometric Check-In"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 44,
  },
  clockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  liveClock: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
    letterSpacing: 1,
  },
  clockDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  statusPillRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rosterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rosterTagText: {
    color: '#0891B2',
    fontSize: 9,
    fontWeight: '800',
  },
  shiftBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftTimes: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  graceBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftTimingsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  shiftCol: {
    flex: 1,
    alignItems: 'center',
  },
  shiftColDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  shiftLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  shiftVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  countdownBanner: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  countdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  countdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  countdownDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  liveTimerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  liveTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  liveTimerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  liveTimerDigits: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1E1B4B',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
    marginVertical: 6,
  },
  liveTimerSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  breakSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  breakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakTotalText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  activeBreakBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  activeBreakTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D97706',
  },
  activeBreakDigits: {
    fontSize: 26,
    fontWeight: '800',
    color: '#B45309',
    fontVariant: ['tabular-nums'],
  },
  activeBreakSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  endBreakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  endBreakBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  breakActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startShortBreakBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 12,
    borderRadius: 12,
  },
  startShortBreakText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
  },
  startLunchBreakBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    paddingVertical: 12,
    borderRadius: 12,
  },
  startLunchBreakText: {
    color: '#0891B2',
    fontWeight: '700',
    fontSize: 12,
  },
  modeSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  modeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  modeCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  modeIconCircleActive: {
    backgroundColor: '#4F46E5',
  },
  modeIconCircleInactive: {
    backgroundColor: '#F1F5F9',
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeLabelActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  rfidInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  rfidCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rfidTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rfidInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  rfidChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rfidChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  rfidChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  rfidButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rfidCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rfidCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  rfidSubmitBtn: {
    flex: 2,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rfidSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionsContainer: {
    marginBottom: 22,
  },
  loadingBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 60,
  },
  loadingBoxText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '700',
  },
  primaryCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4F46E5',
    paddingVertical: 17,
    borderRadius: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryCheckInBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#DC2626',
    paddingVertical: 17,
    borderRadius: 18,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  checkOutBtnDisabled: {
    backgroundColor: '#F87171',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkOutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  historyLoadingBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 28,
    minHeight: 80,
  },
  historyLoadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  logsList: {
    gap: 12,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  logStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  logStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  logTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logTimeCol: {
    alignItems: 'center',
  },
  logTimeLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  logTimeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
});
