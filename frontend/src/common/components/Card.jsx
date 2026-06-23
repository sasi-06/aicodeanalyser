/**
 * Card Component - Flexible container for content
 * Supports multiple variants and responsive padding
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cardVariants } from '@/design-system';
import clsx from 'clsx';

const Card = forwardRef((
  {
    variant = 'default',
    className,
    children,
    onClick,
    isInteractive = false,
    isPressable = false,
    ...props
  },
  ref
) => {
  const cardClasses = clsx(
    cardVariants.base,
    cardVariants.variants[variant],
    { 'cursor-pointer': isInteractive || isPressable },
    className
  );

  const shouldBeMotion = isInteractive || isPressable || variant === 'interactive' || variant === 'pressable';
  const Component = shouldBeMotion ? motion.div : 'div';

  const motionProps = shouldBeMotion ? {
    whileHover: (isInteractive || variant === 'interactive') ? { y: -2 } : {},
    whileTap: (isPressable || variant === 'pressable') ? { scale: 0.98 } : {},
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  } : {};

  return (
    <Component
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

export default Card;
