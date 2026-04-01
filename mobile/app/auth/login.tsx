import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StatusBar,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/api/client';
import { Mail, Lock, Eye, EyeOff, ChefHat } from 'lucide-react-native';
import { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Input } from '@/components/ui/Input';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme colors
  const bg = isDark ? DARK.background : LIGHT.background;
  const cardBg = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const tint = isDark ? DARK.tint : LIGHT.tint;
  const border = isDark ? DARK.border : LIGHT.border;

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      await signIn(token, user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
        {/* ── HERO SECTION ── */}
        <View style={styles.hero}>
          {/* Decorative circles for premium layered look */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroCircle3} />

          {/* Brand logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <ChefHat size={40} color={BRAND.burgundy} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={styles.heroTitle}>CaterConnect</Text>
          <Text style={styles.heroSub}>PREMIUM CATERING SERVICES</Text>
        </View>

        {/* ── FORM CARD ── */}
        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          {/* Card top accent bar */}
          <View style={[styles.cardAccentBar, { backgroundColor: tint }]} />

          <Text style={[styles.formTitle, { color: text }]}>Welcome Back</Text>
          <Text style={[styles.formSub, { color: subtle }]}>
            Sign in to your account
          </Text>

          <View style={styles.formBody}>
            <Input
              label="Email Address"
              placeholder="e.g. chef@caterconnect.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail size={18} color={subtle} />}
              error={error && !email ? 'Email is required' : undefined}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon={<Lock size={18} color={subtle} />}
              rightIcon={
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={subtle} />
                  ) : (
                    <Eye size={18} color={subtle} />
                  )}
                </Pressable>
              }
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? DARK.errorBg : LIGHT.errorBg }]}>
                <Text style={[styles.errorText, { color: isDark ? DARK.error : LIGHT.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={styles.forgotRow}
              onPress={() => {}}
              hitSlop={8}
            >
              <Text style={[styles.forgotText, { color: tint }]}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Primary CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              { backgroundColor: tint, opacity: (isLoading || pressed) ? 0.82 : 1 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingDots}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[styles.loadingDot, { backgroundColor: '#fff', opacity: 0.6 + i * 0.2 }]}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: border }]} />
            <Text style={[styles.dividerText, { color: subtle }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: border }]} />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={[styles.signUpText, { color: subtle }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/auth/register" asChild>
              <Pressable>
                <Text style={[styles.signUpLink, { color: tint }]}>Create Account</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Bottom padding for content breathing room */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },

  /* ── Hero ── */
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: BRAND.burgundy,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCircle2: {
    position: 'absolute',
    top: 40,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroCircle3: {
    position: 'absolute',
    bottom: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(204,133,51,0.15)', // Gold tint
  },
  logoWrap: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  heroSub: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2.5,
    fontWeight: '600',
    marginTop: 4,
  },

  /* ── Form Card ── */
  formCard: {
    marginTop: -24,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: 32,
    paddingBottom: SPACING.lg,
    minHeight: height * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
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
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  formSub: {
    fontSize: TYPOGRAPHY.base,
    marginBottom: SPACING.lg,
    fontWeight: '400',
  },
  formBody: {
    marginBottom: SPACING.sm,
  },

  /* Error */
  errorBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },

  /* Forgot */
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  forgotText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },

  /* Login Button */
  loginBtn: {
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: BRAND.burgundy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600' },

  /* Sign Up */
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: { fontSize: TYPOGRAPHY.base },
  signUpLink: { fontSize: TYPOGRAPHY.base, fontWeight: '800' },
});
