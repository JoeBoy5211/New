import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  ChevronRight,
  Calendar,
  Users,
  MapPin,
  Tag,
  DollarSign,
} from 'lucide-react-native';
import { LIGHT, BRAND, RADIUS } from '@/constants/Colors';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/api/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const bg     = LIGHT.background;
const card   = LIGHT.card;
const text   = LIGHT.text;
const subtle = LIGHT.textSecondary;
const tint   = LIGHT.tint;
const border = LIGHT.border;

const PAYMENT_METHODS = [
  {
    id: 'chapa',
    label: 'Chapa',
    description: 'Cards, Mobile Money & Bank Transfer',
    icon: CreditCard,
    color: '#4F46E5',
    tag: 'Recommended',
  },
  {
    id: 'telebirr',
    label: 'Telebirr',
    description: 'Ethio Telecom Mobile Wallet',
    icon: Smartphone,
    color: '#16A34A',
    tag: null,
  },
  {
    id: 'cbe_birr',
    label: 'CBE Birr',
    description: 'Commercial Bank of Ethiopia',
    icon: Building2,
    color: '#1D4ED8',
    tag: null,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveImageUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const base = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('chapa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ── Load booking ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        if (res.data?.success) {
          setBooking(res.data.data);
        } else {
          throw new Error(res.data?.message || 'Booking not found');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load booking details.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const subtotal   = booking ? Number(booking.total_amount) / 1.15 : 0;
  const vatAmount  = booking ? Number(booking.total_amount) - subtotal : 0;
  const grandTotal = booking ? Number(booking.total_amount) : 0;

  const handlePayment = async () => {
    if (!booking) return;
    setIsProcessing(true);
    try {
      // Create a reliable, dynamic URL that tells Expo exactly how to return to this specific app instance
      const appReturnUrl = Linking.createURL('payment-complete');

      // 1. Initialize Payment on Backend
      const res = await api.post('/payments/initiate', {
        booking_id: booking.id,
        method: selectedMethod,
        app_return_url: appReturnUrl,
      });

      if (!res.data?.success || !res.data?.checkout_url) {
        throw new Error(res.data?.message || 'Could not initiate payment');
      }

      // 2. Open Chapa Checkout in an in-app browser overlay
      // By using openAuthSessionAsync with OUR appReturnUrl, Expo automatically closes the browser 
      // the moment the backend redirects back to this exact scheme.
      await WebBrowser.openAuthSessionAsync(res.data.checkout_url, appReturnUrl);

      // 3. The browser closed (either user completed or aborted).
      // Verify the final status with our backend in case webhook hit
      try {
        const verifyRes = await api.get(`/bookings/${booking.id}`);
        if (verifyRes.data?.data) {
          setBooking(verifyRes.data.data);
        }
      } catch (checkErr) {
        console.log('Poller error:', checkErr);
      }

      // 4. Show success screen — user uses buttons to navigate, no automatic redirect
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Could not process your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={tint} />
        <Text style={{ color: subtle, marginTop: 12 }}>Loading booking details…</Text>
      </View>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successOrb}>
          <CheckCircle2 size={72} color="#16A34A" />
        </View>
        <Text style={styles.successTitle}>Payment Submitted!</Text>
        <Text style={styles.successSub}>
          Your payment has been sent for processing.{'\n\n'}
          Your booking will be marked as{' '}
          <Text style={{ fontWeight: '800', color: tint }}>Completed</Text>
          {' '}once verified by our system.
        </Text>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: tint }]}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Text style={styles.actionBtnText}>View My Bookings</Text>
        </Pressable>
        <Pressable style={{ marginTop: 14 }} onPress={() => router.replace('/(tabs)')}>
          <Text style={{ color: subtle, fontSize: 14, fontWeight: '600' }}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.topTitle, { color: text }]}>Complete Payment</Text>
          <Text style={[styles.topSub, { color: subtle }]}>{booking?.catererName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      >
        {/* Approval Banner */}
        <View style={styles.approvalBanner}>
          <CheckCircle2 size={20} color="#16A34A" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#14532D', fontWeight: '800', fontSize: 14 }}>Booking Approved!</Text>
            <Text style={{ color: '#166534', fontSize: 12, marginTop: 2 }}>
              {booking?.catererName} has approved your request. Complete payment to confirm your booking.
            </Text>
          </View>
        </View>

        {/* Booking Summary */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={styles.sectionLabel}>Booking Summary</Text>

          <DetailRow icon={Tag}      label="Caterer"    value={booking?.catererName} />
          <DetailRow icon={Calendar} label="Event Date" value={new Date(booking?.event_date).toLocaleDateString(undefined, { dateStyle: 'long' })} />
          <DetailRow icon={Users}    label="Guests"     value={`${booking?.guest_count} guests`} />
          <DetailRow icon={MapPin}   label="Venue"      value={booking?.venue || 'Not specified'} />
        </View>

        {/* Cost Breakdown */}
        <View style={[styles.card, { marginBottom: 16, backgroundColor: LIGHT.tintXLight }]}>
          <Text style={styles.sectionLabel}>Payment Breakdown</Text>
          <Row label="Subtotal"    value={`ETB ${subtotal.toLocaleString('en', { maximumFractionDigits: 2 })}`} />
          <Row label="VAT (15%)"   value={`ETB ${vatAmount.toLocaleString('en', { maximumFractionDigits: 2 })}`} />
          <View style={{ height: 1, backgroundColor: border, marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: tint, fontWeight: '800', fontSize: 18 }}>Total Due</Text>
            <Text style={{ color: tint, fontWeight: '800', fontSize: 20 }}>
              ETB {grandTotal.toLocaleString('en', { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={styles.sectionLabel}>Payment Method</Text>
          {PAYMENT_METHODS.map(method => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            return (
              <Pressable
                key={method.id}
                style={[
                  styles.methodRow,
                  { borderColor: isSelected ? method.color : border },
                  isSelected && { backgroundColor: `${method.color}0D` },
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.methodIcon, { backgroundColor: `${method.color}18` }]}>
                  <Icon size={22} color={method.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: text, fontWeight: '700', fontSize: 15 }}>{method.label}</Text>
                    {method.tag && (
                      <View style={[styles.tag, { backgroundColor: method.color }]}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{method.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: subtle, fontSize: 12, marginTop: 2 }}>{method.description}</Text>
                </View>
                <View style={[styles.radio, { borderColor: isSelected ? method.color : border }]}>
                  {isSelected && <View style={[styles.radioFill, { backgroundColor: method.color }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Lock size={14} color={subtle} />
          <Text style={{ color: subtle, fontSize: 12, flex: 1 }}>
            Your payment is secured. We never store your card details.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { borderTopColor: border }]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: tint, opacity: isProcessing ? 0.75 : 1 }]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Lock size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>
                Pay ETB {grandTotal.toLocaleString('en', { maximumFractionDigits: 2 })}
              </Text>
            </>
          )}
        </Pressable>
        <Text style={{ color: subtle, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          By paying you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: LIGHT.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Icon size={16} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: subtle, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: text, fontSize: 14, fontWeight: '600', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ color: subtle, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    backgroundColor: '#FDFCFB',
  },
  backBtn:  { width: 40, height: 40, justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800' },
  topSub:   { fontSize: 12, marginTop: 1 },

  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },

  card: {
    backgroundColor: card,
    borderRadius: RADIUS.lg,
    padding: 16,
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: subtle,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: bg,
    borderTopWidth: 1,
  },
  actionBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#682733',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Success
  successOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(22,163,74,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: text,
    textAlign: 'center',
    marginBottom: 12,
    ...Platform.select({ ios: { fontFamily: 'Georgia' }, android: { fontFamily: 'serif' } }),
  },
  successSub: {
    fontSize: 15,
    lineHeight: 23,
    color: subtle,
    textAlign: 'center',
    marginBottom: 32,
  },
});
