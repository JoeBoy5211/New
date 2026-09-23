import React, { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StatusBar,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/src/api/client';
import { Mail, Lock, CheckCircle2, ChefHat, ArrowLeft, KeyRound } from 'lucide-react-native';
import { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Input } from '@/components/ui/Input';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.28;

type ForgotStep = 'email' | 'code';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? DARK.background : LIGHT.background;
  const cardBg = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const tint = isDark ? DARK.tint : LIGHT.tint;

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('code');
      setSuccess(`If an account exists, a code was sent to ${email}`);
    } catch (err: any) {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      setSuccess('Password reset successfully!');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.root, { backgroundColor: bg }]}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <Pressable
            style={styles.backBtn}
            onPress={() => step === 'code' ? setStep('email') : router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>

          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <KeyRound size={32} color={BRAND.burgundy} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </Text>
          <Text style={styles.heroSub}>RECOVER YOUR ACCOUNT</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          <View style={[styles.cardAccentBar, { backgroundColor: tint }]} />

          <Text style={[styles.formTitle, { color: text }]}>
            {step === 'email' ? 'Reset via Email' : 'Enter New Password'}
          </Text>
          <Text style={[styles.formSub, { color: subtle }]}>
            {step === 'email' 
              ? 'Enter your email to receive a reset code' 
              : `Code sent to ${email}`}
          </Text>

          <View style={styles.formBody}>
            {step === 'email' ? (
              <Input
                label="Email Address"
                placeholder="e.g. user@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                icon={<Mail size={18} color={subtle} />}
              />
            ) : (
              <>
                <Input
                  label="Reset Code"
                  placeholder="6-digit code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  icon={<CheckCircle2 size={18} color={subtle} />}
                />

                <Input
                  label="New Password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  icon={<Lock size={18} color={subtle} />}
                />

                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  icon={<Lock size={18} color={subtle} />}
                />
              </>
            )}

            {success ? (
              <View style={[styles.successBox, { backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4' }]}>
                <Text style={[styles.successText, { color: '#16a34a' }]}>{success}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? DARK.errorBg : LIGHT.errorBg }]}>
                <Text style={[styles.errorText, { color: isDark ? DARK.error : LIGHT.error }]}>{error}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: tint, opacity: (isLoading || pressed) ? 0.82 : 1 },
            ]}
            onPress={step === 'email' ? handleSendCode : handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {step === 'email' ? 'Send Code' : 'Reset Password'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: BRAND.burgundy,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(204,133,51,0.12)',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: { marginBottom: 12 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2.5,
    fontWeight: '600',
    marginTop: 4,
  },
  formCard: {
    marginTop: -24,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: 28,
    paddingBottom: SPACING.lg,
    minHeight: height * 0.6,
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: '35%',
    right: '35%',
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  formSub: {
    fontSize: TYPOGRAPHY.base,
    marginBottom: SPACING.md,
  },
  formBody: { marginBottom: SPACING.sm },
  errorBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    marginTop: SPACING.md,
  },
  errorText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600' },
  successBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    marginTop: SPACING.md,
  },
  successText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600' },
  primaryBtn: {
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.md,
    fontWeight: '800',
  },
});
