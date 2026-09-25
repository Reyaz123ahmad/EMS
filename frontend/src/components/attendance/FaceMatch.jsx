import React, { useEffect, useState } from 'react';
import { ScanFace, CheckCircle2, ShieldAlert, Cpu, Check } from 'lucide-react';

export const FaceMatch = ({ photo, onResult }) => {
  const [matchStatus, setMatchStatus] = useState('PROCESSING'); // PROCESSING | MATCHED | MISMATCH
  const [score, setScore] = useState(0.92);
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    let timer1, timer2, timer3;

    // Simulate 128-D vector extraction and neural net inference
    timer1 = setTimeout(() => setProgress(60), 300);
    timer2 = setTimeout(() => setProgress(95), 700);

    timer3 = setTimeout(() => {
      setProgress(100);
      setMatchStatus('MATCHED');
      setScore(0.94);
      if (onResult) {
        onResult({ passed: true, score: 0.94, threshold: 0.75 });
      }
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [photo, onResult]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <ScanFace className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">128-D Biometric Matcher</h4>
            <p className="text-xs text-slate-400">Cosine similarity vs registered profile vector</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
          <Cpu className="h-3 w-3 text-purple-400" />
          <span>Threshold: 75%</span>
        </div>
      </div>

      <div className="my-5 flex flex-col items-center">
        {matchStatus === 'PROCESSING' && (
          <div className="w-full space-y-4 text-center">
            <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-950 shadow-lg">
              {photo && <img src={photo} alt="Face Subject" className="h-full w-full object-cover opacity-80" />}
              {/* Animated scan line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Vectorizing landmarks...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {matchStatus === 'MATCHED' && (
          <div className="w-full space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <div>
              <h5 className="text-base font-bold text-emerald-400">Identity Match Verified</h5>
              <p className="text-xs text-slate-300">Cosine Confidence: {(score * 100).toFixed(1)}%</p>
            </div>
          </div>
        )}

        {matchStatus === 'MISMATCH' && (
          <div className="w-full space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h5 className="text-base font-bold text-rose-400">Facial Signature Mismatch</h5>
              <p className="text-xs text-slate-400">Similarity score below security threshold</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
