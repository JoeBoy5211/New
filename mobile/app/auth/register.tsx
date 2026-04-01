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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/api/client';
import { Mail, Lock, User, Phone, Eye, EyeOff, ChefHat, ArrowLeft } from 'lucide-react-native';
import { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Input } from '@/components/ui/Input';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.28;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? DARK.background : LIGHT.background;
  const cardBg = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const tint = isDark ? DARK.tint : LIGHT.tint;
  const border = isDark ? DARK.border : LIGHT.border;

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
        role: 'customer',
      });
      const { token, user } = response.data;
      await signIn(token, user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          {/* Back button */}
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>

          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <ChefHat size={32} color={BRAND.burgundy} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={styles.heroTitle}>Create Account</Text>
          <Text style={styles.heroSub}>JOIN CATERCONNECT</Text>
        </View>

        {/* ── FORM CARD ── */}
        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          <View style={[styles.cardAccentBar, { backgroundColor: tint }]} />

          <Text style={[styles.formTitle, { color: text }]}>Your Details</Text>
          <Text style={[styles.formSub, { color: subtle }]}>
            Fill in your info to get started
          </Text>

          <View style={styles.formBody}>
            <Input
              label="Full Name"
              placeholder="e.g. Elena Gilbert"
              value={name}
              onChangeText={setName}
              icon={<User size={18} color={subtle} />}
            />

            <Input
              label="Email Address"
              placeholder="e.g. user@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail size={18} color={subtle} />}
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="e.g. +251 911 234 567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={subtle} />}
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon={<Lock size={18} color={subtle} />}
              rightIcon={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={18} color={subtle} />
                  ) : (
                    <Eye size={18} color={subtle} />
                  )}
                </Pressable>
              }
            />

            {/* Terms */}
            <View style={styles.termsRow}>
              <Text style={[styles.termsText, { color: subtle }]}>
                By signing up, you agree to our{' '}
                <Text style={[styles.termsLink, { color: tint }]}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={[styles.termsLink, { color: tint }]}>Privacy Policy</Text>
              </Text>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? DARK.errorBg : LIGHT.errorBg }]}>
                <Text style={[styles.errorText, { color: isDark ? DARK.error : LIGHT.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.registerBtn,
              { backgroundColor: tint, opacity: (isLoading || pressed) ? 0.82 : 1 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerBtnText}>
              {isLoading ? 'Creating Account…' : 'Create Account'}
            </Text>
          </Pressable>

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text style={[styles.signInText, { color: subtle }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/auth/login" asChild>
              <Pressable>
                <Text style={[styles.signInLink, { color: tint }]}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
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
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
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
    marginBottom: SPACING.md,
  },
  formBody: { marginBottom: SPACING.sm },

  termsRow: { marginBottom: SPACING.md, marginTop: -SPACING.sm },
  termsText: { fontSize: TYPOGRAPHY.sm, lineHeight: 20 },
  termsLink: { fontWeight: '700' },

  errorBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
  },
  errorText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600' },

  registerBtn: {
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: BRAND.burgundy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  registerBtnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: { fontSize: TYPOGRAPHY.base },
  signInLink: { fontSize: TYPOGRAPHY.base, fontWeight: '800' },
});
