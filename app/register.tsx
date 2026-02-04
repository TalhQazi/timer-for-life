import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/utils/constants';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timezone] = useState('UTC');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter your full name.'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email address.'); return; }
    if (!password.trim()) { Alert.alert('Error', 'Please enter a password.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters long.'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const result = await register({ name: name.trim(), email: email.trim(), password, timezone });
      if (result.success) {
        Alert.alert('Registration Successful', 'Now you can login thorough login screen', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="account-plus" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Timers of Life</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} autoCapitalize="words" autoCorrect={false} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-check" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Confirm your password" placeholderTextColor={COLORS.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.registerButton, isLoading && styles.disabledButton]} onPress={handleRegister} disabled={isLoading}>
              <MaterialCommunityIcons name="account-plus" size={24} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.registerButtonText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
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
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0, 122, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
  form: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: 16 },
  eyeIcon: { padding: 4 },
  registerButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 24, elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  disabledButton: { opacity: 0.6 },
  buttonIcon: { marginRight: 8 },
  registerButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dividerText: { color: COLORS.textSecondary, fontSize: 14, marginHorizontal: 16 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  loginText: { color: COLORS.textSecondary, fontSize: 16 },
  loginLink: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
});
