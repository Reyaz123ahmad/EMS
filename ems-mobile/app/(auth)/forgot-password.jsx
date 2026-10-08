import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authService } from '../../services/auth.service.js';
import { Mail, KeyRound, Lock, CheckCircle2, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'RESET' | 'SUCCESS'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccessMessage(`Verification code sent to ${email.trim()}`);
      setCooldown(60);
      setStep('RESET');
    } catch (err) {
      // Return safe message to prevent email enumeration (matching web)
      setSuccessMessage('Verification code processed. Please check your email inbox.');
      setCooldown(60);
      setStep('RESET');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccessMessage('A fresh verification code was sent to your email.');
      setCooldown(60);
    } catch (err) {
      setErrorMessage('Failed to resend code. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('SUCCESS');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to reset password. Please check your OTP code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.iconBadge}>
              {step === 'EMAIL' && <Mail size={32} color="#4F46E5" />}
              {step === 'RESET' && <KeyRound size={32} color="#4F46E5" />}
              {step === 'SUCCESS' && <CheckCircle2 size={32} color="#10B981" />}
            </View>
            <Text style={styles.title}>
              {step === 'EMAIL' && 'Forgot Password'}
              {step === 'RESET' && 'Create New Password'}
              {step === 'SUCCESS' && 'Password Updated!'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'EMAIL' && 'Enter your work email to receive a 6-digit reset code.'}
              {step === 'RESET' && `Enter the 6-digit code sent to ${email} and your new password.`}
              {step === 'SUCCESS' && 'Your password has been securely reset. You can now sign in.'}
            </Text>
          </View>

          {/* Messages */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage && step !== 'SUCCESS' ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.formContainer}>
            {step === 'EMAIL' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Work Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@company.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'RESET' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>6-Digit Verification Code</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text.replace(/\D/g, '').slice(0, 6));
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="At least 8 characters"
                      placeholderTextColor="#94A3B8"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeButtonText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat new password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  <TouchableOpacity
                    onPress={() => setStep('EMAIL')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeEmailText}>Change Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={cooldown > 0 || isLoading}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        cooldown > 0 && styles.resendTextDisabled,
                      ]}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'SUCCESS' && (
              <View style={styles.successContent}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Sign In Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#64748B" />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingVertical: 36,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '800',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 68,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  eyeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  changeEmailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  resendText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#94A3B8',
  },
  successContent: {
    paddingVertical: 8,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  backText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
