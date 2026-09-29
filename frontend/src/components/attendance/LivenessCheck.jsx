import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CheckCircle, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { detectFace, calculateEAR, detectHeadPose, checkFaceBounds, loadFaceModels } from '../../utils/face-detector.js';

export function LivenessCheck({ challenge, employeeId, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [detectedDirection, setDetectedDirection] = useState('CENTER');
  const [isBlinking, setIsBlinking] = useState(false);
  const [earValue, setEarValue] = useState(0);
  const [yawValue, setYawValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(1.0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceBounds, setFaceBounds] = useState({
    isInside: false,
    isSizeOk: false,
    isProperlyPositioned: false,
    status: 'NO_FACE',
    message: 'Align Face Inside Guide'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  const [debug, setDebug] = useState({
    videoReady: false,
    videoWidth: 0,
    videoHeight: 0,
    streamActive: false
  });

  const blinkState = useRef({
    wasOpen: true,
    consecutiveClosed: 0
  });

  const steps = challenge?.steps && challenge.steps.length > 0
    ? challenge.steps
    : ['BLINK', 'TURN_LEFT', 'TURN_RIGHT'];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    console.log('[LivenessCheck] Starting camera...');
    setCameraError(null);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      console.log('[LivenessCheck] Camera stream obtained:', mediaStream.id);
      console.log('[LivenessCheck] Video tracks:', mediaStream.getVideoTracks().length);

      streamRef.current = mediaStream;
      setStream(mediaStream);

      const video = videoRef.current;
      if (video) {
        video.srcObject = mediaStream;

        // Wait for video metadata
        await new Promise((resolve) => {
          if (video.readyState >= 1) {
            resolve();
          } else {
            video.onloadedmetadata = () => {
              console.log('[LivenessCheck] Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
              resolve();
            };
          }
        });

        try {
          await video.play();
          console.log('✅ [LivenessCheck] Video playing successfully');
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('[LivenessCheck] Play aborted (retrying)...');
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch((e) => console.error('[LivenessCheck] Play retry failed:', e));
              }
            }, 100);
          } else {
            console.error('[LivenessCheck] Video play error:', err);
          }
        }
      }
    } catch (error) {
      console.error('[LivenessCheck] Camera error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a webcam.');
      } else {
        setCameraError(`Camera error: ${error.message || 'Unable to access camera'}`);
      }
    }
  }, []);

  // Ensure video element receives stream whenever stream or DOM element mounts/updates
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const playVideo = async () => {
      try {
        if (video.paused) {
          await video.play();
          console.log('✅ [LivenessCheck] Video playback confirmed');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }, 150);
        }
      }
    };

    playVideo();
  }, [stream]);

  // Load models and initialize camera
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      try {
        await loadFaceModels();
        if (mounted) {
          await startCamera();
        }
      } catch (err) {
        console.error('[LivenessCheck] Initialization error:', err);
        if (mounted) {
          setCameraError('Failed to load neural models or initialize video feed.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Periodic debug telemetry monitor
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video) {
        setDebug({
          videoReady: video.readyState >= 2,
          videoWidth: video.videoWidth || 0,
          videoHeight: video.videoHeight || 0,
          streamActive: Boolean(stream?.active && stream?.getVideoTracks()?.some((t) => t.readyState === 'live'))
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  const captureVerifiedPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      return null;
    }
  };

  const completeStep = useCallback((stepIndex) => {
    setStepCompleted(true);
    const nextStep = stepIndex + 1;

    if (nextStep >= steps.length) {
      const verifiedPhoto = captureVerifiedPhoto();
      setTimeout(() => {
        stopCamera();
        if (onComplete) {
          onComplete({
            livenessScore: 0.95,
            passed: true,
            challengeId: challenge?.id,
            photo: verifiedPhoto
          });
        }
      }, 500);
    } else {
      setTimeout(() => {
        setCurrentStep(nextStep);
        setStepCompleted(false);
        blinkState.current = { wasOpen: true, consecutiveClosed: 0 };
      }, 600);
    }
  }, [steps.length, challenge?.id, onComplete, stopCamera]);

  const checkBlink = useCallback((ear) => {
    const state = blinkState.current;

    if (ear < 0.23) {
      state.consecutiveClosed++;
      state.wasOpen = false;
    } else {
      if (!state.wasOpen && state.consecutiveClosed >= 1) {
        completeStep(currentStep);
        return;
      }
      state.wasOpen = true;
      state.consecutiveClosed = 0;
    }
  }, [completeStep, currentStep]);

  // Client-side detection loop (100ms interval for real-time responsiveness)
  useEffect(() => {
    if (!stream || isLoading || stepCompleted || !videoRef.current) return;

    let isRunning = true;
    let timerId = null;

    const detect = async () => {
      if (!isRunning || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) {
        timerId = setTimeout(detect, 80);
        return;
      }

      try {
        const result = await detectFace(video);

        if (result && result.landmarks) {
          setFaceDetected(true);

          // 1. Evaluate spatial bounds inside guide circle
          const bounds = checkFaceBounds(result.box, video.videoWidth || 640, video.videoHeight || 480);
          setFaceBounds(bounds);

          // 2. Compute biometric metrics (EAR and user-centric Head Pose)
          const ear = calculateEAR(result.landmarks);
          const headPose = detectHeadPose(result.landmarks);

          setEarValue(ear);
          setYawValue(headPose.yaw);
          setPitchValue(headPose.pitch);
          setDetectedDirection(headPose.direction);
          setIsBlinking(ear < 0.23);

          // CRITICAL: Only evaluate liveness challenges when face is PROPERLY POSITIONED inside the circle
          if (bounds.isProperlyPositioned) {
            const currentChallenge = steps[currentStep];

            if (currentChallenge === 'BLINK') {
              checkBlink(ear);
            } else if (
              currentChallenge === 'TURN_LEFT' ||
              currentChallenge === 'TURN_HEAD_LEFT'
            ) {
              // User turned head to their LEFT (userYaw < -0.12)
              if (headPose.direction === 'LEFT' && headPose.yaw < -0.12) {
                completeStep(currentStep);
              }
            } else if (
              currentChallenge === 'TURN_RIGHT' ||
              currentChallenge === 'TURN_HEAD_RIGHT'
            ) {
              // User turned head to their RIGHT (userYaw > 0.12)
              if (headPose.direction === 'RIGHT' && headPose.yaw > 0.12) {
                completeStep(currentStep);
              }
            } else if (currentChallenge === 'LOOK_UP') {
              if (headPose.direction === 'UP' && headPose.pitch > 1.35) {
                completeStep(currentStep);
              }
            } else if (currentChallenge === 'LOOK_DOWN') {
              if (headPose.direction === 'DOWN' && headPose.pitch < 0.75) {
                completeStep(currentStep);
              }
            }
          }
        } else {
          setFaceDetected(false);
          setFaceBounds({
            isInside: false,
            isSizeOk: false,
            isProperlyPositioned: false,
            status: 'NO_FACE',
            message: 'Align Face Inside Guide'
          });
        }
      } catch (error) {
        console.error('[LivenessCheck] Frame detection error:', error);
      }

      if (isRunning && !stepCompleted) {
        timerId = setTimeout(detect, 100);
      }
    };

    detect();

    return () => {
      isRunning = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [stream, isLoading, currentStep, stepCompleted, steps, checkBlink, completeStep]);

  const getInstruction = () => {
    const step = steps[currentStep] || 'BLINK';

    switch (step) {
      case 'BLINK':
        return {
          icon: <Eye className="h-12 w-12 text-indigo-400 animate-pulse" />,
          text: 'Blink your eyes',
          subtext: 'Close both eyes, then open naturally'
        };
      case 'TURN_LEFT':
      case 'TURN_HEAD_LEFT':
        return {
          icon: <ArrowLeft className="h-12 w-12 text-indigo-400 animate-bounce" />,
          text: 'Turn head LEFT',
          subtext: 'Rotate head slightly to your left'
        };
      case 'TURN_RIGHT':
      case 'TURN_HEAD_RIGHT':
        return {
          icon: <ArrowRight className="h-12 w-12 text-indigo-400 animate-bounce" />,
          text: 'Turn head RIGHT',
          subtext: 'Rotate head slightly to your right'
        };
      case 'LOOK_UP':
        return {
          icon: <ArrowUp className="h-12 w-12 text-indigo-400 animate-bounce" />,
          text: 'Look UP',
          subtext: 'Tilt head slightly upward'
        };
      case 'LOOK_DOWN':
        return {
          icon: <ArrowDown className="h-12 w-12 text-indigo-400 animate-bounce" />,
          text: 'Look DOWN',
          subtext: 'Tilt head slightly downward'
        };
      default:
        return {
          icon: <Eye className="h-12 w-12 text-indigo-400" />,
          text: 'Follow biometric instructions',
          subtext: 'Keep face inside guide frame'
        };
    }
  };

  const instruction = getInstruction();
  const progress = ((currentStep + (stepCompleted ? 1 : 0)) / steps.length) * 100;

  return (
    <div className="relative w-full rounded-2xl border border-indigo-500/30 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
      {/* Header / Instruction */}
      <div className="bg-slate-950/90 text-white p-5 text-center border-b border-slate-800">
        <div className="flex justify-center mb-2">
          {stepCompleted ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle className="h-8 w-8" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 shadow-inner">
              {instruction.icon}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          {stepCompleted ? 'Gesture Verified!' : instruction.text}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{instruction.subtext}</p>
      </div>

      {/* Main Video Viewport - ALWAYS IN DOM */}
      <div className="relative w-full aspect-video min-h-[360px] bg-black flex items-center justify-center overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mb-4" />
            <h3 className="text-base font-bold text-white">Initializing Neural Face Engine...</h3>
            <p className="text-xs text-slate-400 mt-1">Starting client-side webcam feed</p>
          </div>
        )}

        {/* Video Element: explicit block display and dimensions */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: 'scaleX(-1)',
            display: 'block',
            backgroundColor: '#000',
            zIndex: 1
          }}
        />

        {/* Fallback / Error Screen */}
        {cameraError && !isLoading && (
          <div className="absolute inset-0 bg-slate-950/95 z-25 flex flex-col items-center justify-center p-6 text-center text-rose-400">
            <AlertCircle className="h-12 w-12 mb-3 text-rose-500" />
            <h4 className="text-sm font-bold text-rose-300 mb-1">Camera Feed Unavailable</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className="w-4 h-4" /> Retry Camera Access
            </button>
          </div>
        )}

        {/* Face Guide Overlay (Always on top of video, z-10) */}
        {!isLoading && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div
              className={`w-56 h-72 border-4 rounded-full transition-all duration-300 flex items-center justify-center ${
                stepCompleted
                  ? 'border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.5)] bg-emerald-500/5'
                  : !faceDetected || faceBounds.status === 'OUTSIDE_CIRCLE'
                  ? 'border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                  : faceBounds.status === 'TOO_FAR'
                  ? 'border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                  : 'border-emerald-400/90 shadow-[0_0_25px_rgba(52,211,153,0.35)]'
              }`}
            >
              {/* Optional inner guide crosshair or hint */}
              {!faceDetected && (
                <span className="text-[11px] text-rose-300 font-semibold px-2 py-0.5 bg-black/60 rounded-full border border-rose-500/30">
                  Position Face Here
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step Complete Flash Overlay */}
        {stepCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-[2px] z-15 transition-all">
            <CheckCircle className="h-28 w-28 text-emerald-400 animate-scale" />
          </div>
        )}

        {/* Debug Telemetry HUD (Top-right, z-20) */}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-700 z-20 space-y-0.5 pointer-events-none">
          <div>Status: <span className={faceBounds.isProperlyPositioned ? 'text-emerald-400 font-bold' : faceBounds.status === 'TOO_FAR' ? 'text-amber-400' : 'text-rose-400'}>{faceBounds.status || 'NO_FACE'}</span></div>
          <div>Yaw: <span className="text-indigo-300 font-bold">{yawValue > 0 ? '+' : ''}{yawValue.toFixed(2)}</span> | Pose: <span className="text-indigo-200">{detectedDirection}</span></div>
          <div>Goal: <span className="text-amber-300 font-bold">{steps[currentStep]}</span></div>
        </div>

        {/* Live HUD Telemetry Bar (Bottom-center, z-20) */}
        {!isLoading && !cameraError && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/85 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 z-20 flex items-center gap-3 whitespace-nowrap shadow-xl">
            {faceDetected ? (
              <>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                  faceBounds.status === 'ALIGNED'
                    ? 'text-emerald-400'
                    : faceBounds.status === 'TOO_FAR'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    faceBounds.status === 'ALIGNED'
                      ? 'bg-emerald-400 animate-pulse'
                      : faceBounds.status === 'TOO_FAR'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`} />
                  {faceBounds.message}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  EAR: <strong>{earValue.toFixed(2)}</strong>
                </span>
                <span className="text-xs text-indigo-300 font-medium">
                  Pose: <strong>{detectedDirection}</strong>
                </span>
                {isBlinking && (
                  <span className="text-xs text-amber-300 font-bold animate-pulse">
                    • BLINK
                  </span>
                )}
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Align Face Inside Oval Guide
              </span>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Progress & Cancel Controls */}
      <div className="bg-slate-950/90 p-5 border-t border-slate-800">
        <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Real-time Browser Inference (100ms)
          </span>
          <span className="font-semibold text-slate-200">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default LivenessCheck;
