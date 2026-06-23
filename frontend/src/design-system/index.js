/**
 * Design System - Animation Presets and Component Variants
 * Centralized motion and interaction patterns for consistency
 */

export const animations = {
  // Entrance animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  slideInUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  slideInDown: {
    initial: { opacity: 0, y: -40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  // Hover/Tap animations
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  hoverLift: {
    whileHover: { y: -4 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },

  // Stagger animations
  containerStagger: {
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: { opacity: 0 },
      visible: (i = 1) => ({
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.3 * i },
      }),
    },
  },
  itemStagger: {
    variants: {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    },
  },

  // Loading animations
  pulse: {
    animate: { opacity: [1, 0.5, 1] },
    transition: { duration: 2, repeat: Infinity },
  },
  shimmer: {
    animate: { backgroundPosition: ['200% 0%', '-200% 0%'] },
    transition: { duration: 2, repeat: Infinity },
  },
};

export const componentSizes = {
  button: {
    xs: { px: 0.75, py: 0.375, textSize: 'text-xs', iconSize: 14 },
    sm: { px: 1, py: 0.5, textSize: 'text-sm', iconSize: 16 },
    md: { px: 1.5, py: 0.625, textSize: 'text-sm', iconSize: 18 },
    lg: { px: 2, py: 0.75, textSize: 'text-base', iconSize: 20 },
    xl: { px: 2.5, py: 0.875, textSize: 'text-base', iconSize: 24 },
  },
  icon: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 96,
  },
};

export const buttonVariants = {
  base: 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2',
  sizes: {
    xs: 'h-7 px-2 text-xs gap-1',
    sm: 'h-8 px-3 text-sm gap-2',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    xl: 'h-14 px-8 text-lg gap-3',
    icon: 'h-10 w-10 p-0',
  },
  variants: {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/50 focus:ring-blue-500',
    secondary:
      'bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500',
    accent:
      'bg-cyan-600 text-white hover:bg-cyan-500 focus:ring-cyan-500',
    ghost:
      'text-slate-300 hover:bg-white/10 hover:text-white focus:ring-blue-500',
    outline:
      'border border-slate-600 text-slate-300 hover:bg-white/5 focus:ring-blue-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/50 focus:ring-red-500',
    success:
      'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/50 focus:ring-green-500',
  },
};

export const cardVariants = {
  base: 'rounded-xl border transition-all duration-200',
  variants: {
    default: 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/75 hover:shadow-lg hover:shadow-blue-500/10',
    elevated: 'bg-slate-800 border-slate-700 shadow-lg shadow-blue-500/10',
    interactive:
      'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:shadow-lg cursor-pointer',
    minimal: 'bg-transparent border-slate-700/30 hover:border-slate-600/50',
  },
};

export const inputVariants = {
  base: 'w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
  error: 'border-red-500/50 focus:border-red-500/75 focus:ring-red-500/20',
  success: 'border-green-500/50 focus:border-green-500/75 focus:ring-green-500/20',
};

export const badgeVariants = {
  base: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
  variants: {
    primary: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    secondary: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  },
};

export const brandConfigs = {
  name: 'CodeAnalyser.AI',
  tagline: 'Enterprise-Grade Technical Assessment Platform',
  logo: '▲',
  colors: {
    primary: 'from-blue-600 to-indigo-600',
    accent: 'from-cyan-500 to-blue-500',
  },
};
