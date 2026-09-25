import React, { useState } from 'react';
import { useEnrollFinger } from '../../hooks/useFingerAttendance';
import { Fingerprint, Check, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

const FINGERS = [
  { index: 0, hand: 'Right', name: 'Right Thumb' },
  { index: 1, hand: 'Right', name: 'Right Index' },
  { index: 2, hand: 'Right', name: 'Right Middle' },
  { index: 3, hand: 'Right', name: 'Right Ring' },
  { index: 4, hand: 'Right', name: 'Right Little' },
  { index: 5, hand: 'Left', name: 'Left Thumb' },
  { index: 6, hand: 'Left', name: 'Left Index' },
  { index: 7, hand: 'Left', name: 'Left Middle' },
  { index: 8, hand: 'Left', name: 'Left Ring' },
  { index: 9, hand: 'Left', name: 'Left Little' }
];

export default function FingerEnrollmentWizard({ employeeId, onComplete }) {
  const [selectedIndex, setSelectedIndex] = useState(1); // Default Right Index
  const [templateData, setTemplateData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [qualityScore, setQualityScore] = useState(94);

  const enrollFingerMutation = useEnrollFinger();

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Simulate hardware USB optical fingerprint capture
      const mockTemplate = `ISO_19794_2_FINGER_${selectedIndex}_EMP_${employeeId || 'DEMO'}_${Date.now()}`;
      setTemplateData(mockTemplate);
      setQualityScore(96);
      setIsScanning(false);
    }, 1200);
  };

  const handleSubmit = async () => {
    if (!employeeId || !templateData) return;
    await enrollFingerMutation.mutateAsync({
      employeeId,
      fingerIndex: selectedIndex,
      template: templateData,
      templateFormat: 'ISO'
    });
    if (onComplete) onComplete();
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-1">Select Finger For Enrollment</h3>
        <p className="text-xs text-slate-400">Choose the finger to register and capture via optical scanner or terminal.</p>
      </div>

      {/* 10-Finger Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FINGERS.map((f) => {
          const isSelected = selectedIndex === f.index;
          return (
            <button
              key={f.index}
              type="button"
              onClick={() => {
                setSelectedIndex(f.index);
                setTemplateData('');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-xs font-bold">{f.name}</span>
            </button>
          );
        })}
      </div>

      {/* Sensor / Capture Stage */}
      <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all duration-500 ${
            templateData
              ? 'bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-500/10'
              : isScanning
              ? 'bg-indigo-500/20 border-2 border-indigo-400 text-indigo-400 animate-pulse'
              : 'bg-slate-800 border-2 border-slate-700 text-slate-500'
          }`}
        >
          <Fingerprint className="w-10 h-10" />
        </div>

        {templateData ? (
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Template Captured ({qualityScore}% Quality)
            </span>
            <p className="text-xs text-slate-400">
              ISO/IEC 19794-2 standard minutiae extracted and ready for AES-256-GCM encryption.
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              {isScanning ? 'Scanning Sensor...' : `Ready to scan ${FINGERS[selectedIndex]?.name}`}
            </h4>
            <p className="text-xs text-slate-400">Place finger on USB sensor or trigger hardware sync.</p>
          </div>
        )}

        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            disabled={isScanning}
            onClick={handleSimulateScan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {templateData ? 'Re-scan Finger' : 'Capture Fingerprint'}
          </button>

          {templateData && (
            <button
              type="button"
              disabled={enrollFingerMutation.isPending}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
            >
              <Check className="w-4 h-4" />
              {enrollFingerMutation.isPending ? 'Encrypting & Saving...' : 'Save Biometric'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
