import React from 'react';
import Spinner from './Spinner';

export const LoadingOverlay = ({
  isLoading = false,
  message = 'Loading...',
  fullScreen = false,
  children
}) => {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  const overlayContent = (
    <div className={`flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 rounded-2xl animate-in fade-in-0 duration-200 ${
      fullScreen ? 'fixed inset-0' : 'absolute inset-0'
    }`}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {message && (
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return isLoading ? overlayContent : null;
  }

  return (
    <div className="relative w-full h-full min-h-[120px]">
      {children}
      {isLoading && overlayContent}
    </div>
  );
};

export default LoadingOverlay;
