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
import { useAuth } from '../../hooks/useAuth';
import { storage } from '../../utils/storage.js';
import { authService } from '../../services/auth.service.js';
import { ShieldCheck, ShieldAlert, ArrowLeft, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react-native';

export default function TwoFactorScreen() {
  const router = useRouter();
  const { user, setUser, refreshUser } = useAuth();

  const [isEnabled, setIsEnabled] = useState(user?.twoFactorEnabled || false);
  const [step, setStep] = useState(user?.twoFactorEnabled ? 'STATUS' : 'INTRO'); // 'INTRO' | 'OTP' | 'STATUS'
  const [otp, setOtp] = useState('');
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

  useEffect(() => {
    if (user?.twoFactorEnabled !== undefined) {
      setIsEnabled(user.twoFactorEnabled);
      if (user.twoFactorEnabled) {
        setStep('STATUS');
      }
    }
  }, [user]);

  const handleSendEnableOTP = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await authService.sendOTP({
        email: user?.email,
        purpose: 'LOGIN_2FA',
      });
      setSuccessMessage(`A 6-digit activation code was sent to ${user?.email}`);
      setCooldown(60);
      setStep('OTP');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to send activation code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEnable = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await authService.verifyOTP({
        email: user?.email,
        otp: otp.trim(),
        purpose: 'LOGIN_2FA',
      });

      const updatedUser = {
        ...user,
        twoFactorEnabled: true,
      };
      setUser(updatedUser);
      await storage.setItem('user', updatedUser);
      setIsEnabled(true);
      setStep('STATUS');
      setSuccessMessage('Two-Factor Authentication is now enabled!');
      setOtp('');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid or expired 2FA code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const updatedUser = {
        ...user,
        twoFactorEnabled: false,
      };
      setUser(updatedUser);
      await storage.setItem('user', updatedUser);
      setIsEnabled(false);
      setStep('INTRO');
      setSuccessMessage('Two-Factor Authentication has been disabled.');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to disable 2FA.'
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
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
              <Text style={styles.headerSubtitle}>
                Add extra security verification to your account.
              </Text>
            </View>
          </View>

          {/* Status Badge Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <ShieldCheck
                size={22}
                color={isEnabled ? '#10B981' : '#64748B'}
              />
              <View>
                <Text style={styles.statusCardTitle}>2FA Protection</Text>
                <Text style={styles.statusCardSubtitle}>
                  {isEnabled
                    ? 'Active on sign-in sessions'
                    : 'Currently disabled on your account'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.badge,
                isEnabled ? styles.badgeEnabled : styles.badgeDisabled,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isEnabled ? styles.badgeTextEnabled : styles.badgeTextDisabled,
                ]}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          {/* Messages */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBanner}>
              <CheckCircle2 size={18} color="#059669" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Main Card Content */}
          <View style={styles.formCard}>
            {isEnabled ? (
              <View style={styles.enabledSection}>
                <View style={styles.infoBox}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <View style={styles.infoBoxContent}>
                    <Text style={styles.infoBoxTitle}>
                      Your account is protected with 2FA
                    </Text>
                    <Text style={styles.infoBoxText}>
                      A 6-digit one-time passcode is sent to your registered email during each sign-in attempt.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.disableButton, isLoading && styles.buttonDisabled]}
                  onPress={handleDisable2FA}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#DC2626" size="small" />
                  ) : (
                    <Text style={styles.disableButtonText}>Disable 2FA</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {step === 'INTRO' && (
                  <View style={styles.introSection}>
                    <Text style={styles.introHeading}>
                      Protect your workplace account
                    </Text>
                    <Text style={styles.introText}>
                      When Two-Factor Authentication is enabled, sign-in attempts will require a 6-digit verification code sent securely to your email address ({user?.email}).
                    </Text>

                    <TouchableOpacity
                      style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                      onPress={handleSendEnableOTP}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Setup 2FA Authentication
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {step === 'OTP' && (
                  <View style={styles.otpSection}>
                    <Text style={styles.inputLabel}>
                      Enter 6-Digit Activation Code
                    </Text>
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

                    <TouchableOpacity
                      style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                      onPress={handleVerifyEnable}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Verify & Activate 2FA
                        </Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.resendRow}>
                      <TouchableOpacity
                        onPress={() => setStep('INTRO')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleSendEnableOTP}
                        disabled={cooldown > 0 || isLoading}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.resendText,
                            cooldown > 0 && styles.resendTextDisabled,
                          ]}
                        >
                          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEnabled: {
    backgroundColor: '#ECFDF5',
  },
  badgeDisabled: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextEnabled: {
    color: '#059669',
  },
  badgeTextDisabled: {
    color: '#64748B',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  introSection: {
    gap: 14,
  },
  introHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  introText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  otpSection: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelText: {
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
  enabledSection: {
    gap: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  infoBoxContent: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 18,
  },
  disableButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
