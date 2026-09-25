import React from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/Button.jsx';

export function StepWizard({
  steps = [], // [{ id, title, description, icon }]
  currentStep = 1,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  canGoNext = true,
  children,
  submitLabel = 'Complete & Submit',
  nextLabel = 'Next Step',
  backLabel = 'Back',
  hideFooter = false
}) {
  const isLastStep = currentStep === steps.length;
  const isFirstStep = currentStep === 1;

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Step Progress Stepper Bar */}
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between relative">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <React.Fragment key={step.id || stepNum}>
                {/* Step Item */}
                <div className="flex flex-col items-center relative z-10 group">
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300 shadow-md',
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-emerald-900/40 ring-4 ring-emerald-500/20'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-blue-900/40 ring-4 ring-blue-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon || stepNum
                    )}
                  </div>

                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-xs sm:text-sm font-semibold transition-colors',
                        isCurrent ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-[11px] text-slate-500 hidden sm:block max-w-[140px] truncate">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line between steps */}
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 sm:mx-4 -mt-6 sm:-mt-8 transition-all duration-300',
                      currentStep > stepNum ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="w-full bg-slate-900/50 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {children}

        {/* Action Controls */}
        {!hideFooter && (
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
            <div>
              {!isFirstStep && onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  {backLabel}
                </Button>
              )}
            </div>

            <div>
              {isLastStep ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={onSubmit}
                  isLoading={isSubmitting}
                  disabled={!canGoNext || isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
                >
                  {submitLabel}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={onNext}
                  isLoading={isSubmitting}
                  disabled={!canGoNext || isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
                >
                  {nextLabel}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepWizard;
