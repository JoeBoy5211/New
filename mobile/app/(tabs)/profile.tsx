import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  StatusBar,
  View as RNView,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter, Link, useFocusEffect } from 'expo-router';
import {
  Star,
  MoreVertical,
  Bell,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  User,
  Heart,
  LogOut,
  ChevronRight,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Tag,
  MessageSquare,
  ChefHat,
  CreditCard,
  AlertCircle,
} from 'lucide-react-native';

import Colors, { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import BottomSheet, { BottomSheetView, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useMemo, useCallback, useRef } from 'react';

const { width } = Dimensions.get('window');

const resolveImageUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ── Mock data (fallback when API is offline) ──────────────────────────────────

const MOCK_ACTIVE_ORDER = {
  id: 'ao1',
  event: 'Gourmet Garden Events',
  type: 'Corporate Lunch • 24 Guests',
  arrivalTime: 'Arrive by 12:30 PM',
  progress: 0.55, // 55% through "Preparing"
  status: 'PREPARING',
};

const MOCK_SAVED_CATERERS = [
  {
    id: 's1',
    name: 'Artisan Platters Co.',
    description: 'Modern European • Small Gatherings',
    rating: 4.9,
    cover_image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500',
  },
  {
    id: 's2',
    name: 'The Midnight Chef',
    description: 'Fusion Asian • Corporate Dinners',
    rating: 4.8,
    cover_image: 'https://images.unsplash.com/photo-1555507036-ab1f40388081?w=500',
  },
  {
    id: 's3',
    name: 'Terra & Sea',
    description: 'Farm-to-Table • Weddings',
    rating: 4.6,
    cover_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500',
  },
];

const MOCK_ORDER_HISTORY = [
  { id: 'h1', event: 'Corporate Lunch – TechHub', date: 'Feb 20, 2026 • $1,200.00' },
  { id: 'h2', event: 'Executive Dinner – Skyline Room', date: 'Feb 14, 2026 • $2,400.00' },
  { id: 'h3', event: 'Product Launch – Studio A', date: 'Feb 06, 2026 • $850.00' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const bg = isDark ? DARK.background : LIGHT.background;
  const card = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const border = isDark ? DARK.border : LIGHT.border;
  const tint = isDark ? DARK.tint : LIGHT.tint;

  type BookingTab = 'Pending' | 'Upcoming' | 'Completed' | 'Saved';
  const [bookingTab, setBookingTab] = useState<BookingTab>('Pending');
  const [historySubTab, setHistorySubTab] = useState<'All' | 'Declined' | 'Completed'>('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [clearedNotifs, setClearedNotifs] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '90%'], []);

  // ── Queries ──
  const { data: bookingsRes, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      const res = await api.get(`/bookings/customer/${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  // Re-fetch when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) refetchBookings();
    }, [user?.id, refetchBookings])
  );

  const { data: favoritesRes, isLoading: favoritesLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      const res = await api.get(`/favorites/user/${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const allBookings = bookingsRes?.data || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pending = waiting for vendor action
  const activeOrders = allBookings
    .filter((b: any) => b.status?.toLowerCase() === 'pending_review')
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  
  // Upcoming = accepted by vendor (needs payment)
  const upcomingOrders = allBookings
    .filter((b: any) => b.status?.toLowerCase() === 'accepted')
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  
  // History = declined or completed
  const orderHistory = [...allBookings]
    .filter((b: any) => {
      const status = b.status?.toLowerCase();
      if (historySubTab === 'All') return true;
      if (historySubTab === 'Declined') return status === 'declined';
      if (historySubTab === 'Completed') return status === 'completed';
      return true;
    })
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  
  const displayedBookings = 
    bookingTab === 'Pending' ? activeOrders :
    bookingTab === 'Upcoming' ? upcomingOrders :
    orderHistory;

  const savedCaterers = favoritesRes?.data || [];

  // Generate Notifications logic
  const notifications = (() => {
    const list: any[] = [];
    const now = new Date();
    
    allBookings.forEach((b: any) => {
      const eventDate = new Date(b.event_date);
      const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Status updates
      const eventTime = new Date(b.updated_at || b.created_at || now).getTime();
      
      if (b.status === 'accepted') {
        list.push({
          id: `acc-${b.id}`,
          bookingId: b.id,
          title: '✅ Booking Approved!',
          message: `${b.catererName} approved your booking. Tap to complete payment and confirm your spot.`,
          type: 'success',
          time: new Date(eventTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          actionLabel: 'Pay Now →',
          actionRoute: `/booking/${b.id}/pay`,
          createdAt: eventTime,
        });
      } else if (b.status === 'payment_pending') {
        list.push({
          id: `pay-${b.id}`,
          bookingId: b.id,
          title: '💳 Payment Pending',
          message: `Your payment for ${b.catererName} is still pending. Complete it to confirm your booking.`,
          type: 'warning',
          time: new Date(eventTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          actionLabel: 'Complete Payment →',
          actionRoute: `/booking/${b.id}/pay`,
          createdAt: eventTime,
        });
      } else if (b.status === 'declined') {
        list.push({
          id: `dec-${b.id}`,
          title: 'Booking Declined',
          message: `Your booking for ${b.catererName} was not accepted.`,
          type: 'error',
          time: new Date(eventTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAt: eventTime,
        });
      }

      // Schedule reminders (only if not completed/declined/cancelled)
      const isActive = !['completed', 'declined', 'cancelled'].includes(b.status?.toLowerCase());
      if (isActive) {
        if (diffDays === 7) {
          list.push({
            id: `rem-7-${b.id}`,
            title: 'Upcoming Event Reminder',
            message: `Only 1 week left until your ${b.event_type}!`,
            type: 'info',
            time: 'Reminder',
            createdAt: now.getTime() - (1000 * 60 * 60), // Slightly older than current
          });
        } else if (diffDays === 1) {
          list.push({
            id: `rem-1-${b.id}`,
            title: 'Event is Tomorrow!',
            message: `Your event with ${b.catererName} starts tomorrow.`,
            type: 'warning',
            time: 'Urgent',
            createdAt: now.getTime(), 
          });
        }
      }
    });

    return list
      .filter(n => !clearedNotifs.includes(n.id))
      .sort((a, b) => b.createdAt - a.createdAt);
  })();

  const handleClearAll = () => {
    const allIds = notifications.map(n => n.id);
    setClearedNotifs(prev => [...prev, ...allIds]);
  };

  const submitReview = async () => {
    if (!reviewingBooking || !user) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        booking_id: reviewingBooking.id,
        customer_id: user.id,
        caterer_id: reviewingBooking.caterer_id,
        rating,
        comment,
      });

      if (res.data.success) {
        Alert.alert('Success', 'Thank you for your review!');
        setReviewModalVisible(false);
        setComment('');
        setRating(5);
        refetchBookings();
      } else {
        throw new Error(res.data.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  // Not-logged-in state
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.authPrompt, { backgroundColor: 'transparent' }]}>
          <View style={[styles.authIconBg, { backgroundColor: BRAND.burgundy }]}>
            <ChefHat size={48} color={BRAND.champagne} strokeWidth={1.5} />
          </View>
          <Text style={[styles.authTitle, { color: text }]}>Sign In to CaterConnect</Text>
          <Text style={[styles.authSub, { color: subtle }]}>
            Manage your orders, saved caterers, and premium preferences.
          </Text>
          <Link href="/auth/login" asChild>
            <Pressable style={[styles.editProfileBtn, { backgroundColor: isDark ? DARK.tint : LIGHT.tint }]}>
              <Text style={[styles.editProfileBtnText, { color: isDark ? DARK.background : '#FFF' }]}>Sign In to Account</Text>
            </Pressable>
          </Link>
          <Link href="/auth/register" asChild>
            <Pressable style={{ marginTop: 12 }}>
              <Text style={[{ color: subtle, fontSize: 14, fontWeight: '600', textAlign: 'center' }]}>Don't have an account? <Text style={{ color: isDark ? DARK.tint : LIGHT.tint }}>Sign Up</Text></Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <RNView style={{ flex: 1, backgroundColor: bg }}>
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── NAV BAR ── */}
      <View style={[styles.navBar, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.navTitle, { color: theme.tint }]}>CaterConnect</Text>
        <View style={styles.navActions}>
          <Pressable style={styles.navIcon} onPress={() => setNotifModalVisible(true)}>
            <Bell size={22} color={text} />
            {notifications.length > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: theme.tint }]} />
            )}
          </Pressable>
          <Pressable onPress={() => setMenuVisible(true)}>
            <MoreVertical size={24} color={text} />
          </Pressable>
        </View>

        {/* Dropdown Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
            <View style={[styles.dropdownMenu, { backgroundColor: card, shadowColor: '#000' }]}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  handleSignOut();
                }}
              >
                <Text style={[styles.menuItemText, { color: '#E05555' }]}>Sign Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          visible={notifModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setNotifModalVisible(false)}
        >
          <View style={[styles.notifModalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.notifContent, { backgroundColor: bg }]}>
              <View style={[styles.notifHeader, { borderBottomColor: border, borderBottomWidth: 1 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifTitle, { color: text }]}>Notifications</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  {notifications.length > 0 && (
                    <Pressable onPress={handleClearAll}>
                      <Text style={{ color: theme.tint, fontWeight: '700', fontSize: 13 }}>CLEAR ALL</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => setNotifModalVisible(false)}>
                    <X size={24} color={text} />
                  </Pressable>
                </View>
              </View>
              
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifs}>
                  <Bell size={48} color={subtle} />
                  <Text style={[styles.emptyNotifText, { color: subtle }]}>No notifications yet.</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {notifications.map((n) => (
                    <Pressable
                      key={n.id}
                      style={[styles.notifItem, { borderBottomColor: border, borderBottomWidth: 1 }]}
                      onPress={() => {
                        if (n.actionRoute) {
                          setNotifModalVisible(false);
                          router.push(n.actionRoute as any);
                        }
                      }}
                    >
                      <View style={[styles.notifIconWrap,
                        { backgroundColor:
                            n.type === 'success' ? '#E8F5E9' :
                            n.type === 'error'   ? '#FFEBEE' :
                            n.type === 'warning' ? '#FEF3C7' :
                            '#E3F2FD'
                        }
                      ]}>
                        {n.type === 'success' ? <CheckCircle2 size={18} color="#4CAF50" /> :
                         n.type === 'error'   ? <XCircle      size={18} color="#F44336" /> :
                         n.type === 'warning' ? <AlertCircle  size={18} color="#D97706" /> :
                         <Info size={18} color="#2196F3" />}
                      </View>
                      <View style={styles.notifBody}>
                        <View style={styles.notifItemHeader}>
                          <Text style={[styles.notifItemTitle, { color: text }]}>{n.title}</Text>
                          <Text style={[styles.notifTime, { color: n.time === 'Action Required' ? '#D97706' : subtle, fontWeight: n.time === 'Action Required' ? '700' : '400' }]}>{n.time}</Text>
                        </View>
                        <Text style={[styles.notifMessage, { color: subtle }]}>{n.message}</Text>
                        {n.actionLabel && (
                          <Text style={{ color: tint, fontWeight: '700', fontSize: 12, marginTop: 4 }}>{n.actionLabel}</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>

      {/* ── PROFILE HERO ── */}
      <View style={[styles.heroCard, { backgroundColor: card }]}>
        {/* Brand accent top bar */}
        <View style={[styles.heroAccentBar, { backgroundColor: isDark ? DARK.tint : LIGHT.tint }]} />

        {/* Avatar */}
        <View style={[styles.avatarWrap, { backgroundColor: 'transparent' }]}>
          {user.avatar_url ? (
            <Image source={{ uri: resolveImageUrl(user.avatar_url) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: BRAND.burgundy }]}>
              <Text style={[styles.avatarInitials, { color: BRAND.champagne }]}>{initials}</Text>
            </View>
          )}
          {/* Premium tier badge */}
          <View style={[styles.avatarBadge, { backgroundColor: BRAND.gold }]}>
            <ChefHat size={12} color="#FFF" />
          </View>
        </View>

        {/* Name */}
        <Text style={[styles.heroName, { color: text }]}>{user.name}</Text>
        <Text style={[styles.heroRole, { color: subtle }]}>{user.email}</Text>

        {/* Stat chips */}
        <View style={[styles.badgeRow, { backgroundColor: 'transparent', marginBottom: 0, justifyContent: 'center', gap: 10 }]}>
          <View style={[styles.statBadge, { backgroundColor: isDark ? DARK.tintLight : LIGHT.tintXLight }]}>
            <Text style={[styles.statBadgeText, { color: isDark ? DARK.tint : LIGHT.tint }]}>
              {allBookings.length} ORDERS
            </Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: isDark ? '#2A2825' : '#F5F2EE' }]}>
            <Text style={[styles.statBadgeText, { color: text }]}>PREMIUM MEMBER</Text>
          </View>
        </View>
      </View>

        {/* Review Modal */}
        <Modal
          visible={reviewModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ 
              backgroundColor: bg, 
              width: '100%', 
              borderRadius: 24, 
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: text }}>Rate Your Experience</Text>
                <Pressable onPress={() => setReviewModalVisible(false)}>
                  <X size={24} color={text} />
                </Pressable>
              </View>

              <Text style={{ color: subtle, marginBottom: 20 }}>
                How was your event with <Text style={{ fontWeight: '700', color: text }}>{reviewingBooking?.catererName}</Text>?
              </Text>

              {/* Star Rating */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => setRating(s)}>
                    <Star 
                      size={36} 
                      color={s <= rating ? BRAND.gold : (isDark ? '#333' : '#E0DDD8')} 
                      fill={s <= rating ? BRAND.gold : 'transparent'} 
                    />
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={{ 
                  backgroundColor: isDark ? DARK.surface : '#F8F6F4', 
                  borderRadius: 16, 
                  padding: 16, 
                  height: 120, 
                  color: text, 
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: border,
                  marginBottom: 24
                }}
                multiline
                placeholder="Share more details about the food and service..."
                placeholderTextColor={subtle}
                value={comment}
                onChangeText={setComment}
              />

              <Pressable 
                onPress={submitReview}
                disabled={isSubmittingReview}
                style={{ 
                  backgroundColor: BRAND.burgundy, 
                  borderRadius: 16, 
                  height: 56, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  opacity: isSubmittingReview ? 0.6 : 1
                }}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color={BRAND.champagne} />
                ) : (
                  <Text style={{ color: BRAND.champagne, fontSize: 16, fontWeight: '700' }}>Submit Review</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

      {/* ── MY BOOKINGS ── */}
      <View style={[styles.section, { backgroundColor: 'transparent' }]}>
        <View style={[styles.sectionRow, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>My Bookings</Text>
        </View>

        {/* Booking Tabs — pill container style */}
        <View style={[styles.bookingTabsContainer, { backgroundColor: isDark ? DARK.tintLight : LIGHT.surface }]}>
          {(['Pending', 'Upcoming', 'Completed', 'Saved'] as BookingTab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.bookingTab,
                bookingTab === tab && {
                  backgroundColor: isDark ? DARK.card : LIGHT.card,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
              onPress={() => setBookingTab(tab)}
            >
              <Text style={[styles.bookingTabText, { color: bookingTab === tab ? (isDark ? DARK.tint : LIGHT.tint) : subtle }]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sub-tabs for History (Completed) */}
        {bookingTab === 'Completed' && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: -4 }}>
            {(['All', 'Declined', 'Completed'] as const).map(sub => (
              <Pressable 
                key={sub}
                onPress={() => setHistorySubTab(sub)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: historySubTab === sub ? (isDark ? '#3A3836' : '#F0EDE9') : (isDark ? 'transparent' : 'transparent'),
                  borderWidth: 1,
                  borderColor: historySubTab === sub ? (isDark ? '#555' : '#D0D0D0') : (isDark ? '#333' : '#EEE'),
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: historySubTab === sub ? '700' : '500', color: historySubTab === sub ? text : subtle }}>
                  {sub}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {bookingTab === 'Saved' ? (
          favoritesLoading ? (
            <ActivityIndicator color={theme.tint} style={{ marginVertical: 20 }} />
          ) : savedCaterers.length === 0 ? (
            <View style={[styles.orderCard, { backgroundColor: card, padding: 20, alignItems: 'center' }]}>
              <Text style={{ color: subtle }}>You haven't saved any caterers yet.</Text>
            </View>
          ) : (
            savedCaterers.map((caterer: any) => (
              <Pressable
                key={caterer.id}
                style={[styles.savedCardSmall, { backgroundColor: card, marginBottom: 12 }]}
                onPress={() => router.push(`/caterer/${caterer.id}`)}
              >
                <Image 
                  source={{ uri: resolveImageUrl(caterer.cover_image) || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200' }} 
                  style={styles.savedImageSmall} 
                />
                <View style={styles.savedInfoSmall}>
                  <View style={styles.savedHeaderSmall}>
                    <Text style={[styles.savedNameSmall, { color: text }]} numberOfLines={1}>
                      {caterer.name}
                    </Text>
                    <Heart size={14} color="#E05555" fill="#E05555" />
                  </View>
                  <Text style={[styles.savedDescSmall, { color: subtle }]} numberOfLines={1}>
                    {caterer.description || 'Premium catering service'}
                  </Text>
                  <View style={styles.savedMetaSmall}>
                    <Star size={10} color="#FFD700" fill="#FFD700" />
                    <Text style={[styles.ratingTextSmall, { color: text }]}>
                      {Number(caterer.ratingValue || caterer.rating || 5).toFixed(1)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )
        ) : bookingsLoading ? (
          <ActivityIndicator color={theme.tint} style={{ marginVertical: 20 }} />
        ) : displayedBookings.length === 0 ? (
          <View style={[styles.orderCard, { backgroundColor: card, padding: 20, alignItems: 'center' }]}>
            <Text style={{ color: subtle }}>No {bookingTab.toLowerCase()} bookings found.</Text>
          </View>
        ) : (
          displayedBookings.map((order: any) => {
            const isAccepted = order.status?.toLowerCase() === 'accepted';
            const needsPayment = isAccepted;
            
            return (
              <Pressable 
                key={order.id} 
                style={[styles.savedCardSmall, { backgroundColor: card, marginBottom: 12 }]}
                onPress={() => {
                  setSelectedBooking(order);
                  bottomSheetRef.current?.expand();
                }}
              >
                {/* Small Food image */}
                <Image
                  source={{ uri: resolveImageUrl(order.cover_image) || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200' }}
                  style={styles.savedImageSmall}
                />

                <View style={styles.savedInfoSmall}>
                  <View style={styles.savedHeaderSmall}>
                    <Text style={[styles.savedNameSmall, { color: text }]} numberOfLines={1}>{order.catererName}</Text>
                    
                    {/* Compact Status Badge */}
                    <View style={[styles.orderStatusBadge, { 
                      marginBottom: 0, 
                      paddingVertical: 2, 
                      paddingHorizontal: 6,
                      backgroundColor:
                        order.status === 'pending_review'  ? '#D97706' :
                        order.status === 'accepted'        ? '#16A34A' :
                        order.status === 'declined'        ? '#DC2626' :
                        order.status === 'completed'       ? '#2196F3' :
                        theme.tint
                    }]}>
                      <Text style={[styles.orderStatusText, { fontSize: 8 }]}>
                        {order.status === 'pending_review' ? 'PENDING REVIEW' : order.status?.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.savedDescSmall, { color: subtle }]} numberOfLines={1}>
                    {order.event_type} • {order.guest_count} Guests • {new Date(order.event_date).toLocaleDateString()}
                  </Text>
                  
                  <Text style={{ color: subtle, opacity: 0.6, fontSize: 10, marginTop: 1 }}>
                    Placed: {new Date(order.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>

                  {needsPayment && (
                    <Pressable
                      style={{ 
                        marginTop: 6, 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: '#D97706', 
                        paddingVertical: 4, 
                        paddingHorizontal: 10, 
                        borderRadius: 6, 
                        alignSelf: 'flex-start' 
                      }}
                      onPress={() => router.push(`/booking/${order.id}/pay` as any)}
                    >
                      <CreditCard size={10} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>Pay Now</Text>
                    </Pressable>
                  )}

                  {/* Review Button for completed/confirmed bookings */}
                  {(order.status === 'completed' || order.status === 'confirmed') && (
                    <Pressable
                      style={{ 
                        marginTop: 6, 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: isDark ? '#333' : '#F0EDE9', 
                        paddingVertical: 4, 
                        paddingHorizontal: 10, 
                        borderRadius: 6, 
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: border,
                        opacity: order.is_reviewed > 0 ? 0.4 : 1
                      }}
                      disabled={order.is_reviewed > 0}
                      onPress={() => {
                        setReviewingBooking(order);
                        setReviewModalVisible(true);
                      }}
                    >
                      <Star size={10} color={isDark ? DARK.tint : LIGHT.tint} fill={isDark ? DARK.tint : LIGHT.tint} />
                      <Text style={{ color: text, fontSize: 10, fontWeight: '700', marginLeft: 4 }}>
                        {order.is_reviewed > 0 ? 'Reviewed' : 'Leave a Review'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Remove redundant saved section header/logic */}


        {/* Bottom padding */}
        <View style={{ height: 8, backgroundColor: 'transparent' }} />

        {/* Sign out */}
        <View style={[styles.section, { backgroundColor: 'transparent', marginBottom: 48 }]}>
          <View style={[styles.signOutSeparator, { borderColor: border }]} />
          <Pressable
            style={[styles.signOutRow, { backgroundColor: card }]}
            onPress={handleSignOut}
          >
            <View style={[styles.signOutIconWrap, { backgroundColor: 'rgba(224,85,85,0.1)' }]}>
              <LogOut size={18} color="#E05555" />
            </View>
            <Text style={styles.signOutText}>Sign Out</Text>
            <ChevronRight size={18} color="#E05555" style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>
      </ScrollView>

      {/* ── BOOKING DETAILS BOTTOM SHEET ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        backgroundStyle={{ backgroundColor: card }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#555' : '#ccc' }}
      >
        <BottomSheetView style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: text }]}>Booking Details</Text>
          {selectedBooking && (
             <View style={[styles.orderStatusBadge, { backgroundColor: selectedBooking.status === 'accepted' ? '#16A34A' : selectedBooking.status === 'completed' ? '#2196F3' : selectedBooking.status === 'declined' ? '#DC2626' : '#D97706', marginBottom: 0 }]}>
                <Text style={styles.orderStatusText}>
                  {selectedBooking.status === 'pending_review' ? 'PENDING REVIEW' : selectedBooking.status.toUpperCase()}
                </Text>
             </View>
          )}
        </BottomSheetView>

        <BottomSheetScrollView contentContainerStyle={styles.sheetScroll}>
          {selectedBooking ? (
            <View style={{ gap: 24, paddingBottom: 40 }}>
              {/* Primary Info */}
              <View style={{ gap: 16 }}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' }]}>
                    <Tag size={18} color={theme.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: subtle }]}>Caterer</Text>
                    <Text style={[styles.detailValue, { color: text }]}>{selectedBooking.catererName}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                   <View style={[styles.detailIcon, { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' }]}>
                     <Calendar size={18} color={theme.tint} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.detailLabel, { color: subtle }]}>Event Date</Text>
                     <Text style={[styles.detailValue, { color: text }]}>{new Date(selectedBooking.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                   </View>
                </View>

                <View style={styles.detailRow}>
                   <View style={[styles.detailIcon, { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' }]}>
                     <MapPin size={18} color={theme.tint} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.detailLabel, { color: subtle }]}>Venue Location</Text>
                     <Text style={[styles.detailValue, { color: text }]}>{selectedBooking.venue || 'Not specified'}</Text>
                   </View>
                </View>

                <View style={styles.detailRow}>
                   <View style={[styles.detailIcon, { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' }]}>
                     <Users size={18} color={theme.tint} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.detailLabel, { color: subtle }]}>Guest Count</Text>
                     <Text style={[styles.detailValue, { color: text }]}>{selectedBooking.guest_count} guests</Text>
                   </View>
                </View>

                <View style={styles.detailRow}>
                   <View style={[styles.detailIcon, { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' }]}>
                     <DollarSign size={18} color={theme.tint} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.detailLabel, { color: subtle }]}>Total Amount</Text>
                     <Text style={[styles.detailValue, { color: theme.tint, fontWeight: '800', fontSize: 20 }]}>ETB {Number(selectedBooking.total_amount).toLocaleString()}</Text>
                   </View>
                </View>
              </View>

              {/* Itemized Menu */}
              {selectedBooking.items && selectedBooking.items.length > 0 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: text, fontSize: 16, marginBottom: 12 }]}>Selected Menu Items</Text>
                  <View style={[styles.menuTable, { borderColor: border }]}>
                     {selectedBooking.items.map((item: any, i: number) => (
                       <View key={i} style={[styles.menuTableRow, { borderBottomWidth: i === selectedBooking.items.length - 1 ? 0 : 1, borderBottomColor: border }]}>
                         <View style={{ flex: 1 }}>
                           <Text style={[styles.menuItemName, { color: text }]}>{item.name}</Text>
                           <Text style={[styles.menuItemQty, { color: subtle }]}>Qty: {item.quantity} × ETB {Number(item.unit_price).toLocaleString()}</Text>
                         </View>
                         <Text style={[styles.menuItemPrice, { color: text }]}>ETB {(item.quantity * item.unit_price).toLocaleString()}</Text>
                       </View>
                     ))}
                  </View>
                </View>
              )}

              {/* Special Requests */}
              <View style={[styles.requestBox, { backgroundColor: isDark ? '#2A2825' : '#FFF9F0', borderColor: isDark ? '#3A3836' : '#FFE8CC' }]}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                   <MessageSquare size={16} color="#E67E22" />
                   <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E67E22' : '#D35400' }}>Special Requests</Text>
                 </View>
                 <Text style={{ fontSize: 14, fontStyle: 'italic', color: isDark ? '#FAF9F6' : '#A04000' }}>
                   "{selectedBooking.special_requests || 'No special requests provided.'}"
                 </Text>
              </View>
              {/* Pay Now CTA — shown for accepted bookings */}
              {selectedBooking && selectedBooking.status?.toLowerCase() === 'accepted' && (
                <Pressable
                  style={[styles.manageBtn, { backgroundColor: '#16A34A', borderColor: '#16A34A', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 }]}
                  onPress={() => {
                    bottomSheetRef.current?.close();
                    router.push(`/booking/${selectedBooking.id}/pay` as any);
                  }}
                >
                  <CreditCard size={18} color="#fff" />
                  <Text style={[styles.manageBtnText, { color: '#fff', fontSize: 15, fontWeight: '800' }]}>Pay Now</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </RNView>

  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* nav */
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    zIndex: 10,
  },
  navTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navIcon: {
    position: 'relative',
    padding: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 75,
    right: 20,
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* notifications modal */
  notifModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  notifContent: {
    height: '70%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  notifTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  emptyNotifs: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyNotifText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  notifItem: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notifItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 20,
  },

  /* hero card */
  heroCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.xxl,
    paddingVertical: 28,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  heroAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  avatarWrap: { position: 'relative', marginBottom: 14, marginTop: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800' },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  heroName: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    marginBottom: 2,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  heroRole: { fontSize: TYPOGRAPHY.sm, textAlign: 'center', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
  },
  statBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  editProfileBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* sections */
  section: { marginHorizontal: 16, marginBottom: 28 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  sectionLink: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  /* active order card / bookings */
  bookingTabsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  bookingTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingTabText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },
  orderCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderImage: { width: '100%', height: 110 },
  orderBody: { padding: 12 },
  orderStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  orderStatusText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  orderEventName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  orderMeta: { fontSize: 12, marginBottom: 8 },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  manageBtn: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnText: { fontSize: 13, fontWeight: '700' },

  /* saved caterers - small version */
  savedCardSmall: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savedImageSmall: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  savedInfoSmall: {
    flex: 1,
    paddingLeft: 12,
  },
  savedHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  savedNameSmall: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  savedDescSmall: {
    fontSize: 12,
    marginBottom: 4,
  },
  savedMetaSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingTextSmall: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* bottom sheet */
  sheetHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    paddingTop: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  sheetScroll: { padding: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700' },
  menuTable: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuTableRow: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  menuItemName: { fontSize: 14, fontWeight: '700' },
  menuItemQty: { fontSize: 12, marginTop: 2 },
  menuItemPrice: { fontSize: 14, fontWeight: '800' },
  requestBox: { padding: 16, borderRadius: 16, borderLeftWidth: 4 },

  /* order history */
  historyList: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: { flex: 1 },
  historyEvent: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  historyMeta: { fontSize: 12 },
  loadMoreBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
  signOutSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
    marginHorizontal: 8,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  signOutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: { fontSize: TYPOGRAPHY.base, fontWeight: '700', color: '#E05555' },

  /* auth prompt */
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  authIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: BRAND.burgundy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  authTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  authSub: { fontSize: TYPOGRAPHY.base, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});