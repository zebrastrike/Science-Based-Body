// Science Based Body - Design System Tokens
// Premium, Dark, Scientific Aesthetic

export const colors = {
  // Primary Brand Colors
  brand: {
    primary: '#4ade80',      // Vibrant green - trust, growth, science
    primaryDark: '#22c55e',
    primaryLight: '#86efac',
    secondary: '#60a5fa',    // Scientific blue
    secondaryDark: '#3b82f6',
    accent: '#f472b6',       // Soft pink for female audience appeal
  },

  // Neutrals - Dark Theme Base
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },

  // Background Layers
  background: {
    primary: '#0a0a0a',      // Deepest black
    secondary: '#111111',
    tertiary: '#1a1a1a',
    elevated: '#1f1f1f',
    card: '#171717',
    cardHover: '#1e1e1e',
  },

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    tertiary: '#71717a',
    muted: '#52525b',
    inverse: '#09090b',
  },

  // Semantic Colors
  semantic: {
    success: '#4ade80',
    successBg: 'rgba(74, 222, 128, 0.1)',
    warning: '#fbbf24',
    warningBg: 'rgba(251, 191, 36, 0.1)',
    error: '#f87171',
    errorBg: 'rgba(248, 113, 113, 0.1)',
    info: '#60a5fa',
    infoBg: 'rgba(96, 165, 250, 0.1)',
  },

  // Gradients
  gradients: {
    hero: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f0f 100%)',
    card: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)',
    glow: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)',
    cta: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
    premium: 'linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 100%)',
  },

  // Borders
  border: {
    default: '#27272a',
    subtle: '#1f1f1f',
    focus: '#4ade80',
  },
};

export const typography = {
  // Font Families
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },

  // Font Sizes (rem)
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },

  // Font Weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  base: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  glow: '0 0 20px rgba(74, 222, 128, 0.3)',
  glowStrong: '0 0 40px rgba(74, 222, 128, 0.4)',
  card: '0 4px 20px rgba(0, 0, 0, 0.5)',
  cardHover: '0 8px 30px rgba(0, 0, 0, 0.6)',
};

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  timing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
};

// Animation keyframes
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeInUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  fadeInDown: {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  slideInRight: {
    from: { opacity: 0, transform: 'translateX(20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  glow: {
    '0%, 100%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(74, 222, 128, 0.5)' },
  },
};

// Component-specific tokens
export const components = {
  button: {
    primary: {
      bg: colors.brand.primary,
      text: colors.text.inverse,
      hoverBg: colors.brand.primaryDark,
      activeBg: colors.brand.primaryDark,
      shadow: shadows.glow,
    },
    secondary: {
      bg: 'transparent',
      text: colors.text.primary,
      border: colors.border.default,
      hoverBg: colors.background.elevated,
    },
    ghost: {
      bg: 'transparent',
      text: colors.text.secondary,
      hoverBg: colors.background.tertiary,
    },
  },
  card: {
    bg: colors.background.card,
    border: colors.border.subtle,
    radius: borderRadius.xl,
    shadow: shadows.card,
    hoverShadow: shadows.cardHover,
  },
  input: {
    bg: colors.background.secondary,
    border: colors.border.default,
    focusBorder: colors.brand.primary,
    text: colors.text.primary,
    placeholder: colors.text.muted,
    radius: borderRadius.lg,
  },
  badge: {
    success: {
      bg: colors.semantic.successBg,
      text: colors.semantic.success,
    },
    warning: {
      bg: colors.semantic.warningBg,
      text: colors.semantic.warning,
    },
    error: {
      bg: colors.semantic.errorBg,
      text: colors.semantic.error,
    },
    info: {
      bg: colors.semantic.infoBg,
      text: colors.semantic.info,
    },
  },
};

// Export as theme object for styled-components or emotion
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  animations,
  components,
};

export default theme;
