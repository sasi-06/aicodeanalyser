/**
 * Typography Components - Text scaling and styling
 * Provides semantic HTML with consistent styling
 */

import React from 'react';
import clsx from 'clsx';

export const Typography = ({
  children,
  variant = 'body',
  color = 'primary',
  weight = 'normal',
  align = 'left',
  className,
  as: Component = 'span',
}) => {
  const variantMap = {
    body: 'text-base',
    bodySmall: 'text-sm',
    bodyLarge: 'text-lg',
    caption: 'text-xs',
    captionSmall: 'text-xs opacity-75',
  };

  const colorMap = {
    primary: 'text-slate-100',
    secondary: 'text-slate-400',
    tertiary: 'text-slate-500',
    muted: 'text-slate-600',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-cyan-400',
  };

  const weightMap = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black',
  };

  const alignMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  return (
    <Component
      className={clsx(
        variantMap[variant],
        colorMap[color],
        weightMap[weight],
        alignMap[align],
        className
      )}
    >
      {children}
    </Component>
  );
};

export const Heading = ({
  level = 1,
  children,
  className,
  color = 'primary',
  weight = 'bold',
  align = 'left',
}) => {
  const levelMap = {
    1: 'h1 text-4xl md:text-5xl lg:text-6xl',
    2: 'h2 text-3xl md:text-4xl lg:text-5xl',
    3: 'h3 text-2xl md:text-3xl lg:text-4xl',
    4: 'h4 text-xl md:text-2xl lg:text-3xl',
    5: 'h5 text-lg md:text-xl lg:text-2xl',
    6: 'h6 text-base md:text-lg lg:text-xl',
  };

  const [tag, ...styleClasses] = levelMap[level].split(' ');
  const Component = tag;

  const colorMap = {
    primary: 'text-white',
    secondary: 'text-slate-400',
    gradient: 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400',
  };

  const alignMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <Component
      className={clsx(
        ...styleClasses,
        'font-black tracking-tight',
        colorMap[color],
        alignMap[align],
        className
      )}
    >
      {children}
    </Component>
  );
};

export const Paragraph = ({
  children,
  variant = 'base',
  color = 'secondary',
  align = 'left',
  className,
  lead = false,
}) => {
  const variantMap = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  const colorMap = {
    primary: 'text-slate-100',
    secondary: 'text-slate-400',
    muted: 'text-slate-500',
    success: 'text-green-400',
    error: 'text-red-400',
  };

  const alignMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  return (
    <p
      className={clsx(
        variantMap[variant],
        colorMap[color],
        alignMap[align],
        lead && 'text-lg leading-8',
        !lead && 'leading-relaxed',
        className
      )}
    >
      {children}
    </p>
  );
};

export const Caption = ({
  children,
  weight = 'normal',
  color = 'muted',
  className,
  uppercase = false,
}) => {
  return (
    <span
      className={clsx(
        'text-xs',
        uppercase && 'uppercase tracking-wider',
        {
          'font-normal': weight === 'normal',
          'font-medium': weight === 'medium',
          'font-semibold': weight === 'semibold',
        },
        {
          'text-slate-600': color === 'muted',
          'text-slate-500': color === 'secondary',
          'text-slate-400': color === 'tertiary',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
