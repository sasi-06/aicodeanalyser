/**
 * Badge Component - Status indicators and tags
 * Compact, labeled components for categorization
 */

import React from 'react';
import { badgeVariants } from '@/design-system';
import clsx from 'clsx';

export const Badge = ({ variant = 'primary', icon: Icon = null, children, className }) => {
  return (
    <span className={clsx(badgeVariants.base, badgeVariants.variants[variant], className)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

/**
 * Loading Skeleton - Placeholder for loading states
 */
export const Skeleton = ({ className, animated = true }) => {
  return (
    <div
      className={clsx(
        'bg-gradient-to-r from-slate-800 to-slate-700',
        { 'animate-pulse': animated },
        className
      )}
    />
  );
};

export const SkeletonCircle = ({ size = 'md', className, animated = true }) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <Skeleton
      className={clsx(sizeMap[size], 'rounded-full', className)}
      animated={animated}
    />
  );
};

export const SkeletonText = ({ lines = 3, className, animated = true }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-4 rounded-md', {
            'w-3/4': i === lines - 1,
            'w-full': i !== lines - 1,
          }, className)}
          animated={animated}
        />
      ))}
    </div>
  );
};

/**
 * Loading spinner component
 */
export const LoadingSpinner = ({ size = 'md', className }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={clsx(sizeMap[size], 'relative', className)}>
      <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
    </div>
  );
};
