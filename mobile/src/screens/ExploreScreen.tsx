import { useMemo } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useApprovedCaterers, type Caterer } from "@/hooks/useCaterers";
import { useCustomerLocation } from "@/hooks/useCustomerLocation";
import { distanceMap, sortByDistance } from "@/lib/geo";
import { useHomeBanners } from "@/hooks/useHomeBanners";
import { useCatererRatings } from "@/hooks/useCatererRatings";
import { useFavorites } from "@/hooks/useFavorites";
import { PopularCatererCard } from "@/components/mobile/CatererCards";
import { HomeBannerCarousel } from "@/components/mobile/HomeBannerCarousel";
import {
  EmptyStateBlock,
  SectionHeader,
  SkeletonCard,
} from "@/components/mobile/shared";
import type { TabScreenProps } from "@/navigation/types";
import { avatarUrlFromAuthUser } from "@/services/profiles";

// Fallback caterers matching mockup if database does not contain fully rated caterers
const FALLBACK_CATERERS: Caterer[] = [
  {
    id: "zemen-ethiopian-cuisine",
    vendor_id: "vendor-zemen",
    name: "Zemen Ethiopian Cuisine",
    description: "Traditional Ethiopian catering for your special moments.",
    long_description: null,
    location: "Bole, Addis Ababa",
    rating: 4.8,
    review_count: 324,
    view_count: 0,
    unique_view_count: 0,
    price_range: "$$",
    min_guests: 20,
    max_guests: 500,
    cover_image: require("../../assets/caterer-zemen.png") as unknown as string,
    logo_url: null,
    is_premium: false,
    latitude: 9.007,
    longitude: 38.761,
    images: [require("../../assets/caterer-zemen.png") as unknown as string],
    cuisines: ["Ethiopian", "Traditional"],
    event_types: ["Weddings", "Corporate", "Cultural"],
    specialties: ["Traditional"],
    years_in_business: 10,
    contact_phone: "+251911000000",
    contact_email: "contact@zemen.com",
    website: null,
    admin_notes: null,
    approved_at: "2026-01-01",
    approved_by: "system",
    is_approved: true,
    is_pending: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "la-piazza",
    vendor_id: "vendor-lapiazza",
    name: "La Piazza",
    description: "Fresh pasta, continental delicacies, and premium catering.",
    long_description: null,
    location: "Bole, Addis Ababa",
    rating: 4.6,
    review_count: 187,
    view_count: 0,
    unique_view_count: 0,
    price_range: "$$$",
    min_guests: 15,
    max_guests: 350,
    cover_image:
      require("../../assets/caterer-lapiazza.png") as unknown as string,
    logo_url: null,
    is_premium: true,
    latitude: 9.012,
    longitude: 38.772,
    images: [require("../../assets/caterer-lapiazza.png") as unknown as string],
    cuisines: ["Italian", "Continental"],
    event_types: ["Weddings", "Private Dining", "Parties"],
    specialties: ["Continental"],
    years_in_business: 8,
    contact_phone: "+251922000000",
    contact_email: "contact@lapiazza.com",
    website: null,
    admin_notes: null,
    approved_at: "2026-01-01",
    approved_by: "system",
    is_approved: true,
    is_pending: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

export default function ExploreScreen({
  navigation,
}: TabScreenProps<"Explore">) {
  const { profile, user } = useAuth();
  const {
    data: caterers,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useApprovedCaterers();
  const { refetch: refetchBanners, isRefetching: isRefetchingBanners } =
    useHomeBanners();
  const { isFavorite, toggle } = useFavorites();
  const { t } = useLanguage();

  const firstName = profile?.name?.split(" ")[0] ?? "Miko";
  // Prefer the stored avatar, fall back to the live Google photo from the
  // auth session (covers rows created before the avatar sync existed).
  const avatarUri = profile?.avatar_url || avatarUrlFromAuthUser(user);
  const avatarInitial = (profile?.name?.trim() ?? "U").charAt(0).toUpperCase();

  // Show real approved caterers from the DB (rating 0 = new, still real).
  // Fallback mockup caterers only when the DB has zero approved rows.
  const displayCaterers = useMemo(() => {
    const realApproved = (caterers ?? []).filter(
      (c) => c.is_approved && !!c.name?.trim(),
    );
    if (realApproved.length > 0) {
      return realApproved;
    }
    return FALLBACK_CATERERS;
  }, [caterers]);

  // Live aggregates from `reviews` so a new review shows immediately even if
  // the denormalized caterers.rating columns are stale (missing DB trigger).
  const catererIds = useMemo(() => displayCaterers.map((c) => c.id), [displayCaterers]);
  const { data: liveRatings } = useCatererRatings(catererIds);

  // Customer GPS position for "Near you" sorting (cached 30 min).
  const { coords: customerCoords, status: locationStatus, request: requestLocation } =
    useCustomerLocation();

  // Premium vendors first, alphabetical by name (paid tier, admin-toggled).
  const premiumVendors = useMemo(
    () =>
      displayCaterers
        .filter((c) => c.is_premium === true)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [displayCaterers],
  );

  // Everyone else, nearest first (vendors without coordinates sort last).
  const nearbyVendors = useMemo(() => {
    const regular = displayCaterers.filter((c) => c.is_premium !== true);
    return sortByDistance(regular, customerCoords);
  }, [displayCaterers, customerCoords]);

  const distances = useMemo(
    () => distanceMap(displayCaterers, customerCoords),
    [displayCaterers, customerCoords],
  );

  const openCaterer = (item: Caterer) =>
    navigation.navigate("CatererDetail", { id: item.id });

  const renderVendorGrid = (list: Caterer[]) => (
    <View style={styles.grid}>
      {list.map((item) => {
        const live = liveRatings?.[item.id];
        const effectiveRating = live !== undefined ? Number(live.rating ?? 0) : Number(item.rating ?? 0);
        const effectiveCount = live !== undefined ? Number(live.count ?? 0) : Number(item.review_count ?? 0);
        const isTopRated = effectiveRating >= 4.5 && effectiveCount > 0;
        return (
          <View key={item.id} style={styles.gridItem}>
            <PopularCatererCard
              caterer={item}
              topRated={isTopRated}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggle(item.id)}
              onPress={() => openCaterer(item)}
              liveRating={live}
              distanceKm={distances[item.id] ?? null}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isRefetchingBanners}
              onRefresh={() => {
                refetch();
                refetchBanners();
              }}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{t('explore.greeting', { name: firstName })}</Text>
              <Text style={styles.hero}>
                {t('explore.heroA')}{"\n"}
                <Text style={styles.heroGreen}>{t('explore.heroB')}</Text>
              </Text>
              <Text style={styles.sub}>{t('explore.sub')}</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              accessibilityLabel={t('explore.openAccount')}
            >
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{avatarInitial}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>

          {/* Home banner slot — fixed size; admin-posted images or carousel */}
          <View style={styles.pad}>
            <HomeBannerCarousel
              onPressBanner={(b) =>
                b.link_caterer_id
                  ? navigation.navigate("CatererDetail", { id: b.link_caterer_id })
                  : navigation.navigate("Search")
              }
              onPressFallback={() => navigation.navigate("Search")}
            />
          </View>

          {/* Premium vendors — paid tier, alphabetical */}
          {premiumVendors.length > 0 ? (
            <>
              <View style={styles.sectionHeaderPad}>
                <SectionHeader title={t('explore.premium')} />
              </View>
              <View style={[styles.pad, styles.sectionGap]}>
                {renderVendorGrid(premiumVendors.slice(0, 6))}
              </View>
            </>
          ) : null}

          {/* Near you — nearest first by GPS distance */}
          <View style={styles.sectionHeaderPad}>
            <SectionHeader
              title={t('explore.nearYou')}
              actionLabel={t('common.seeAll')}
              onAction={() => navigation.navigate("Search")}
            />
          </View>
          {locationStatus === "denied" || locationStatus === "unavailable" ? (
            <View style={styles.pad}>
              <View style={styles.locHint}>
                <Text style={styles.locHintText}>
                  {t('explore.enableLocation')}
                </Text>
                <Pressable onPress={requestLocation} accessibilityRole="button">
                  <Text style={styles.locHintAction}>{t('explore.enable')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.pad}>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <SkeletonCard />
                </View>
                <View style={styles.gridItem}>
                  <SkeletonCard />
                </View>
              </View>
            </View>
          ) : error && displayCaterers.length === 0 ? (
            <View style={styles.pad}>
              <EmptyStateBlock
                title={t('explore.loadFail')}
                subtitle={t('explore.loadFailSub')}
                actionLabel={t('common.retry')}
                onAction={() => refetch()}
              />
            </View>
          ) : nearbyVendors.length === 0 ? (
            <View style={styles.pad}>
              <EmptyStateBlock
                title={t('explore.emptyTitle')}
                subtitle={t('explore.emptySub')}
              />
            </View>
          ) : (
            <View style={styles.pad}>
              {renderVendorGrid(nearbyVendors.slice(0, 6))}
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9F6" },
  flex: { flex: 1 },
  content: { paddingBottom: 116 },
  pad: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridItem: { width: '48%' },
  sectionGap: { marginTop: 10 },
  sectionHeaderPad: { paddingHorizontal: 20, marginTop: 18 },
  locHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  locHintText: { fontSize: 12.5, color: '#92400E', fontWeight: '600', flex: 1 },
  locHintAction: { fontSize: 13, color: '#15803D', fontWeight: '800', marginLeft: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerText: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 14, color: "#4B5563", fontWeight: "600" },
  hero: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 34,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroGreen: { color: "#15803D" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 4, lineHeight: 20 },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#DCFCE7",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: "#15803D" },
});
