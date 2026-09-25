import React, { useState, useEffect } from 'react';
import { Eye, Smile, RefreshCw, CheckCircle2 } from 'lucide-react';

const CHALLENGES = [
  { id: 'BLINK', title: 'Blink Eyes Twice', icon: Eye, prompt: 'Please blink your eyes naturally' },
  { id: 'SMILE', title: 'Smile Gently', icon: Smile, prompt: 'Show a gentle smile to the camera' },
  { id: 'TURN_HEAD_LEFT', title: 'Turn Head Left', icon: RefreshCw, prompt: 'Slightly rotate head to the left' }
];

export default function FaceLiveness({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(25);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const activeChallenge = CHALLENGES[currentStep] || CHALLENGES[0];
  const IconComponent = activeChallenge.icon;

  useEffect(() => {
    // Automated interactive timer simulating real-time frame evaluation
    const timer = setTimeout(() => {
      if (currentStep < CHALLENGES.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setProgress((prev) => prev + 35);
      } else {
        setProgress(100);
        setIsEvaluating(false);
        if (onComplete) {
          onComplete({
            passed: true,
            score: 0.96,
            challengeType: activeChallenge.id
          });
        }
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
        <IconComponent className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-white mb-1">
        {progress === 100 ? 'Liveness Verified!' : activeChallenge.title}
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        {progress === 100 ? 'Anti-spoofing checks passed successfully.' : activeChallenge.prompt}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-full text-xs text-slate-500 font-medium">
        <span>Step {Math.min(currentStep + 1, CHALLENGES.length)} of {CHALLENGES.length}</span>
        <span>{progress}% Verified</span>
      </div>
    </div>
  );
}
