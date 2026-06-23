/**
 * Enterprise Design System - Theme Configuration
 * Defines color palette, typography, spacing, and responsive breakpoints
 * aligned with premium SaaS standards
 */

export const theme = {
  colors: {
    // Primary gradient palette
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Accent palette
    accent: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Semantic colors
    success: {
      50: '#f0fdf4',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      900: '#065f46',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d',
    },
    info: {
      50: '#f0f9ff',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      900: '#0c4a6e',
    },
    // Neutral palette - dark mode optimized
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Background
    bg: {
      primary: '#0a0e27',
      secondary: '#111b35',
      tertiary: '#1a2847',
      surface: '#151d35',
      overlay: 'rgba(10, 14, 39, 0.8)',
    },
    // Text
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      muted: '#64748b',
      inverse: '#0a0e27',
    },
    // Borders
    border: {
      light: 'rgba(248, 250, 252, 0.1)',
      DEFAULT: 'rgba(248, 250, 252, 0.15)',
      strong: 'rgba(248, 250, 252, 0.2)',
    },
    // Gradients
    gradient: {
      primary: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      accent: 'linear-gradient(135deg, #0ea5e9 0%, #075985 100%)',
      glow: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(14, 165, 233, 0.2))',
    },
  },

  typography: {
    fontFamily: {
      sans: '"Segoe UI", "Helvetica Neue", sans-serif',
      mono: '"Fira Code", "Courier New", monospace',
      display: '"Cal Sans", "Segoe UI", sans-serif',
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem', // 48px
    '4xl': '4rem', // 64px
    '5xl': '5rem', // 80px
  },

  borderRadius: {
    none: '0',
    sm: '0.375rem', // 6px
    base: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    '2xl': '2rem', // 32px
    '3xl': '2.5rem', // 40px
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(37, 99, 235, 0.3)',
    'glow-lg': '0 0 40px rgba(37, 99, 235, 0.2)',
  },

  transitions: {
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
};

export const darkModeStyles = {
  background: theme.colors.bg.primary,
  foreground: theme.colors.text.primary,
  muted: theme.colors.text.muted,
  mutedForeground: theme.colors.text.tertiary,
  popover: theme.colors.bg.surface,
  card: theme.colors.bg.secondary,
  primary: theme.colors.primary[500],
  primaryForeground: '#ffffff',
  secondary: theme.colors.accent[500],
  secondaryForeground: '#ffffff',
  accent: theme.colors.primary[400],
  accentForeground: '#000000',
  destructive: theme.colors.error[600],
  destructiveForeground: '#ffffff',
  border: theme.colors.border.DEFAULT,
  input: theme.colors.bg.tertiary,
  ring: theme.colors.primary[500],
};
