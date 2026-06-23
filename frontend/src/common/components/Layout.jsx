/**
 * Layout Components - Container, Section, Grid utilities
 */

import React from 'react';
import clsx from 'clsx';

export const Container = ({ children, className, size = 'lg' }) => {
  const sizeMap = {
    sm: 'max-w-2xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-7xl',
    full: 'w-full',
  };

  return (
    <div className={clsx('mx-auto px-4 sm:px-6 lg:px-8', sizeMap[size], className)}>
      {children}
    </div>
  );
};

export const Section = ({ children, className, id, hasPadding = true }) => {
  return (
    <section
      id={id}
      className={clsx(
        hasPadding && 'py-16 sm:py-20 md:py-24 lg:py-32',
        className
      )}
    >
      {children}
    </section>
  );
};

export const Stack = ({
  children,
  direction = 'vertical',
  gap = 'md',
  align = 'start',
  justify = 'start',
  className,
}) => {
  const directionMap = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row',
  };

  const gapMap = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={clsx(
        directionMap[direction],
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        className
      )}
    >
      {children}
    </div>
  );
};

export const Grid = ({
  children,
  columns = 1,
  gap = 'md',
  responsive = true,
  className,
}) => {
  const gapMap = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  const colMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const responsiveClass = responsive
    ? `${colMap[1]} md:${colMap[2]} lg:${colMap[columns]}`
    : colMap[columns];

  return (
    <div
      className={clsx(
        'grid',
        responsiveClass,
        gapMap[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

export const Flex = ({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
}) => {
  const gapMap = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={clsx(
        'flex',
        gapMap[gap],
        alignMap[align] || 'items-center',
        justifyMap[justify] || 'justify-start',
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};
