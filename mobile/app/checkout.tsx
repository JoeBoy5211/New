import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  View,
  Animated,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
  MessageSquare,
  Clock,
  Phone,
  ChevronDown,
  UtensilsCrossed,
  ClipboardList,
  Check,
  SendHorizonal,
  CheckCircle2,
} from 'lucide-react-native';
import { LIGHT, BRAND, RADIUS, SPACING } from '@/constants/Colors';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/api/client';
import { Calendar } from 'react-native-calendars';

// ── Constants ────────────────────────────────────────────────────────────────

const bg    = LIGHT.background;
const card  = LIGHT.card;
const text  = LIGHT.text;
const subtle= LIGHT.textSecondary;
const tint  = LIGHT.tint;
const border= LIGHT.border;
const surface = LIGHT.surface;

const DEFAULT_EVENT_TYPES   = ['Wedding', 'Corporate', 'Private Party', 'Birthday', 'Anniversary', 'Other'];
const SERVICE_TYPES         = [
  'Full Service (Food & Staff)',
  'Drop-off (Food only)',
  'Corporate / Recurring'
];

const STEPS = [
  { id: 1, label: 'Event',    icon: CalendarDays },
  { id: 2, label: 'Menu',     icon: UtensilsCrossed },
  { id: 3, label: 'Logistics',icon: MapPin },
  { id: 4, label: 'Review',   icon: ClipboardList },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const resolveImageUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ── Dropdown Component ────────────────────────────────────────────────────────

function Dropdown({ value, options, onSelect, placeholder, direction = 'down' }: {
  value: string; options: string[]; onSelect: (v: string) => void; placeholder?: string; direction?: 'up' | 'down';
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ position: 'relative', zIndex: open ? 100 : 1 }}>
      <Pressable
        style={[styles.dropdownBtn, { borderColor: open ? tint : border }]}
        onPress={() => setOpen(o => !o)}
      >
        <Text style={{ color: value ? text : subtle, flex: 1, fontSize: 15 }}>
          {value || placeholder || 'Select…'}
        </Text>
        <ChevronDown size={18} color={subtle} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open && (
        <View style={[styles.dropdownList, direction === 'up' && { top: undefined, bottom: 54 }]}>
          {options.map(opt => (
            <Pressable
              key={opt}
              style={[styles.dropdownItem, value === opt && { backgroundColor: LIGHT.tintXLight }]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              {value === opt && <Check size={14} color={tint} style={{ marginRight: 8 }} />}
              <Text style={{ color: text, fontSize: 14, fontWeight: value === opt ? '700' : '400', flex: 1 }}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { catererId, catererName, minGuests, maxGuests, menuData, eventTypes } = useLocalSearchParams();

  const parsedMinGuests = Number(minGuests) || 10;
  const parsedMaxGuests = Number(maxGuests) || 500;

  const menuItems: any[] = useMemo(() => {
    try { return menuData ? JSON.parse(menuData as string) : []; } catch { return []; }
  }, [menuData]);

  const eventTypeOptions: string[] = useMemo(() => {
    try {
      const raw = eventTypes as string;
      if (!raw) return DEFAULT_EVENT_TYPES;
      const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
      return arr.length > 0 ? arr : DEFAULT_EVENT_TYPES;
    } catch { return DEFAULT_EVENT_TYPES; }
  }, [eventTypes]);

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1 – Event Details
  const todayStr = new Date().toISOString().split('T')[0];
  const [eventDate, setEventDate]     = useState('');
  const [guestCount, setGuestCount]   = useState('');
  const [eventType, setEventType]     = useState('');
  const [serviceType, setServiceType] = useState('');

  // Step 2 – Menu Selection
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);

  // Step 3 – Logistics
  const [venue, setVenue]               = useState('');
  const [phone, setPhone]               = useState((user as any)?.phone || '');
  const [instructions, setInstructions] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);

  // ── Computed ────────────────────────────────────────────────────────────────
  const guests = parseInt(guestCount) || 0;
  const selectedMenuItems = menuItems.filter(m => selectedMenuIds.includes(String(m.id)));
  const menuSubtotal = selectedMenuItems.reduce((acc, item) => acc + Number(item.price) * guests, 0);
  const vatAmount    = menuSubtotal * 0.15;
  const grandTotal   = menuSubtotal + vatAmount;

  // ── Validation per step ─────────────────────────────────────────────────────
  const step1Valid = !!eventDate && guests >= parsedMinGuests && guests <= parsedMaxGuests && !!eventType && !!serviceType;
  const step2Valid = selectedMenuIds.length > 0;
  const step3Valid = !!venue.trim() && !!phone.trim();

  const canProceed = step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : false;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step < 4) setStep(s => s + 1);
  };
  const goBack = () => {
    if (step > 1) setStep(s => s - 1);
    else router.back();
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        customer_id:      user?.id,
        caterer_id:       catererId,
        event_date:       eventDate,
        event_type:       eventType,
        guest_count:      guests,
        service_type:     serviceType,
        venue,
        contact_phone:    phone,
        special_requests: instructions,
        total_amount:     grandTotal,
        status:           'pending_vendor_review',
        items: selectedMenuItems.map(i => ({
          menu_item_id: i.id,
          quantity:     guests,
          unit_price:   i.price,
        })),
      };
      const { data } = await api.post('/bookings', payload);
      if (data.success) {
        setIsSuccess(true);
      } else {
        throw new Error(data.message || 'Booking request failed');
      }
    } catch (err: any) {
      Alert.alert('Request Error', err.message || 'Could not send your booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.successIcon, { backgroundColor: 'rgba(234,179,8,0.12)' }]}>
          <Clock size={64} color="#CA8A04" />
        </View>
        <Text style={[styles.successTitle, { color: text }]}>Request Sent!</Text>
        <Text style={[styles.successSub, { color: subtle }]}>
          Your booking request has been sent to{' '}
          <Text style={{ fontWeight: '800', color: text }}>{catererName}</Text>.
          {'\n\n'}The caterer will review your request and get back to you.{' '}
          <Text style={{ fontWeight: '700', color: '#CA8A04' }}>Payment will only be required after they approve.</Text>
        </Text>

        {/* What happens next */}
        <View style={[styles.card, { width: '100%', marginBottom: 24 }]}>
          <Text style={{ color: text, fontWeight: '800', fontSize: 14, marginBottom: 12 }}>What happens next?</Text>
          <TimelineItem step="1" label="Under Vendor Review" desc="The caterer is reviewing your request" active />
          <TimelineItem step="2" label="Vendor Approves" desc="You'll receive a notification once approved" />
          <TimelineItem step="3" label="Make Payment" desc="Complete your payment to confirm the booking" />
        </View>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: tint, width: '100%' }]}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Text style={styles.primaryBtnText}>Track My Request</Text>
        </Pressable>
        <Pressable style={{ marginTop: 14 }} onPress={() => router.replace('/(tabs)')}>
          <Text style={{ color: subtle, fontSize: 14, fontWeight: '600' }}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { borderBottomColor: border }]}>
        <Pressable style={styles.backBtn} onPress={goBack}>
          <ArrowLeft size={22} color={text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.topTitle, { color: text }]} numberOfLines={1}>{catererName}</Text>
          <Text style={[styles.topSub, { color: subtle }]}>Step {step} of 4</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Step Indicator ── */}
      <View style={styles.stepRow}>
        {STEPS.map((s, idx) => {
          const done    = step > s.id;
          const active  = step === s.id;
          const Icon    = s.icon;
          return (
            <React.Fragment key={s.id}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  done   && { backgroundColor: '#16A34A', borderColor: '#16A34A' },
                  active && { backgroundColor: tint,     borderColor: tint },
                  !done && !active && { backgroundColor: card, borderColor: border },
                ]}>
                  {done
                    ? <Check size={14} color="#fff" />
                    : <Icon size={14} color={active ? '#fff' : subtle} />
                  }
                </View>
                <Text style={[styles.stepLabel, { color: active ? tint : done ? '#16A34A' : subtle }]}>
                  {s.label}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: step > s.id ? '#16A34A' : border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Step Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1 ─ Event Details */}
        {step === 1 && (
          <View>
            <Text style={styles.stepHeading}>Event Details</Text>
            <Text style={[styles.stepDesc, { color: subtle }]}>Tell us about your event so we can prepare the perfect experience.</Text>

            {/* Date Picker */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <CalendarDays size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Event Date</Text>
              </View>
              <Calendar
                current={todayStr}
                minDate={todayStr}
                onDayPress={(day: any) => setEventDate(day.dateString)}
                theme={{
                  backgroundColor: card,
                  calendarBackground: card,
                  textSectionTitleColor: tint,
                  selectedDayBackgroundColor: tint,
                  selectedDayTextColor: '#fff',
                  todayTextColor: tint,
                  dayTextColor: text,
                  textDisabledColor: border,
                  arrowColor: tint,
                  monthTextColor: text,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '800',
                  textDayHeaderFontSize: 12,
                }}
                markedDates={eventDate ? { [eventDate]: { selected: true, selectedColor: tint } } : {}}
              />
              {eventDate ? (
                <View style={styles.selectedDateBadge}>
                  <CalendarDays size={14} color={tint} />
                  <Text style={{ color: tint, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                    {new Date(eventDate).toLocaleDateString(undefined, { dateStyle: 'full' })}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: subtle, fontSize: 12, textAlign: 'center', marginTop: 8 }}>Please select a date</Text>
              )}
            </View>

            {/* Guests */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <Users size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Number of Guests</Text>
              </View>
              <Text style={[styles.inputLabel, { color: subtle }]}>
                Min: {parsedMinGuests}  ·  Max: {parsedMaxGuests}
              </Text>
              <View style={[styles.inputRow, { borderColor: guestCount ? tint : border }]}>
                <Users size={18} color={subtle} />
                <TextInput
                  style={[styles.inputField, { color: text }]}
                  keyboardType="number-pad"
                  value={guestCount}
                  onChangeText={setGuestCount}
                  placeholder={`e.g. ${parsedMinGuests}`}
                  placeholderTextColor={subtle}
                />
              </View>
              {guestCount && (parseInt(guestCount) < parsedMinGuests || parseInt(guestCount) > parsedMaxGuests) && (
                <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>
                  Must be between {parsedMinGuests} and {parsedMaxGuests}
                </Text>
              )}
            </View>

            {/* Event Type */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <ClipboardList size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Event Type</Text>
              </View>
              <Dropdown
                value={eventType}
                options={eventTypeOptions}
                onSelect={setEventType}
                placeholder="Select event type…"
                direction="up"
              />
            </View>

            {/* Service Type */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <UtensilsCrossed size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Service Required</Text>
              </View>
              <Dropdown
                value={serviceType}
                options={SERVICE_TYPES}
                onSelect={setServiceType}
                placeholder="Select service type…"
                direction="up"
              />
            </View>
          </View>
        )}

        {/* STEP 2 ─ Menu Selection */}
        {step === 2 && (
          <View>
            <Text style={styles.stepHeading}>Menu Selection</Text>
            <Text style={[styles.stepDesc, { color: subtle }]}>
              Select the dishes for your event. Prices are per guest × {guests} guests.
            </Text>

            {menuItems.length === 0 ? (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                <UtensilsCrossed size={40} color={border} />
                <Text style={{ color: subtle, marginTop: 12, textAlign: 'center' }}>
                  No menu items available for this caterer.
                </Text>
              </View>
            ) : (
              menuItems.map(item => {
                const isSelected = selectedMenuIds.includes(String(item.id));
                const itemTotal  = Number(item.price) * guests;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.menuCard, isSelected && { borderColor: tint, borderWidth: 2 }]}
                    onPress={() => {
                      setSelectedMenuIds(prev =>
                        isSelected ? prev.filter(x => x !== String(item.id)) : [...prev, String(item.id)]
                      );
                    }}
                  >
                    {item.image ? (
                      <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.menuThumb} />
                    ) : (
                      <View style={[styles.menuThumb, { backgroundColor: surface, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 22 }}>🍽️</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuItemName, { color: text }]} numberOfLines={1}>{item.name}</Text>
                      {item.description ? (
                        <Text style={{ color: subtle, fontSize: 12, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                        <Text style={{ color: subtle, fontSize: 12 }}>ETB {Number(item.price).toLocaleString()} × {guests}</Text>
                        <Text style={{ color: tint, fontSize: 14, fontWeight: '800' }}>ETB {itemTotal.toLocaleString()}</Text>
                      </View>
                    </View>
                    <View style={[styles.menuCheckbox, isSelected && { backgroundColor: tint, borderColor: tint }]}>
                      {isSelected && <Check size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Mini Summary */}
            {selectedMenuIds.length > 0 && (
              <View style={[styles.card, { marginTop: 8, backgroundColor: LIGHT.tintXLight }]}>
                <Text style={{ color: tint, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>Selection Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: subtle, fontSize: 13 }}>Items selected</Text>
                  <Text style={{ color: text, fontWeight: '600' }}>{selectedMenuIds.length} dishes</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: subtle, fontSize: 13 }}>Subtotal</Text>
                  <Text style={{ color: text, fontWeight: '600' }}>ETB {menuSubtotal.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: subtle, fontSize: 13 }}>VAT (15%)</Text>
                  <Text style={{ color: text, fontWeight: '600' }}>ETB {vatAmount.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: LIGHT.border }}>
                  <Text style={{ color: tint, fontWeight: '800', fontSize: 15 }}>Grand Total</Text>
                  <Text style={{ color: tint, fontWeight: '800', fontSize: 15 }}>ETB {grandTotal.toLocaleString()}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* STEP 3 ─ Logistics & Contact */}
        {step === 3 && (
          <View>
            <Text style={styles.stepHeading}>Logistics & Contact</Text>
            <Text style={[styles.stepDesc, { color: subtle }]}>Help us coordinate the event day details.</Text>

            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <MapPin size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Venue / Address</Text>
              </View>
              <View style={[styles.inputRow, { borderColor: venue.trim() ? tint : border }]}>
                <MapPin size={18} color={subtle} />
                <TextInput
                  style={[styles.inputField, { color: text }]}
                  value={venue}
                  onChangeText={setVenue}
                  placeholder="Full venue address or map link"
                  placeholderTextColor={subtle}
                />
              </View>
            </View>

            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <Phone size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Contact Phone</Text>
              </View>
              <View style={[styles.inputRow, { borderColor: phone.trim() ? tint : border }]}>
                <Phone size={18} color={subtle} />
                <TextInput
                  style={[styles.inputField, { color: text }]}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +251 911 234 567"
                  placeholderTextColor={subtle}
                />
              </View>
            </View>

            <View style={[styles.card, { marginBottom: 16 }]}>
              <View style={styles.cardHeader}>
                <MessageSquare size={18} color={tint} />
                <Text style={[styles.cardTitle, { color: text }]}>Special Requests & Dietary Notes</Text>
              </View>
              <Text style={[styles.inputLabel, { color: subtle }]}>Optional</Text>
              <View style={[styles.inputRow, { borderColor: border, alignItems: 'flex-start', minHeight: 100, paddingTop: 12 }]}>
                <MessageSquare size={18} color={subtle} style={{ marginTop: 2 }} />
                <TextInput
                  multiline
                  numberOfLines={4}
                  style={[styles.inputField, { color: text, textAlignVertical: 'top', minHeight: 80 }]}
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="Allergies, setup preferences, dietary restrictions…"
                  placeholderTextColor={subtle}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 4 ─ Review & Submit */}
        {step === 4 && (
          <View>
            <Text style={styles.stepHeading}>Review & Submit</Text>
            <Text style={[styles.stepDesc, { color: subtle }]}>Check your booking details before sending. Payment comes after the vendor approves.</Text>

            {/* Event Summary */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={[styles.summarySection, { color: tint }]}>Event Details</Text>
              <SummaryRow label="Date"    value={new Date(eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <SummaryRow label="Guests"  value={`${guests} guests`} />
              <SummaryRow label="Type"    value={eventType} />
              <SummaryRow label="Service" value={serviceType} />
            </View>

            {/* Menu Summary */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={[styles.summarySection, { color: tint }]}>Menu Selection</Text>
              {selectedMenuItems.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: text, fontSize: 14, flex: 1 }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ color: subtle, fontSize: 13 }}>
                    ETB {(Number(item.price) * guests).toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: border, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: subtle, fontSize: 13 }}>Subtotal</Text>
                <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>ETB {menuSubtotal.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: subtle, fontSize: 13 }}>VAT (15%)</Text>
                <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>ETB {vatAmount.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: border }}>
                <Text style={{ color: tint, fontWeight: '800', fontSize: 15 }}>Estimated Total</Text>
                <Text style={{ color: tint, fontWeight: '800', fontSize: 15 }}>ETB {grandTotal.toLocaleString()}</Text>
              </View>
            </View>

            {/* Logistics Summary */}
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={[styles.summarySection, { color: tint }]}>Logistics</Text>
              <SummaryRow label="Venue" value={venue} />
              <SummaryRow label="Phone" value={phone} />
              {instructions ? <SummaryRow label="Notes" value={instructions} /> : null}
            </View>

            {/* What happens next */}
            <View style={[styles.card, { marginBottom: 16, backgroundColor: '#FFFBEB', borderLeftWidth: 3, borderLeftColor: '#CA8A04' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Clock size={18} color="#CA8A04" />
                <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 14 }}>What happens next?</Text>
              </View>
              <TimelineItem step="1" label="Your request is sent" desc="The vendor will be notified immediately" active />
              <TimelineItem step="2" label="Vendor reviews & approves" desc="Usually within 24 hours" />
              <TimelineItem step="3" label="Payment & confirmation" desc="Pay after approval to lock in the booking" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[styles.bottomBar, { backgroundColor: bg, borderTopColor: border }]}>
        {step === 4 ? (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: tint, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <SendHorizonal size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Send Booking Request</Text>
                </>
              )
            }
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: canProceed ? tint : '#CCC' }]}
            onPress={goNext}
            disabled={!canProceed}
          >
            <Text style={styles.primaryBtnText}>
              {step === 3 ? 'Review Booking' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />
          </Pressable>
        )}
        {!canProceed && step < 4 && (
          <Text style={{ color: subtle, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            {step === 1 && 'Please complete all fields to continue'}
            {step === 2 && 'Please select at least one menu item'}
            {step === 3 && 'Please enter a venue and contact phone'}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Timeline Item Helper ──────────────────────────────────────────────────────

function TimelineItem({ step, label, desc, active }: {
  step: string; label: string; desc: string; active?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: active ? '#CA8A04' : '#E5E7EB',
        justifyContent: 'center', alignItems: 'center',
        marginTop: 1,
      }}>
        <Text style={{ color: active ? '#fff' : '#6B7280', fontSize: 12, fontWeight: '800' }}>{step}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: active ? '#92400E' : text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        <Text style={{ color: subtle, fontSize: 12, marginTop: 2 }}>{desc}</Text>
      </View>
    </View>
  );
}

// ── Summary Row Helper ────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ color: subtle, fontSize: 13, flex: 1 }}>{label}</Text>
      <Text style={{ color: text, fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FDFCFB',
  },
  stepItem:   { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel:  { fontSize: 10, fontWeight: '700' },
  stepLine:   { flex: 1, height: 2, marginHorizontal: 4, borderRadius: 1 },

  // Section headings
  stepHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: text,
    marginTop: 16,
    marginBottom: 4,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  stepDesc: { fontSize: 13, lineHeight: 20, marginBottom: 16 },

  // Cards
  card: {
    backgroundColor: card,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:  { fontSize: 15, fontWeight: '700' },

  // Inputs
  inputLabel: { fontSize: 12, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    height: 50,
    gap: 10,
    backgroundColor: LIGHT.surface,
  },
  inputField: { flex: 1, fontSize: 15 },

  // Dropdown
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: LIGHT.surface,
  },
  dropdownList: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: card,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },

  // Menu cards
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: card,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  menuThumb:    { width: 72, height: 72, borderRadius: RADIUS.sm },
  menuItemName: { fontSize: 15, fontWeight: '700' },
  menuCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Calendar badge
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT.tintXLight,
    padding: 10,
    borderRadius: RADIUS.sm,
    marginTop: 8,
  },

  // Summary
  summarySection: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },

  // Payment placeholder
  paymentPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: border,
  },

  // Success
  successIcon:  { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(104,39,51,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12, ...Platform.select({ ios: { fontFamily: 'Georgia' }, android: { fontFamily: 'serif' } }) },
  successSub:   { fontSize: 15, lineHeight: 23, textAlign: 'center', marginBottom: 32 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#682733',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Legacy (unused but kept to avoid errors)
  divider: { height: 1 },
});
