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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

// ─── Wave SVG at bottom of screen ─────────────────────────────────────────────
function WaveBottom() {
  return (
    <Svg
      viewBox="0 0 375 120"
      style={styles.waveSvg}
      preserveAspectRatio="none"
    >
      <Defs>
        <SvgGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6366F1" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0.15" />
        </SvgGradient>
      </Defs>
      <Path
        d="M0 60 C80 10 160 100 250 50 C310 15 340 70 375 40 L375 120 L0 120 Z"
        fill="url(#waveGrad)"
      />
      <Path
        d="M0 80 C60 40 140 120 230 70 C290 35 340 85 375 60 L375 120 L0 120 Z"
        fill="rgba(99,102,241,0.1)"
      />
    </Svg>
  );
}

// ─── EMS Logo Mark ─────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <View style={styles.logoBlock}>
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        style={styles.logoBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.logoLetters}>EMS</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const { login, isSubmitting } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || (!requires2FA && !password.trim())) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (requires2FA && (!twoFactorToken || twoFactorToken.length < 6)) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMessage('');
    setInfoMessage('');
    const result = await login(
      email.trim(),
      password,
      requires2FA ? twoFactorToken.trim() : undefined
    );

    if (result?.requires2FA) {
      setRequires2FA(true);
      setInfoMessage(result.message || 'Two-factor authentication code sent to your email.');
    } else if (!result?.success) {
      setErrorMessage(result?.error || 'Invalid email or password.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0FF" />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={['#EEF0FF', '#E8EAFF', '#F0F2FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Wave at bottom */}
      <WaveBottom />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <LogoMark />

            {/* Heading */}
            <View style={styles.headingBlock}>
              <Text style={styles.headingTitle}>
                {requires2FA ? 'Two-Factor Verification' : 'Welcome Back'}
              </Text>
              <Text style={styles.headingSubtitle}>
                {requires2FA
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Sign in to your employee workspace'}
              </Text>
            </View>

            {/* Info banner */}
            {infoMessage ? (
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>{infoMessage}</Text>
              </View>
            ) : null}

            {/* Error banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* White Card */}
            <View style={styles.card}>
              {!requires2FA ? (
                <>
                  {/* Email field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <View style={styles.inputRow}>
                      <Mail size={17} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="name@company.com"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Password field */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Password</Text>
                      <TouchableOpacity
                        onPress={() => router.push('/(auth)/forgot-password')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputRow}>
                      <Lock size={17} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { flex: 1, paddingRight: 44 }]}
                        placeholder="Enter your password"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        {showPassword
                          ? <EyeOff size={18} color="#64748B" />
                          : <Eye size={18} color="#64748B" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                /* 2FA field */
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>6-Digit Verification Code</Text>
                  <View style={styles.inputRow}>
                    <KeyRound size={17} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor="#94A3B8"
                      value={twoFactorToken}
                      onChangeText={(t) => {
                        setTwoFactorToken(t.replace(/\D/g, '').slice(0, 6));
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                </View>
              )}

              {/* Sign In button */}
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.signInGradient, isSubmitting && { opacity: 0.7 }]}
              >
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <ArrowRight size={18} color="#FFFFFF" />
                      <Text style={styles.signInText}>
                        {requires2FA ? 'Verify & Sign In' : 'Sign In'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              {requires2FA && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    setRequires2FA(false);
                    setTwoFactorToken('');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backBtnText}>← Back to email login</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <ShieldCheck size={15} color="#94A3B8" />
              <View style={styles.footerTextBlock}>
                <Text style={styles.footerMain}>Secure employee workspace</Text>
                <Text style={styles.footerSub}>Your company portal</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF0FF',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'stretch',
  },

  // Wave
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    width: '100%',
  },

  // Logo
  logoBlock: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetters: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  logoSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // Heading
  headingBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  headingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
    textAlign: 'center',
  },

  // Banners
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoBannerText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
    position: 'absolute',
    right: 12,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '800',
  },

  // Sign In button
  signInGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Back button (2FA)
  backBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerTextBlock: {
    alignItems: 'center',
  },
  footerMain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
});
