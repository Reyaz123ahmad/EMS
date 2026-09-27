import React, { useState, useRef } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import LivenessCheck from './LivenessCheck.jsx';
import attendanceService from '../../services/attendance.service.js';
import { toast } from 'sonner';

export default function FaceScanner({ operation = 'check_in', onComplete, onCancel }) {
  const [step, setStep] = useState('liveness'); // 'liveness' | 'capturing' | 'submitting'
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: 0, longitude: 0, accuracy: 10 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          console.warn('Geolocation warning:', err);
          resolve({ latitude: 0, longitude: 0, accuracy: 50 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleLivenessComplete = async (livenessData) => {
    try {
      setStep('submitting');
      setError(null);

      // Capture final snapshot from canvas / video
      let finalPhoto = null;
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finalPhoto = canvas.toDataURL('image/jpeg', 0.9);
      }

      const location = await getCurrentLocation();

      const payload = {
        mode: 'face',
        photo: finalPhoto,
        livenessScore: livenessData.livenessScore || 0.95,
        location,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        }
      };

      let response;
      switch (operation) {
        case 'check_in':
          response = await attendanceService.checkIn(payload);
          break;
        case 'check_out':
          response = await attendanceService.checkOut(payload);
          break;
        case 'break_start':
          response = await attendanceService.startBreak(payload);
          break;
        case 'break_end':
          response = await attendanceService.endBreak(payload);
          break;
        default:
          response = await attendanceService.checkIn(payload);
      }

      toast.success('Attendance recorded successfully!');
      if (onComplete) onComplete(response);
    } catch (err) {
      console.error('Face attendance error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Face verification failed';
      setError(errMsg);
      toast.error(errMsg);
      setStep('liveness');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'liveness' && (
        <LivenessCheck
          challenge={{ steps: ['BLINK', 'TURN_LEFT', 'TURN_RIGHT'] }}
          onComplete={handleLivenessComplete}
          onCancel={onCancel}
        />
      )}

      {step === 'submitting' && (
        <div className="p-12 text-center bg-slate-900/90 rounded-2xl border border-slate-800 text-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mb-4" />
          <h3 className="text-base font-bold">Verifying Biometrics & Location...</h3>
          <p className="text-xs text-slate-400 mt-1">Single-pass face match against neural database</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" />
    </div>
  );
}
