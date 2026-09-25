import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const CameraCapture = ({ onCapture, facingMode = 'user', initialPhoto = null }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photo, setPhoto] = useState(initialPhoto);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access webcam. Please check permissions or device setup.');
      setIsStreaming(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (!photo) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [photo, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stopCamera();
    if (onCapture) {
      onCapture(dataUrl);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    if (onCapture) onCapture(null);
    startCamera();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Live Biometric Feed</h4>
            <p className="text-xs text-slate-400">Position your face inside the framing guide</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          HD Optical Stream
        </span>
      </div>

      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-black/80 flex items-center justify-center border border-slate-800">
        {!photo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover mirror-mode"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {/* Oval Face Guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-52 rounded-[50%] border-2 border-dashed border-indigo-400/60 shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all animate-pulse" />
            </div>

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
                <AlertCircle className="mb-2 h-10 w-10 text-rose-400" />
                <p className="text-sm font-medium text-rose-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry Camera Access
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="relative h-full w-full">
            <img src={photo} alt="Biometric Capture" className="h-full w-full object-cover" />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-md">
              <CheckCircle2 className="h-3.5 w-3.5" /> Captured
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-4 flex items-center justify-between">
        {!photo ? (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" /> Snap Biometric Frame
          </button>
        ) : (
          <button
            type="button"
            onClick={retakePhoto}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retake Frame
          </button>
        )}
      </div>
    </div>
  );
};
