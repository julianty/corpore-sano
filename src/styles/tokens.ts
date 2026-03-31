/**
 * Design Tokens
 * Centralized design system values used throughout the app
 */

// ===== COLOR TOKENS =====
export const colors = {
  // Primary
  primary: "#1c7ed6",      // Mantine blue
  primaryLight: "#1971c2",
  primaryDark: "#1864ab",

  // Secondary
  secondary: "#f59f00",     // Mantine orange
  secondaryLight: "#fab005",
  secondaryDark: "#f08c00",

  // Semantic colors
  success: "#51cf66",       // Green
  warning: "#ffd43b",       // Yellow
  error: "#ff6b6b",         // Red
  info: "#74c0fc",          // Light blue

  // Neutral grayscale
  white: "#ffffff",
  gray100: "#f8f9fa",
  gray200: "#f1f3f5",
  gray300: "#e9ecef",
  gray400: "#dee2e6",
  gray500: "#adb5bd",
  gray600: "#868e96",
  gray700: "#495057",
  gray800: "#343a40",
  gray900: "#212529",
  black: "#000000",

  // Dark mode specific
  dark50: "#f8f9fa",
  dark100: "#f1f3f5",
  dark200: "#e9ecef",
  dark300: "#dee2e6",
  dark400: "#ced4da",
  dark500: "#adb5bd",
  dark600: "#868e96",
  dark700: "#495057",
  dark800: "#343a40",
  dark900: "#212529",
} as const;

// ===== TYPOGRAPHY TOKENS =====
export const typography = {
  fontFamily: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'Monaco', 'Courier New', monospace",
  },

  fontSize: {
    // Heading sizes
    h1: "40px",
    h2: "32px",
    h3: "28px",
    h4: "24px",
    h5: "20px",
    h6: "16px",

    // Body sizes
    lg: "16px",
    base: "14px",
    sm: "13px",
    xs: "12px",
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
} as const;

// ===== SPACING TOKENS =====
export const spacing = {
  // 8px base unit scale
  0: "0",
  xs: "8px",   // 1 unit
  sm: "12px",  // 1.5 units
  md: "16px",  // 2 units
  lg: "24px",  // 3 units
  xl: "32px",  // 4 units
  "2xl": "48px", // 6 units
  "3xl": "64px", // 8 units
} as const;

// ===== SIZE TOKENS =====
export const sizes = {
  // Button sizes
  button: {
    sm: "32px",
    md: "36px",
    lg: "44px",
  },

  // Icon sizes
  icon: {
    sm: "16px",
    md: "24px",
    lg: "32px",
    xl: "48px",
  },

  // Touch target minimum
  touchTarget: "44px",

  // Component dimensions
  containerMaxWidth: "1400px",
  modalMaxWidth: "500px",
  formMaxWidth: "400px",
} as const;

// ===== SHADOW TOKENS =====
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
} as const;

// ===== BORDER RADIUS TOKENS =====
export const borderRadius = {
  none: "0",
  sm: "4px",
  base: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

// ===== TRANSITION TOKENS =====
export const transitions = {
  fast: "150ms ease-in-out",
  base: "200ms ease-in-out",
  slow: "300ms ease-in-out",

  // Specific animation durations
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
  },

  timing: {
    ease: "ease-in-out",
    easeIn: "ease-in",
    easeOut: "ease-out",
    linear: "linear",
  },
} as const;

// ===== Z-INDEX TOKENS =====
export const zIndex = {
  hide: "-1",
  auto: "auto",
  base: "0",
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  modal: "1040",
  popover: "1050",
  tooltip: "1060",
} as const;

// ===== BREAKPOINTS (for reference, Mantine uses these) =====
export const breakpoints = {
  xs: "0px",
  sm: "576px",
  md: "768px",
  lg: "992px",
  xl: "1200px",
} as const;

// ===== COMPONENT-SPECIFIC TOKENS =====
export const components = {
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.semibold,
    transition: transitions.base,
  },

  input: {
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    borderColor: colors.gray300,
    borderColorHover: colors.gray400,
    backgroundColor: colors.white,
    transition: transitions.fast,
  },

  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    boxShadow: shadows.base,
  },

  badge: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
} as const;

// ===== EXPORT ALL TOKENS AS SINGLE OBJECT =====
export const designTokens = {
  colors,
  typography,
  spacing,
  sizes,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
  components,
} as const;
