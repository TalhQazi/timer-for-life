import { useAuth } from "@/src/contexts/AuthContext";
import { COLORS } from "@/src/utils/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        Alert.alert("Success", result.message, [
          { text: "OK", onPress: () => router.replace("/home") },
        ]);
      } else {
        Alert.alert("Login Failed", result.message);
      }
    } catch (e) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Authentication",
      "You can use the app without an account, but your data will only be stored locally on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => router.replace("/home") },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/timer.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <MaterialCommunityIcons
                name="login"
                size={24}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.loginButtonText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>

            <View style={styles.privacyRow}>
              <Text style={styles.privacyText}>
                To login you are accpecting our{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
                <Text style={styles.privacyLink}>privacy policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
  header: { alignItems: "center", marginBottom: 40, marginTop: 20 },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoImage: { width: 80, height: 80 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center" },
  form: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: 16 },
  eyeIcon: { padding: 4 },
  loginButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: { opacity: 0.6 },
  buttonIcon: { marginRight: 8 },
  loginButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginHorizontal: 16,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  registerText: { color: COLORS.textSecondary, fontSize: 16 },
  registerLink: { color: COLORS.primary, fontSize: 16, fontWeight: "600" },
  skipButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  privacyRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
  },
  privacyText: { color: COLORS.textSecondary, fontSize: 13 },
  privacyLink: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
});
