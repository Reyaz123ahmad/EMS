import React, { useState } from 'react';

export const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimer(timeout);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  if (!content) return <>{children}</>;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-md bg-slate-900/95 px-2.5 py-1 text-xs font-medium text-white shadow-xl backdrop-blur-sm pointer-events-none transition-opacity duration-150 animate-in fade-in-0 zoom-in-95 ${positionClasses[position] || positionClasses.top} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
