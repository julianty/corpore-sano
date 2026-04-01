import { MantineThemeOverride } from "@mantine/core";
import { designTokens } from "./tokens";

/**
 * Mantine Theme Configuration
 * Customizes the Mantine UI library with our design tokens
 */

export const corporeTheme: MantineThemeOverride = {
  defaultRadius: "md",

  colors: {
    blue: [
      "#E8F3FF",
      "#B8DEFF",
      "#88C9FF",
      "#58B4FF",
      "#289FFF",
      "#1c7ed6",
      "#1560a0",
      "#0e476a",
      "#072E34",
      "#001A1E",
    ],
    orange: [
      "#FFF4D6",
      "#FFE8AC",
      "#FFDC83",
      "#FFD058",
      "#FFC01C",
      "#f59f00",
      "#C17B00",
      "#8D5700",
      "#592D00",
      "#2F1A00",
    ],
  },

  primaryColor: "blue",

  // Font customization
  fontFamily: designTokens.typography.fontFamily.body,
  fontFamilyMonospace: designTokens.typography.fontFamily.mono,

  // Font sizes
  fontSizes: {
    xs: "12px",
    sm: "13px",
    md: "14px",
    lg: "16px",
    xl: "20px",
  },

  // Line height
  lineHeights: {
    xs: "1.2",
    sm: "1.3",
    md: "1.5",
    lg: "1.7",
  },

  // Spacing scale (8px base unit)
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },

  // Radius scale
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },

  // Shadows
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    xs: "0px",
    sm: "576px",
    md: "768px",
    lg: "992px",
    xl: "1200px",
  },

  // Component styles
  components: {
    Button: {
      defaultProps: {
        size: "md",
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: "all 150ms ease-in-out",
          minHeight: "36px",
        },
      },
    },

    TextInput: {
      styles: {
        input: {
          transition:
            "border-color 150ms ease-in-out, box-shadow 150ms ease-in-out",

          "&:focus": {
            borderColor: designTokens.colors.primary,
          },
        },
      },
    },

    NumberInput: {
      styles: {
        input: {
          transition:
            "border-color 150ms ease-in-out, box-shadow 150ms ease-in-out",

          "&:focus": {
            borderColor: designTokens.colors.primary,
          },
        },
      },
    },

    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: {
          blur: 3,
          opacity: 0.3,
        },
      },
      styles: {
        content: {
          borderRadius: "12px",
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          transition: "box-shadow 150ms ease-in-out",
        },
      },
    },

    Table: {
      styles: {
        tr: {
          transition: "background-color 150ms ease-in-out",

          "&:hover": {
            backgroundColor: "var(--mantine-color-gray-0)",
          },
        },
      },
    },

    Group: {
      defaultProps: {
        gap: "md",
      },
    },

    Stack: {
      defaultProps: {
        gap: "md",
      },
    },
  },
};

export default corporeTheme;
