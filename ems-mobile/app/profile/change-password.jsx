import React, { useState } from 'react';
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
import { KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Confirm password does not match new password.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to update password. Please check your current password.'
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
              <Text style={styles.headerTitle}>Change Password</Text>
              <Text style={styles.headerSubtitle}>
                Ensure your account is using a secure password.
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

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrent(!showCurrent)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeButtonText}>
                    {showCurrent ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNew(!showNew)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeButtonText}>
                    {showNew ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Must be at least 8 characters long.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirm(!showConfirm)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeButtonText}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <KeyRound size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
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
    marginBottom: 8,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
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
    right: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  eyeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
