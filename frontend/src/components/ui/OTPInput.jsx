import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

export function OTPInput({ length = 6, value = '', onChange, className, error }) {
  const [digits, setDigits] = useState(() => {
    const arr = value.split('').slice(0, length);
    while (arr.length < length) arr.push('');
    return arr;
  });

  const inputsRef = useRef([]);

  const updateParent = (newDigits) => {
    const otp = newDigits.join('');
    setDigits(newDigits);
    if (onChange) {
      onChange(otp);
    }
  };

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); // only digits
    if (!val) {
      const newDigits = [...digits];
      newDigits[index] = '';
      updateParent(newDigits);
      return;
    }

    const newDigits = [...digits];
    // If user pasted or typed multiple digits
    if (val.length > 1) {
      const chars = val.slice(0, length - index).split('');
      chars.forEach((char, i) => {
        newDigits[index + i] = char;
      });
      updateParent(newDigits);
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = val;
    updateParent(newDigits);

    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    const newDigits = pasteData.split('');
    while (newDigits.length < length) newDigits.push('');
    updateParent(newDigits);

    const focusIdx = Math.min(pasteData.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={length}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-slate-700/80 bg-slate-900/90 text-center text-xl font-bold font-mono text-slate-100 shadow-sm transition-all duration-200',
              'focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            )}
          />
        ))}
      </div>
      {error && <p className="text-center text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
}

export default OTPInput;
