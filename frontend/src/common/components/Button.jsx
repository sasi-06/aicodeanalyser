/**
 * Reusable Button Component
 * Supports multiple variants, sizes, loading/disabled states
 * Enterprise-grade with accessibility features
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { buttonVariants, animations } from '@/design-system';
import clsx from 'clsx';

const Button = forwardRef((
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isDisabled = false,
    icon: Icon = null,
    iconPosition = 'left',
    children,
    className,
    onClick,
    type = 'button',
    ...props
  },
  ref
) => {
  const isDisabledState = isDisabled || isLoading;

  const buttonClasses = clsx(
    buttonVariants.base,
    buttonVariants.sizes[size],
    buttonVariants.variants[variant],
    {
      'opacity-50 cursor-not-allowed': isDisabledState,
      'opacity-75': isLoading,
    },
    className
  );

  const iconComponent = isLoading ? (
    <Loader2 className="animate-spin" size={buttonVariants.sizes[size].iconSize} />
  ) : Icon ? (
    <Icon size={buttonVariants.sizes[size].iconSize} />
  ) : null;

  const iconElement = iconComponent && (
    <motion.div
      animate={isLoading ? { rotate: 360 } : {}}
      transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
    >
      {iconComponent}
    </motion.div>
  );

  return (
    <motion.button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={isDisabledState}
      onClick={onClick}
      whileHover={!isDisabledState ? { scale: 1.02 } : {}}
      whileTap={!isDisabledState ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-busy={isLoading}
      aria-disabled={isDisabledState}
      {...props}
    >
      <div className="flex items-center justify-center gap-inherit">
        {iconPosition === 'left' && iconElement}
        {children && <span>{children}</span>}
        {iconPosition === 'right' && iconElement}
      </div>
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
