import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FaceCamera({ onCapture, disabled = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState('user');
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
    } catch (err) {
      console.warn('Camera access unavailable:', err.message);
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(base64);
    if (onCapture) onCapture(base64);
  };

  const retake = () => {
    setCapturedPhoto(null);
    if (onCapture) onCapture(null);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
      <div className="relative w-full aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        {capturedPhoto ? (
          <img src={capturedPhoto} alt="Captured Face" className="w-full h-full object-cover" />
        ) : hasCamera ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {/* Oval Face Contour Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-2 border-dashed border-indigo-400/80 rounded-[50%] shadow-[0_0_25px_rgba(99,102,241,0.3)] animate-pulse flex items-center justify-center">
                <span className="text-xs text-indigo-300 font-medium px-2 py-1 bg-slate-900/70 rounded-full">
                  Align Face Inside Oval
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Camera preview not accessible.</p>
            <p className="text-xs text-slate-500 mt-1">Please ensure camera permissions are allowed.</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Control Buttons */}
      <div className="flex items-center gap-4 mt-4">
        {capturedPhoto ? (
          <button
            type="button"
            onClick={retake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Photo
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!hasCamera || disabled}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              Capture Face
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
