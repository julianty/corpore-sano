import { useContext } from "react";
import { useColorScheme } from "react-native";
import { UserProfileContext } from "../app/_layout";

export type AppColors = {
  background: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  borderSubtle: string;
  borderInput: string;
  handle: string;
  overlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentSubtle: string;
  danger: string;
  dangerBg: string;
};

const light: AppColors = {
  background: "#fff",
  surface: "#f5f5f5",
  surfaceVariant: "#f0f0f0",
  border: "#ddd",
  borderSubtle: "#eee",
  borderInput: "#ccc",
  handle: "#ddd",
  overlay: "rgba(0,0,0,0.4)",
  textPrimary: "#111",
  textSecondary: "#555",
  textMuted: "#999",
  textInverse: "#fff",
  accent: "#007AFF",
  accentSubtle: "#eef4ff",
  danger: "#cc3300",
  dangerBg: "#f44336",
};

const dark: AppColors = {
  background: "#111114",
  surface: "#1c1c20",
  surfaceVariant: "#252528",
  border: "#2e2e34",
  borderSubtle: "#222226",
  borderInput: "#3a3a40",
  handle: "#3a3a40",
  overlay: "rgba(0,0,0,0.6)",
  textPrimary: "#ebebeb",
  textSecondary: "#aaa",
  textMuted: "#666",
  textInverse: "#fff",
  accent: "#007AFF",
  accentSubtle: "#1a2a3a",
  danger: "#ff4422",
  dangerBg: "#f44336",
};

// Falls back to device scheme when UserProfileContext is unavailable (e.g. LoginScreen)
export function useAppScheme(): "light" | "dark" {
  const ctx = useContext(UserProfileContext);
  const deviceScheme = useColorScheme() ?? "light";
  return ctx?.resolvedColorScheme ?? deviceScheme;
}

export function useAppTheme(): AppColors {
  const scheme = useAppScheme();
  return scheme === "dark" ? dark : light;
}
