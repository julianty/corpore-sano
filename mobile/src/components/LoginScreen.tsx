import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  signIn,
  signUp,
  signInWithGoogle,
  GOOGLE_SIGN_IN_CANCELLED,
} from "../lib/auth";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

interface LoginScreenProps {
  onDemoMode: () => void;
}

export function LoginScreen({ onDemoMode }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      // User dismissed the Google picker — not an error worth surfacing.
      if (msg !== GOOGLE_SIGN_IN_CANCELLED) {
        setError(msg || "Google sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Corpore Sano</Text>
      <Text style={styles.subtitle}>
        {mode === "signin" ? "Sign in to your account" : "Create an account"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setError("");
          setMode(mode === "signin" ? "signup" : "signin");
        }}
      >
        <Text style={styles.toggleText}>
          {mode === "signin"
            ? "No account? Sign Up"
            : "Already have an account? Sign In"}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.primaryButtonDisabled]}
        onPress={handleGoogle}
        disabled={loading}
      >
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.demoButton} onPress={onDemoMode}>
        <Text style={styles.demoButtonText}>Continue as Demo</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 32,
      backgroundColor: c.background,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 4,
      color: c.textPrimary,
    },
    subtitle: {
      fontSize: 16,
      color: c.textSecondary,
      marginBottom: 32,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      marginBottom: 12,
      color: c.textPrimary,
    },
    error: {
      color: c.danger,
      fontSize: 13,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: c.accent,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 4,
      marginBottom: 16,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: c.textInverse,
      fontSize: 16,
      fontWeight: "600",
    },
    toggleText: {
      color: c.accent,
      fontSize: 14,
      textAlign: "center",
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      marginVertical: 24,
    },
    googleButton: {
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderInput,
      alignItems: "center",
      marginBottom: 12,
    },
    googleButtonText: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    demoButton: {
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderInput,
      alignItems: "center",
    },
    demoButtonText: {
      color: c.textSecondary,
      fontSize: 15,
    },
  });
}
