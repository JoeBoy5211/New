import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  Platform,
  Share,
  ActivityIndicator,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Text, View as ThemedView } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import {
  Star,
  MapPin,
  ArrowLeft,
  Heart,
  Share2,
  Award,
  CalendarCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import Colors, { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY, SHADOW } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

const PRICE_LABELS: Record<string, string> = {
  '$': 'Budget Friendly',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury',
};

const resolveImageUrl = (path?: string) => {
  if (!path) return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800';
  if (path.startsWith('http')) return path;
  
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ── Sub-Components ────────────────────────────────────────────────────────────
const ServiceImageCarousel = ({ images }: { images: string[] }) => {
  const [index, setIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [layoutWidth, setLayoutWidth] = useState(width - 32); // Fallback width

  useEffect(() => {
    if (!images || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setIndex((prev) => {
        const nextIdx = (prev + 1) % images.length;
        scrollViewRef.current?.scrollTo({ x: nextIdx * layoutWidth, animated: true });
        return nextIdx;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [images, layoutWidth]);

  if (!images || images.length === 0) return null;

  const goToNext = () => {
    setIndex((prev) => {
      const nextIdx = (prev + 1) % images.length;
      scrollViewRef.current?.scrollTo({ x: nextIdx * layoutWidth, animated: true });
      return nextIdx;
    });
  };

  const goToPrev = () => {
    setIndex((prev) => {
      const prevIdx = (prev - 1 + images.length) % images.length;
      scrollViewRef.current?.scrollTo({ x: prevIdx * layoutWidth, animated: true });
      return prevIdx;
    });
  };

  return (
    <>
      <View 
        style={carouselStyles.container}
        onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
          scrollEnabled={false} // Managed by buttons and interval
        >
          {images.map((img, i) => (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.9} 
              style={{ width: layoutWidth, height: 200 }}
              onPress={() => setModalVisible(true)}
            >
              <Image 
                source={{ uri: img }} 
                style={carouselStyles.image} 
                resizeMode="cover" 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {images.length > 1 && (
          <>
            <Pressable onPress={goToPrev} style={[carouselStyles.navBtn, { left: 8 }]}>
              <ChevronLeft size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={goToNext} style={[carouselStyles.navBtn, { right: 8 }]}>
              <ChevronRight size={22} color="#fff" />
            </Pressable>
            <View style={carouselStyles.indicator}>
              <Text style={carouselStyles.indicatorText}>{index + 1} / {images.length}</Text>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={carouselStyles.modalContainer}>
          <TouchableOpacity 
            style={carouselStyles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          >
            <Image 
              source={{ uri: images[index] }} 
              style={carouselStyles.modalImage} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={carouselStyles.closeBtn} 
            onPress={() => setModalVisible(false)}
          >
            <Text style={carouselStyles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const carouselStyles = StyleSheet.create({
  container: { position: 'relative', marginBottom: 12, width: '100%' },
  image: { width: '100%', height: 200, borderRadius: 12 },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  indicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function CatererProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? DARK.background : LIGHT.background;
  const card = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const border = isDark ? DARK.border : LIGHT.border;
  const tint = isDark ? DARK.tint : LIGHT.tint;

  const [activeTab, setActiveTab] = useState('About');
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: rawCaterer, isLoading } = useQuery({
    queryKey: ['caterer', id],
    queryFn: async () => {
      const res = await api.get(`/caterers/${id}`);
      return res.data;
    },
    retry: false,
  });

  const { data: favStatus, refetch: refetchFav } = useQuery({
    queryKey: ['check-favorite', id, user?.id],
    queryFn: async () => {
      const res = await api.get(`/favorites/check?userId=${user?.id}&catererId=${id}`);
      return res.data;
    },
    enabled: !!user?.id && !!id,
  });

  // Sync state with query
  useEffect(() => {
    if (favStatus?.success) {
      setIsFavorite(favStatus.isFavorited);
    }
  }, [favStatus]);

  const caterer = rawCaterer?.data;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  if (!caterer) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={[{ color: text, marginBottom: 20, fontSize: 18, fontWeight: '700' }]}>Vendor not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.confirmBtn, { width: '100%', backgroundColor: tint }]}>
          <Text style={styles.confirmBtnText}>Go Back</Text>
        </Pressable>
      </ThemedView>
    );
  }

  // Real Menu Processing
  const realMenu: any[] = caterer.menuItems || [];
  const groupedMenu = realMenu.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const menuTabs = ['About', 'Menu', 'Services', 'Reviews'];
  
  // Process additional services
  const displayServices = (caterer.services || []).map((s: any) => ({
    id: s.id,
    name: s.service_name,
    description: s.description || '',
    images: (s.sample_images || []).map((img: string) => resolveImageUrl(img)),
  }));

  const currentTab = menuTabs.includes(activeTab) ? activeTab : 'About';
  const menuItems: any[] = realMenu; // used in the consolidated menu


  // Real Reviews Processing
  const displayReviews = (caterer.reviews || []).map((r: any) => ({
    id: r.id,
    name: r.customerName || r.name || 'Customer',
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently',
    rating: r.rating || 5,
    text: r.comment || r.text || '',
    tags: r.tags ? (typeof r.tags === 'string' ? r.tags.split(',') : r.tags) : [],
    avatar: resolveImageUrl(r.customerAvatar || r.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${r.id}`)
  }));

  // Dynamic Star Breakdown Calculation
  const totalReviewsCount = displayReviews.length;
  const starCounts = [0, 0, 0, 0, 0, 0]; // indices 1-5
  displayReviews.forEach((r: any) => {
    const s = Math.round(r.rating);
    if (s >= 1 && s <= 5) starCounts[s]++;
  });

  const STAR_BARS = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    pct: totalReviewsCount > 0 ? starCounts[stars] / totalReviewsCount : 0
  }));





  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out ${caterer?.name} on CaterConnect!` });
    } catch {}
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    try {
      const res = await api.post(`/favorites/toggle`, { 
        userId: user.id, 
        catererId: id 
      });
      if (res.data?.success) {
        setIsFavorite(res.data.isFavorited);
      }
    } catch (e) {
      console.log('Error toggling favorite', e);
    }
  };

  const cuisinesArray = Array.isArray(caterer.cuisines) ? caterer.cuisines : (typeof caterer.cuisines === 'string' ? caterer.cuisines.split(',') : []);
  const specialtiesArray = Array.isArray(caterer.specialties) ? caterer.specialties : (typeof caterer.specialties === 'string' ? caterer.specialties.split(',') : []);
  const eventsArray = Array.isArray(caterer.event_types) ? caterer.event_types : (typeof caterer.event_types === 'string' ? caterer.event_types.split(',') : []);
  const priceLabel = PRICE_LABELS[caterer.price_range] || caterer.price_range || 'Moderate';
  const isProfileComplete = caterer.isProfileComplete ?? true; // assume true if undefined for legacy
  const hasMenu = caterer.hasMenu ?? (realMenu.length > 0);

  return (
    <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO IMAGE ── */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: resolveImageUrl(caterer?.cover_image) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View style={styles.heroGradient} />

          {/* Nav bar */}
          <View style={styles.heroNav}>
            <Pressable style={styles.navBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <Text style={styles.navBrand}>CaterConnect</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={styles.navBtn} onPress={handleToggleFavorite}>
                <Heart size={20} color={isFavorite ? "#E05555" : "#fff"} fill={isFavorite ? "#E05555" : "transparent"} />
              </Pressable>
              <Pressable style={styles.navBtn} onPress={handleShare}>
                <Share2 size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Hero text */}
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {cuisinesArray.map((cuisine: string) => (
                <View key={cuisine} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{cuisine}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.heroName]}>{caterer?.name}</Text>
            <View style={[styles.heroMeta, { position: 'relative', bottom: 0, left: 0 }]}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={styles.heroMetaText}>
                {Number(caterer?.ratingValue || 0).toFixed(1)} ({caterer?.reviewCount || 0} reviews) • {caterer?.location}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center', gap: 10 }}>
              <Text style={styles.heroMetaText}>{caterer.min_guests}-{caterer.max_guests} guests</Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' }} />
              <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700' }}>{priceLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── MENU TABS ── */}
        <View style={[styles.tabsWrap, { backgroundColor: bg, borderBottomColor: border }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.xl }}
          >
            {menuTabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  currentTab === tab && { borderBottomWidth: 2, borderBottomColor: tint },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: currentTab === tab ? tint : subtle },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── CONTENT RENDERING ── */}
        
        {currentTab === 'About' && (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: text, marginBottom: 8 }}>About Us</Text>
            <Text style={{ fontSize: 14, color: subtle, lineHeight: 22, marginBottom: 20 }}>
              {caterer.longDescription || caterer.description || 'No description provided.'}
            </Text>

            <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 12 }}>Our Specialties</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, backgroundColor: 'transparent' }}>
              {specialtiesArray.map((spec: string) => (
                <View key={spec} style={{ borderColor: subtle, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'transparent' }}>
                  <Text style={{ color: text, fontSize: 12 }}>{spec}</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 12 }}>Events We Cater</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, backgroundColor: 'transparent' }}>
              {eventsArray.map((ev: string) => (
                <View key={ev} style={{ backgroundColor: isDark ? '#2A2825' : '#F0EEEA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: text, fontSize: 12 }}>{ev}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: 'transparent', marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: card, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, color: subtle, marginBottom: 2 }}>Years in Business</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: text }} numberOfLines={1}>{caterer.years_in_business || 5} years</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: card, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, color: subtle, marginBottom: 2 }}>Guest Capacity</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: text }} numberOfLines={1}>{caterer.min_guests} - {caterer.max_guests}</Text>
              </View>
            </View>
          </View>
        )}

        {currentTab === 'Menu' && (
          <View style={[styles.section, { paddingBottom: 100, backgroundColor: 'transparent' }]}>
            {Object.entries(groupedMenu).map(([category, items]: [string, any]) => (
              <View key={category} style={{ marginBottom: 28 }}>
                <Text style={[styles.categoryHeader, { color: text }]}>{category}</Text>
                <View style={{ gap: 16 }}>
                  {items.map((item: any) => {
                    return (
                      <View key={item.id} style={[styles.menuCard, { backgroundColor: card }]}>
                        {item.image ? (
                          <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.menuImage} />
                        ) : (
                          <View style={[styles.menuImage, { backgroundColor: isDark ? '#2A2825' : '#E0DDD8', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 24 }}>🍽️</Text>
                          </View>
                        )}
                        <View style={[styles.menuBody, { backgroundColor: 'transparent' }]}>
                          <View style={[styles.menuTitleRow, { backgroundColor: 'transparent' }]}>
                            <Text style={[styles.menuName, { color: text }]} numberOfLines={1}>{item.name}</Text>
                            <Text style={[styles.menuPrice, { color: tint }]}>ETB {item.price}</Text>
                          </View>
                          <Text style={[styles.menuDesc, { color: subtle }]} numberOfLines={2}>
                            {item.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'Services' && (
          <View style={[styles.section, { paddingBottom: 100, backgroundColor: 'transparent' }]}>
            {displayServices.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: 'transparent' }}>
                <Sparkles size={40} color={subtle} />
                <Text style={{ color: subtle, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                  No additional services listed. This caterer focuses exclusively on catering.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 20, backgroundColor: 'transparent' }}>
                {displayServices.map((service: any) => (
                  <View key={service.id} style={[styles.serviceCardVertical, { backgroundColor: card }]}>
                    <ServiceImageCarousel images={service.images} />
                    <View style={{ paddingHorizontal: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, backgroundColor: 'transparent' }}>
                        <Sparkles size={18} color={tint} />
                        <Text style={{ fontSize: 18, fontWeight: '800', color: text }}>{service.name}</Text>
                      </View>
                      {service.description ? (
                        <Text style={{ fontSize: 14, color: subtle, lineHeight: 22 }}>{service.description}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {currentTab === 'Reviews' && (
          <View style={{ backgroundColor: 'transparent' }}>
            <View style={[styles.ratingCard, { backgroundColor: card, marginBottom: 20 }]}>
              <Text style={[styles.ratingBig, { color: text }]}>
                {Number(caterer?.ratingValue || 0).toFixed(1)}
              </Text>
              <View style={[styles.starsRow, { backgroundColor: 'transparent' }]}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={22} color="#FFD700" fill={s <= Math.round(Number(caterer?.ratingValue || 0)) ? "#FFD700" : "transparent"} />
                ))}
              </View>
              <Text style={[styles.ratingCount, { color: subtle }]}>
                {caterer?.reviewCount || 0} Reviews
              </Text>
              {/* Bar chart */}
              <View style={{ width: '100%', marginTop: 16, gap: 6, backgroundColor: 'transparent' }}>
                {STAR_BARS.map(({ stars, pct }: { stars: number, pct: number }) => (
                  <View key={stars} style={[styles.barRow, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.barLabel, { color: subtle }]}>{stars}</Text>
                    <View style={[styles.barTrack, { backgroundColor: isDark ? '#2A2825' : '#ECEAE8' }]}>
                      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: tint }]} />
                    </View>
                    <Text style={[styles.barPct, { color: subtle }]}>{Math.round(pct * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.section, { paddingHorizontal: 16, marginBottom: 120, backgroundColor: 'transparent' }]}>
              {displayReviews.map((review: any) => (
                <View key={review.id} style={[styles.reviewCard, { backgroundColor: card }]}>
                  <View style={[styles.reviewHeader, { backgroundColor: 'transparent' }]}>
                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                      <Text style={[styles.reviewName, { color: text }]}>{review.name}</Text>
                      <Text style={[styles.reviewDate, { color: subtle }]}>{review.date}</Text>
                    </View>
                    <View style={[styles.reviewStars, { backgroundColor: 'transparent' }]}>
                      {[...Array(Math.max(1, review.rating))].map((_, i) => (
                        <Star key={i} size={12} color="#FFD700" fill="#FFD700" />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewText, { color: text }]}>{review.text}</Text>
                  {(review.tags && review.tags.length > 0) && (
                    <View style={[styles.reviewTags, { backgroundColor: 'transparent' }]}>
                      {review.tags.map((t: string) => (
                        <View key={t} style={[styles.reviewTag, { backgroundColor: isDark ? '#2A2825' : '#F0EEEA' }]}>
                          <Text style={[styles.reviewTagText, { color: subtle }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── BOOK NOW FOOTER ── */}
      <View style={[styles.footer, { backgroundColor: bg, borderTopColor: '#E0DDD8' }]}>
        {(!isProfileComplete || !hasMenu) && (
          <Text style={{ color: '#856404', textAlign: 'center', fontSize: 12, marginBottom: 8 }}>
            ⚠️ This vendor's profile is not yet complete.
          </Text>
        )}
        <Pressable
          id="book-now-btn"
          style={[styles.cartFooterBtn, { backgroundColor: (isProfileComplete && hasMenu) ? tint : '#ccc' }]}
          disabled={!isProfileComplete || !hasMenu}
          onPress={() => {
            router.push({
              pathname: '/checkout',
              params: {
                catererId: caterer.id,
                catererName: caterer.name,
                minGuests: caterer.min_guests,
                maxGuests: caterer.max_guests,
                menuData: JSON.stringify(realMenu),
                eventTypes: (eventsArray.length > 0 ? eventsArray : ['Wedding','Corporate','Private Party','Birthday']).join(','),
              },
            });
          }}
        >
          <CalendarCheck size={18} color="#fff" />
          <Text style={styles.cartFooterText}>Book Now</Text>
        </Pressable>
      </View>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Hero */
  heroWrap: { height: 280, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject as any },
  heroGradient: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(10,10,20,0.58)',
  },
  heroNav: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent', // Ensure it is transparent
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)', // Dark translucent background for icon contrast
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBrand: { color: '#fff', fontSize: 16, fontWeight: '800' },
  heroBadge: {
    position: 'absolute',
    bottom: 72,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  heroBadgeText: { color: '#FFD700', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  heroMeta: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  /* Tabs */
  tabsWrap: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  /* Sections */
  section: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },

  /* Menu cards */
  menuCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuImage: { width: 80, height: 80, borderRadius: 12 },
  menuBody: { flex: 1 },
  menuTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryHeader: { fontSize: 18, fontWeight: '800', marginBottom: 16, marginTop: 4 },
  menuName: { fontSize: 15, fontWeight: '700', flex: 1 },
  menuPrice: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  menuDesc: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  addBtn: {
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  /* Experience cards */
  expCardLarge: {
    flex: 1.4,
    height: 260,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'flex-end',
  },
  expCardSmall: {
    flex: 1,
    height: 260,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'flex-end',
  },
  expOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
  },
  expBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  expName: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 24, marginBottom: 4 },
  expDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
  expPrice: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  sommelierIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  sommelierTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
  },
  sommelierDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
  sommelierPrice: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 0 },
  expBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  expBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },

  /* Ratings */
  ratingCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  ratingBig: { fontSize: 48, fontWeight: '800', lineHeight: 54 },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 6 },
  ratingCount: { fontSize: 13, marginBottom: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontSize: 12, width: 12, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barPct: { fontSize: 11, width: 30, textAlign: 'right' },

  /* Feature tags */
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  featureTag: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureTagText: { fontSize: 13, fontWeight: '600' },

  /* Reviews */
  reviewCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewName: { fontSize: 14, fontWeight: '700' },
  reviewDate: { fontSize: 12, marginTop: 2 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  reviewTags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reviewTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reviewTagText: { fontSize: 11, fontWeight: '600' },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  cartFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 10,
  },
  cartFooterText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* Bottom sheet */
  sheetContent: { flex: 1, padding: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  emptyCart: { textAlign: 'center', marginTop: 20 },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartRowText: { fontSize: 15 },
  cartRowPrice: { fontSize: 15, fontWeight: '700' },
  cartTotal: {
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  cartTotalLabel: { fontSize: 17, fontWeight: '700' },
  cartTotalValue: { fontSize: 17, fontWeight: '800' },
  confirmBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  serviceCardVertical: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
