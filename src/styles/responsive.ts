/**
 * Responsive Design Utilities
 *
 * Mantine Breakpoints (based on max-width):
 * xs: 0px
 * sm: 576px
 * md: 768px (tablet)
 * lg: 992px (desktop)
 * xl: 1200px (large desktop)
 */

// Responsive value types for Mantine
export type ResponsiveValue<T> = T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T };

/**
 * Responsive dimension helpers
 * Use these for components that need different sizes on different screens
 */
export const responsiveDimensions = {
  // Container widths
  containerWidth: {
    xs: "100%",
    sm: "100%",
    md: "100%",
    lg: "100%",
    xl: "100%",
  } as const,

  // Maximum widths for modals and content
  maxContentWidth: {
    xs: "100%",
    sm: "100%",
    md: "600px",
    lg: "800px",
    xl: "900px",
  } as const,

  // Workout exercise row width
  exerciseRowWidth: {
    xs: "100%",
    sm: "100%",
    md: "250px",
    lg: "280px",
    xl: "280px",
  } as const,

  // Input maximum width
  inputMaxWidth: {
    xs: "100%",
    sm: "100%",
    md: "400px",
    lg: "500px",
    xl: "500px",
  } as const,

  // Combobox dropdown height
  dropdownMaxHeight: {
    xs: "250px",
    sm: "300px",
    md: "400px",
    lg: "400px",
    xl: "400px",
  } as const,

  // Muscle diagram height
  muscleChartHeight: {
    xs: "350px",
    sm: "400px",
    md: "500px",
    lg: "600px",
    xl: "600px",
  } as const,
} as const;

/**
 * Responsive spacing scale (based on 8px units)
 * xs: mobile (< 576px)
 * sm: small tablet (576px - 767px)
 * md: tablet (768px - 991px)
 * lg: desktop (992px+)
 */
export const responsiveSpacing = {
  // Padding scale
  paddingScale: {
    xs: "xs" as const,  // 8px
    sm: "xs" as const,  // 8px
    md: "sm" as const,  // 12px
    lg: "md" as const,  // 16px
    xl: "lg" as const,  // 20px
  },

  // Gap between elements
  gapScale: {
    xs: "xs" as const,  // 8px
    sm: "sm" as const,  // 12px
    md: "md" as const,  // 16px
    lg: "lg" as const,  // 20px
    xl: "xl" as const,  // 24px
  },
} as const;

/**
 * Responsive font sizes
 * For body text, headings, etc.
 */
export const responsiveTypography = {
  // Heading sizes
  h1: {
    xs: "24px",
    sm: "28px",
    md: "32px",
    lg: "36px",
    xl: "40px",
  },

  h2: {
    xs: "20px",
    sm: "24px",
    md: "28px",
    lg: "32px",
    xl: "36px",
  },

  h3: {
    xs: "18px",
    sm: "20px",
    md: "24px",
    lg: "28px",
    xl: "32px",
  },

  // Body text
  body: {
    xs: "14px",
    sm: "14px",
    md: "16px",
    lg: "16px",
    xl: "16px",
  },

  // Small text
  small: {
    xs: "12px",
    sm: "12px",
    md: "13px",
    lg: "14px",
    xl: "14px",
  },
} as const;

/**
 * Common responsive patterns
 */
export const responsivePatterns = {
  // Mobile-first padding
  contentPadding: {
    xs: "xs" as const,
    sm: "xs" as const,
    md: "md" as const,
    lg: "lg" as const,
  },

  // Mobile-first spacing in Stack/Group
  sectionSpacing: {
    xs: "sm" as const,
    sm: "md" as const,
    md: "lg" as const,
    lg: "xl" as const,
  },

  // Touch targets (minimum 44x44px for mobile)
  touchTargetHeight: {
    xs: "44px",
    sm: "44px",
    md: "40px",
    lg: "40px",
  },

  // Button sizes
  buttonSize: {
    xs: "md" as const,
    sm: "md" as const,
    md: "md" as const,
    lg: "lg" as const,
  },
} as const;

/**
 * Media query utilities
 * Use in CSS-in-JS or inline styles
 */
export const mediaQueries = {
  mobile: "@media (max-width: 575px)",
  tablet: "@media (min-width: 576px) and (max-width: 767px)",
  md: "@media (min-width: 768px) and (max-width: 991px)",
  desktop: "@media (min-width: 992px)",
  largeDesktop: "@media (min-width: 1200px)",

  // Mobile first
  tabletUp: "@media (min-width: 576px)",
  desktopUp: "@media (min-width: 992px)",
  lgUp: "@media (min-width: 1200px)",
} as const;

/**
 * Helper to create responsive values quickly
 */
export function responsive<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): ResponsiveValue<T> {
  return {
    xs: mobile,
    sm: tablet ?? mobile,
    md: desktop ?? tablet ?? mobile,
    lg: desktop ?? tablet ?? mobile,
    xl: desktop ?? tablet ?? mobile,
  };
}
