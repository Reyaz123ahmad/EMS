import React from 'react';

export const Skeleton = ({
  variant = 'text', // 'text' | 'circular' | 'rectangular' | 'card'
  width,
  height,
  className = '',
  count = 1
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-xl';
      case 'card':
        return 'rounded-2xl p-6 h-36';
      case 'text':
      default:
        return 'rounded-md h-4';
    }
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      style={{
        width: width || (variant === 'circular' ? height || '2.5rem' : '100%'),
        height: height || (variant === 'circular' ? width || '2.5rem' : undefined)
      }}
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${getVariantStyles()} ${className}`}
    />
  ));

  return count === 1 ? elements[0] : <div className="space-y-2.5 w-full">{elements}</div>;
};

export default Skeleton;
