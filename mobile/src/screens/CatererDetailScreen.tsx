import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatererById } from '@/hooks/useCaterers';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTrackCatererView } from '@/hooks/useTrackCatererView';
import { useCatererRatings } from '@/hooks/useCatererRatings';
import { useMenuItemsByCaterer } from '@/hooks/useMenuItems';
import { usePackagesByCaterer } from '@/hooks/usePackages';
import { useReviewsByCaterer } from '@/hooks/useReviews';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, shadow } from '@/theme/colors';
import { BottomNav } from '@/components/mobile/BottomNav';
import { DishCard, DishDetailSheet, PackageCard } from '@/components/mobile/MenuBookingCards';
import { FilterChip } from '@/components/mobile/Chips';
import { ReviewModal } from '@/components/mobile/ReviewModal';
import { EmptyStateBlock, FoodImage } from '@/components/mobile/shared';
import { CatererDetailSkeleton } from '@/components/mobile/CatererDetailSkeleton';
import { AppIcon } from '@/components/mobile/AppIcons';
import { InstagramColorIcon, TelegramColorIcon, TikTokColorIcon } from '@/components/mobile/SocialIcons';
import { getSocialLinks } from '@/lib/social';
import { getEffectiveRating, summarizeRatings } from '@/lib/ratings';
import { formatBirr } from '@/lib/format';
import type { RootScreenProps } from '@/navigation/types';
import type { MenuItem } from '@/types/domain';

type Tab = 'Menu' | 'Gallery' | 'Reviews' | 'Contact';
const TABS: { key: Tab; tx: 'detail.tabMenu' | 'detail.tabGallery' | 'detail.tabReviews' | 'detail.tabContact' }[] = [
  { key: 'Menu', tx: 'detail.tabMenu' },
  { key: 'Gallery', tx: 'detail.tabGallery' },
  { key: 'Reviews', tx: 'detail.tabReviews' },
  { key: 'Contact', tx: 'detail.tabContact' },
];

export default function CatererDetailScreen({ route, navigation }: RootScreenProps<'CatererDetail'>) {
  const { id } = route.params;
  const { data: caterer, isLoading, error } = useCatererById(id);
  useTrackCatererView(id);
  const { data: menuItems } = useMenuItemsByCaterer(id);
  const { data: packages } = usePackagesByCaterer(id);
  const { data: reviews } = useReviewsByCaterer(id);
  const { data: liveRatings } = useCatererRatings(id ? [id] : []);
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('Menu');
  const [expanded, setExpanded] = useState(false);
  const [aboutTruncated, setAboutTruncated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerPage, setViewerPage] = useState(0);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [dishCategory, setDishCategory] = useState('All');
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const lastTap = useRef(0);
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const myReview = useMemo(
    () => (reviews ?? []).find((r) => r.customer_id === user?.id) ?? null,
    [reviews, user?.id],
  );

  // Effective rating: live aggregate from `reviews` wins over the stored
  // caterers.rating columns (which stay 0 if the DB trigger was never
  // installed). Falls back to the preview list while the aggregate loads.
  const effectiveRating = useMemo(() => {
    const live = id ? liveRatings?.[id] : undefined;
    if (live !== undefined) {
      if (Number(live.count) > 0) return { hasReviews: true, rating: Number(live.rating), count: Number(live.count) };
      // Live resolved — but the preview list may already contain the
      // just-submitted review before the aggregate refetch lands.
      const fromPreview = summarizeRatings((reviews ?? []).map((r) => r.rating));
      if (fromPreview.count > 0) return fromPreview;
      return { hasReviews: false, rating: 0, count: 0 };
    }
    if ((reviews ?? []).length > 0) return summarizeRatings((reviews ?? []).map((r) => r.rating));
    return getEffectiveRating(caterer);
  }, [liveRatings, id, reviews, caterer]);

  const viewerImgH = Math.max(200, winHeight - 220);

  const openViewer = (i: number) => {
    setViewerIndex(i);
    setViewerPage(i);
    setViewerZoom(1);
  };
  const closeViewer = () => setViewerIndex(null);
  const handleViewerTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setViewerZoom((z) => (z > 1 ? 1 : 2.2));
    }
    lastTap.current = now;
  };

  const dishes = useMemo(() => {
    const list = [...(menuItems ?? [])];
    list.sort((a, b) => Number(b.is_popular) - Number(a.is_popular));
    return list;
  }, [menuItems]);

  const dishCategories = useMemo(() => {
    const set = new Set<string>();
    dishes.forEach((d) => {
      if (d.category?.trim()) set.add(d.category.trim());
    });
    return ['All', ...[...set].sort()];
  }, [dishes]);

  const filteredDishes = useMemo(
    () => (dishCategory === 'All' ? dishes : dishes.filter((d) => d.category?.trim() === dishCategory)),
    [dishes, dishCategory],
  );

  const gallery = useMemo(() => {
    if (!caterer) return [];
    return [caterer.cover_image, ...(caterer.images ?? [])].filter(Boolean) as string[];
  }, [caterer]);

  const socialLinks = useMemo(() => getSocialLinks(caterer ?? null), [caterer]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.flex}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            <CatererDetailSkeleton />
          </ScrollView>
          <BottomNav active="Home" onNavigate={(r) => navigation.navigate('MainTabs', { screen: r })} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !caterer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.flex}>
          <EmptyStateBlock
            title={t('detail.notFound')}
            subtitle={t('detail.notFoundSub')}
            actionLabel={t('common.goBack')}
            onAction={() => navigation.goBack()}
          />
          <BottomNav active="Home" onNavigate={(r) => navigation.navigate('MainTabs', { screen: r })} />
        </View>
      </SafeAreaView>
    );
  }

  const fav = isFavorite(caterer.id);
  const logoUri = (caterer.logo_url ?? '').trim();
  const logoInitials = (() => {
    const parts = (caterer.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'V';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  })();
  const about = [caterer.description, caterer.long_description].filter(Boolean).join('\n\n');
  const badges = [
    caterer.cuisines?.[0] ? t('detail.traditional', { cuisine: caterer.cuisines[0] }) : t('detail.traditionalRecipes'),
    t('detail.fresh'),
    t('detail.ontime'),
  ];

  const handleShare = () => {
    void Share.share({ message: `${caterer.name} — ${caterer.location ?? ''}` }).catch(() => undefined);
  };

  const phone = caterer.contact_phone?.trim() || null;
  const email = caterer.contact_email?.trim() || null;
  const rawWebsite = caterer.website?.trim() || null;
  const websiteUrl = rawWebsite
    ? /^https?:\/\//i.test(rawWebsite)
      ? rawWebsite
      : `https://${rawWebsite}`
    : null;
  const address = caterer.location?.trim() || 'Addis Ababa';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${caterer.name} ${address}`)}`;
  const capacityLabel = t('detail.servesRange', { min: caterer.min_guests ?? 1, max: caterer.max_guests ?? 100 });
  const experienceLabel = caterer.years_in_business > 0 ? t('detail.yrs', { n: caterer.years_in_business }) : t('detail.isNew');
  const startingPrice = formatBirr(dishes[0]?.price ?? null);

  const openUrl = async (url: string, fallback: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(t('detail.cannotOpen'), fallback);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('detail.cannotOpen'), fallback);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Hero — below the status bar, same safe-area bg as home */}
          <View style={styles.heroWrap}>
            {caterer.cover_image ? (
              <Image source={{ uri: caterer.cover_image }} style={styles.hero} resizeMode="cover" />
            ) : (
              <Image source={require('../../assets/home-bg.png')} style={styles.hero} resizeMode="cover" />
            )}
            <View style={styles.heroTop}>
              <Pressable onPress={() => navigation.goBack()} accessibilityLabel={t('common.goBack')} style={styles.circleBtn}>
                <AppIcon name="back" size={22} color={colors.primaryDark} />
              </Pressable>
              <View style={styles.heroTopRight}>
                <Pressable
                  onPress={() => toggle(caterer.id)}
                  accessibilityLabel={t('detail.toggleFav')}
                  style={styles.circleBtn}
                >
                  <AppIcon
                    name="heart"
                    size={20}
                    color={fav ? colors.primary : colors.primaryDark}
                    filled={fav}
                  />
                </Pressable>
                <Pressable onPress={handleShare} accessibilityLabel={t('detail.share')} style={styles.circleBtn}>
                  <AppIcon name="share" size={18} color={colors.primaryDark} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Identity */}
          <View style={styles.pad}>
            <View style={styles.identityRow}>
              <View style={styles.logoWrap}>
                {logoUri && !logoFailed ? (
                  <Image
                    source={{ uri: logoUri }}
                    style={styles.logoImg}
                    resizeMode="cover"
                    onError={() => setLogoFailed(true)}
                    accessibilityLabel={`${caterer.name} logo`}
                  />
                ) : (
                  <View style={styles.logo}>
                    <Text style={styles.logoText}>{logoInitials}</Text>
                  </View>
                )}
                <View style={styles.logoCheck}>
                  <AppIcon name="badgeCheck" size={15} color={colors.white} />
                </View>
              </View>
              <View style={styles.identityText}>
                <Text style={styles.name}>{caterer.name}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaRating}>
                <AppIcon name="star" size={15} color={colors.starGold} filled />
                {effectiveRating.hasReviews ? (
                  <>
                    <Text style={styles.ratingVal}> {Number(effectiveRating.rating).toFixed(1)}</Text>
                    <Text style={styles.metaMuted}> {t('detail.reviewsCount', { n: effectiveRating.count })}</Text>
                  </>
                ) : (
                  <Text style={styles.newText}> {t('detail.newNoReviews')}</Text>
                )}
              </View>
              <Text style={styles.metaDiv}>|</Text>
              <View style={styles.metaLoc}>
                <AppIcon name="pin" size={14} color={colors.textMuted} />
                <Text style={styles.metaMuted}> {caterer.location ?? 'Addis Ababa'}</Text>
              </View>
              <Text style={styles.metaDiv}>|</Text>
              <View style={styles.metaExp}>
                <AppIcon name="clock" size={14} color={colors.textMuted} />
                <Text style={styles.metaMuted}> {experienceLabel}</Text>
              </View>
            </View>

            {/* Badges */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
              {badges.map((b) => (
                <View key={b} style={styles.badge}>
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </ScrollView>

            {/* About — page-bg with dashed border */}
            <View style={styles.about}>
              <View style={styles.aboutHeader}>
                <View style={styles.aboutIconWrap}>
                  <AppIcon name="question" size={20} color={colors.textFaint} strokeWidth={1.5} />
                </View>
                <Text style={styles.aboutTitle}>{t('detail.about')}</Text>
              </View>
              <Text
                style={styles.aboutBody}
                numberOfLines={expanded ? undefined : 4}
                onTextLayout={(e) => {
                  if (!expanded) setAboutTruncated(e.nativeEvent.lines.length > 4);
                }}
              >
                {about || t('detail.aboutFallback')}
              </Text>
              {expanded || aboutTruncated || about.length > 140 ? (
                <Text onPress={() => setExpanded((v) => !v)} style={styles.readMore}>
                  {expanded ? t('detail.showLess') : t('detail.readMore')}
                </Text>
              ) : null}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {TABS.map((item) => (
                <Pressable key={item.key} onPress={() => setTab(item.key)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }}>
                  <Text style={[styles.tabText, tab === item.key && styles.tabActive]}>{t(item.tx)}</Text>
                  {tab === item.key ? <View style={styles.tabUnderline} /> : <View style={styles.tabUnderlineHidden} />}
                </Pressable>
              ))}
            </View>

            {tab === 'Menu' ? (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{t('detail.popularDishes')}</Text>
                </View>
                {dishCategories.length > 1 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                    {dishCategories.map((c) => (
                      <FilterChip
                        key={c}
                        label={c === 'All' ? t('cuisines.All') : c}
                        icon={c === 'All' ? 'utensils' : 'bowl'}
                        active={dishCategory === c}
                        onPress={() => setDishCategory(c)}
                        chevron={false}
                      />
                    ))}
                  </ScrollView>
                ) : null}
                {filteredDishes.length === 0 ? (
                  <Text style={styles.muted}>
                    {dishes.length === 0 ? t('detail.noMenu') : t('detail.noDishesIn', { category: dishCategory })}
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                    {filteredDishes.map((d) => (
                      <DishCard key={d.id} item={d} onPress={() => setSelectedDish(d)} />
                    ))}
                  </ScrollView>
                )}

                <View style={styles.pkgHead}>
                  <AppIcon name="cloche" size={26} color={colors.primaryDark} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.sectionTitle}>{t('detail.customPackages')}</Text>
                    <Text style={styles.pkgSub}>{t('detail.pkgSub')}</Text>
                  </View>
                </View>
                {(packages ?? []).length === 0 ? (
                  <Text style={styles.muted}>{t('detail.noPackages')}</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                    {(packages ?? []).slice(0, 6).map((p) => (
                      <View key={p.id} style={{ width: 280, marginRight: 12 }}>
                        <PackageCard
                          pkg={p}
                          onPress={() => navigation.navigate('CatererPackages', { catererId: id })}
                        />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : tab === 'Gallery' ? (
              <View style={styles.galleryGrid}>
                {gallery.length === 0 ? (
                  <Text style={styles.muted}>{t('detail.noPhotos')}</Text>
                ) : (
                  gallery.map((uri, i) => (
                    <Pressable
                      key={`${uri}-${i}`}
                      onPress={() => openViewer(i)}
                      accessibilityRole="button"
                      accessibilityLabel={t('detail.openPhoto', { i: i + 1, n: gallery.length })}
                      style={({ pressed }) => [styles.galleryThumb, pressed && { opacity: 0.85 }]}
                    >
                      <FoodImage uri={uri} style={styles.galleryImg} borderRadius={12} />
                    </Pressable>
                  ))
                )}
              </View>
            ) : tab === 'Reviews' ? (
              <View>
                <View style={styles.reviewHead}>
                  <View>
                    <Text style={styles.reviewHeadTitle}>{(reviews ?? []).length > 0 ? t('detail.reviewsTitleCount', { n: (reviews ?? []).length }) : t('detail.reviewsTitle')}</Text>
                    <Text style={styles.reviewHeadSub}>
                      {myReview ? t('detail.reviewedSub') : t('detail.reviewCta')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setReviewOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={myReview ? t('detail.editYourReview') : t('detail.writeReview')}
                    style={({ pressed }) => [styles.reviewBtn, pressed && { opacity: 0.85 }]}
                  >
                    <AppIcon name="star" size={15} color={colors.white} filled />
                    <Text style={styles.reviewBtnText}>{myReview ? t('detail.editReview') : t('detail.writeReview')}</Text>
                  </Pressable>
                </View>
                {(reviews ?? []).length === 0 ? (
                  <View style={styles.reviewEmpty}>
                    <Text style={styles.muted}>{t('detail.noReviews')}</Text>
                  </View>
                ) : (
                  (reviews ?? []).slice(0, 10).map((r) => {
                    const mine = r.customer_id === user?.id;
                    return (
                      <View key={r.id} style={[styles.review, mine && styles.reviewMine]}>
                        <View style={styles.reviewTop}>
                          <View style={styles.reviewNameRow}>
                            <Text style={styles.reviewName}>{r.customer?.name ?? t('detail.customerFallback')}</Text>
                            {mine ? (
                              <View style={styles.youPill}>
                                <Text style={styles.youText}>{t('detail.you')}</Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={styles.reviewStars}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <AppIcon
                                key={s}
                                name="star"
                                size={13}
                                color={s <= r.rating ? colors.starGold : colors.border}
                                filled
                              />
                            ))}
                          </View>
                        </View>
                        {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                        {!!r.response && (
                          <View style={styles.vendorReply}>
                            <Text style={styles.vendorReplyLabel}>{t('detail.vendorResponse')}</Text>
                            <Text style={styles.vendorReplyText}>{r.response}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            ) : (
              <View style={styles.contactWrap}>
                <Text style={styles.contactHeading}>{t('detail.contactHeading')}</Text>
                <Text style={styles.contactSub}>
                  {t('detail.contactSub', { name: caterer.name })}
                </Text>

                {/* Quick actions */}
                <View style={styles.quickRow}>
                  <Pressable
                    onPress={() => phone && void openUrl(`tel:${phone.replace(/\s/g, '')}`, phone)}
                    disabled={!phone}
                    accessibilityRole="button"
                    accessibilityLabel={phone ? t('detail.callNumber', { name: caterer.name }) : t('detail.phoneNotAvailable')}
                    style={({ pressed }) => [
                      styles.quickPrimary,
                      !phone && styles.quickDisabled,
                      pressed && phone && { opacity: 0.85 },
                    ]}
                  >
                    <AppIcon name="phone" size={18} color={colors.white} />
                    <Text style={styles.quickPrimaryText}>{t('detail.callNow')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void openUrl(mapsUrl, address)}
                    accessibilityRole="button"
                    accessibilityLabel={t('detail.getDirections')}
                    style={({ pressed }) => [styles.quickSecondary, pressed && { opacity: 0.85 }]}
                  >
                    <AppIcon name="navigation" size={18} color={colors.primaryDark} />
                    <Text style={styles.quickSecondaryText}>{t('detail.directions')}</Text>
                  </Pressable>
                </View>

                {/* Contact information */}
                <View style={styles.contactCard}>
                  <Pressable
                    onPress={() => phone && void openUrl(`tel:${phone.replace(/\s/g, '')}`, phone)}
                    disabled={!phone}
                    accessibilityRole="button"
                    accessibilityLabel={t('detail.callCaterer')}
                    style={styles.contactRow}
                  >
                    <View style={styles.contactIconWrap}>
                      <AppIcon name="phone" size={18} color={colors.primaryDark} />
                    </View>
                    <View style={styles.contactRowText}>
                      <Text style={styles.contactLabel}>{t('detail.labelPhone')}</Text>
                      <Text style={[styles.contactValue, !phone && styles.contactEmpty]}>
                        {phone ?? t('detail.notProvided')}
                      </Text>
                    </View>
                    {phone ? <AppIcon name="forward" size={18} color={colors.textFaint} /> : null}
                  </Pressable>

                  <View style={styles.contactDivider} />

                  <Pressable
                    onPress={() => email && void openUrl(`mailto:${email}`, email)}
                    disabled={!email}
                    accessibilityRole="button"
                    accessibilityLabel={t('detail.emailCaterer')}
                    style={styles.contactRow}
                  >
                    <View style={styles.contactIconWrap}>
                      <AppIcon name="mail" size={18} color={colors.primaryDark} />
                    </View>
                    <View style={styles.contactRowText}>
                      <Text style={styles.contactLabel}>{t('detail.labelEmail')}</Text>
                      <Text style={[styles.contactValue, !email && styles.contactEmpty]} numberOfLines={1}>
                        {email ?? t('detail.notProvided')}
                      </Text>
                    </View>
                    {email ? <AppIcon name="forward" size={18} color={colors.textFaint} /> : null}
                  </Pressable>

                  <View style={styles.contactDivider} />

                  <Pressable
                    onPress={() => websiteUrl && void openUrl(websiteUrl, rawWebsite ?? '')}
                    disabled={!websiteUrl}
                    accessibilityRole="button"
                    accessibilityLabel={t('detail.openWebsite')}
                    style={styles.contactRow}
                  >
                    <View style={styles.contactIconWrap}>
                      <AppIcon name="globe" size={18} color={colors.primaryDark} />
                    </View>
                    <View style={styles.contactRowText}>
                      <Text style={styles.contactLabel}>{t('detail.labelWebsite')}</Text>
                      <Text style={[styles.contactValue, !websiteUrl && styles.contactEmpty]} numberOfLines={1}>
                        {rawWebsite ?? t('detail.notProvided')}
                      </Text>
                    </View>
                    {websiteUrl ? <AppIcon name="external" size={16} color={colors.textFaint} /> : null}
                  </Pressable>

                  <View style={styles.contactDivider} />

                  <Pressable
                    onPress={() => void openUrl(mapsUrl, address)}
                    accessibilityRole="button"
                    accessibilityLabel={t('detail.openMaps')}
                    style={styles.contactRow}
                  >
                    <View style={styles.contactIconWrap}>
                      <AppIcon name="pin" size={18} color={colors.primaryDark} />
                    </View>
                    <View style={styles.contactRowText}>
                      <Text style={styles.contactLabel}>{t('detail.labelAddress')}</Text>
                      <Text style={styles.contactValue}>{address}</Text>
                      <Text style={styles.contactHint}>{t('detail.tapMaps')}</Text>
                    </View>
                    <AppIcon name="forward" size={18} color={colors.textFaint} />
                  </Pressable>
                </View>

                {socialLinks.length > 0 ? (
                  <View style={styles.socialCard}>
                    <Text style={styles.socialTitle}>{t('detail.follow')}</Text>
                    <Text style={styles.socialSub}>
                      {t('detail.followSub', { name: caterer.name })}
                    </Text>
                    <View style={styles.socialRow}>
                      {socialLinks.map((link) => (
                        <Pressable
                          key={link.platform}
                          onPress={() => void openUrl(link.href, link.label)}
                          accessibilityRole="button"
                          accessibilityLabel={t('detail.openSocial', { label: link.label })}
                          style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }]}
                        >
                          <View style={styles.socialIconWrap}>
                            {link.platform === 'instagram' ? (
                              <InstagramColorIcon size={28} />
                            ) : link.platform === 'tiktok' ? (
                              <TikTokColorIcon size={28} />
                            ) : (
                              <TelegramColorIcon size={28} />
                            )}
                          </View>
                          <Text style={styles.socialLabel}>{link.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Location highlight */}
                <View style={styles.mapCard}>
                  <View style={styles.mapVisual}>
                    <View style={styles.mapPinWrap}>
                      <AppIcon name="pin" size={26} color={colors.primaryDark} />
                    </View>
                    <Text style={styles.mapTitle} numberOfLines={2}>
                      {address}
                    </Text>
                    <Text style={styles.mapSub}>{capacityLabel}</Text>
                  </View>
                  <View style={styles.mapBody}>
                    <Text style={styles.mapMeta}>
                      {capacityLabel}
                      {(caterer.price_range ?? '') ? `  •  ${caterer.price_range}` : ''}  •  {t('detail.starting', { price: startingPrice })}
                    </Text>
                    {(caterer.event_types ?? []).length > 0 ? (
                      <View style={styles.eventChips}>
                        {caterer.event_types.slice(0, 6).map((e) => (
                          <View key={e} style={styles.eventChip}>
                            <Text style={styles.eventChipText}>{e}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => void openUrl(mapsUrl, address)}
                      accessibilityRole="button"
                      accessibilityLabel={t('detail.getDirectionsMaps')}
                      style={({ pressed }) => [styles.directionsBtn, pressed && { opacity: 0.85 }]}
                    >
                      <AppIcon name="navigation" size={16} color={colors.primaryDark} />
                      <Text style={styles.directionsText}>{t('detail.getDirections')}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Business facts */}
                <View style={styles.factsGrid}>
                  <View style={styles.factTile}>
                    <AppIcon name="users" size={20} color={colors.primaryDark} />
                    <Text style={styles.factValue}>{t('detail.capacityRange', { min: caterer.min_guests ?? 1, max: caterer.max_guests ?? 100 })}</Text>
                    <Text style={styles.factLabel}>{t('detail.guestCapacity')}</Text>
                  </View>
                  <View style={styles.factTile}>
                    <AppIcon name="clock" size={20} color={colors.primaryDark} />
                    <Text style={styles.factValue}>{experienceLabel}</Text>
                    <Text style={styles.factLabel}>{t('detail.experience')}</Text>
                  </View>
                  <View style={styles.factTile}>
                    <AppIcon name="tag" size={20} color={colors.primaryDark} />
                    <Text style={styles.factValue}>{caterer.price_range ?? '—'}</Text>
                    <Text style={styles.factLabel}>{t('detail.priceRange')}</Text>
                  </View>
                  <View style={styles.factTile}>
                    <AppIcon name="star" size={20} color={colors.starGold} filled />
                    <Text style={styles.factValue}>
                      {effectiveRating.hasReviews ? Number(effectiveRating.rating).toFixed(1) : t('detail.isNew')}
                    </Text>
                    <Text style={styles.factLabel}>
                      {effectiveRating.hasReviews ? t('detail.reviewsCount', { n: effectiveRating.count }) : t('detail.noReviewsYet')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Book Now — only for Menu and Contact tabs */}
          {(tab === 'Menu' || tab === 'Contact') ? (
            <View style={styles.ctaWrap}>
              <Pressable
                onPress={() => navigation.navigate('BookingRequest', { catererId: caterer.id })}
                accessibilityRole="button"
                accessibilityLabel={t('detail.bookNowLabel')}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
              >
                <AppIcon name="calendar" size={20} color={colors.white} />
                <Text style={styles.ctaText}>{t('detail.bookNow')}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <BottomNav active="Home" onNavigate={(r) => navigation.navigate('MainTabs', { screen: r })} />
        <ReviewModal
          visible={reviewOpen}
          onClose={() => setReviewOpen(false)}
          catererId={caterer.id}
          catererName={caterer.name}
          customerId={user?.id}
          existing={myReview}
        />
        <DishDetailSheet
          item={selectedDish}
          visible={selectedDish !== null}
          onClose={() => setSelectedDish(null)}
        />
        <Modal visible={viewerIndex !== null} transparent animationType="fade" onRequestClose={closeViewer}>
          {viewerIndex !== null ? (
            <SafeAreaView style={styles.viewerOverlay} edges={['top', 'bottom']}>
              <View style={styles.viewerHead}>
                <Text style={styles.viewerCount}>
                  {viewerPage + 1} / {gallery.length}
                </Text>
                <Pressable
                  onPress={closeViewer}
                  accessibilityRole="button"
                  accessibilityLabel={t('detail.closeViewer')}
                  hitSlop={10}
                  style={({ pressed }) => [styles.viewerClose, pressed && { opacity: 0.7 }]}
                >
                  <AppIcon name="close" size={20} color={colors.white} />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: viewerIndex * winWidth, y: 0 }}
                onMomentumScrollEnd={(e) => {
                  setViewerPage(Math.round(e.nativeEvent.contentOffset.x / winWidth));
                  setViewerZoom(1);
                }}
                style={styles.viewerPager}
              >
                {gallery.map((uri, i) => (
                  <ScrollView
                    key={`${uri}-${i}`}
                    style={{ width: winWidth, flex: 1 }}
                    contentContainerStyle={[
                      styles.viewerZoomContent,
                      viewerZoom > 1 && { minWidth: winWidth * viewerZoom },
                    ]}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                  >
                    <Pressable
                      onPress={handleViewerTap}
                      accessibilityRole="button"
                      accessibilityLabel={t('detail.photoZoom', { i: i + 1, n: gallery.length })}
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: winWidth * viewerZoom, height: viewerImgH * viewerZoom }}
                        resizeMode="contain"
                      />
                    </Pressable>
                  </ScrollView>
                ))}
              </ScrollView>
              <Text style={styles.viewerHint}>{t('detail.viewerHint')}</Text>
            </SafeAreaView>
          ) : null}
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 20 },
  heroWrap: { height: 162, backgroundColor: colors.softGreen, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  hero: { width: '100%', height: '100%' },
  heroTop: { position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroTopRight: { flexDirection: 'row' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 10, ...shadow.card },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginTop: -34 },
  logoWrap: { marginTop: -20 },
  logo: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
  logoImg: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.surface },
  logoText: { color: colors.white, fontWeight: '800', fontSize: 30 },
  logoCheck: { position: 'absolute', right: 2, bottom: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  identityText: { flex: 1, marginLeft: 12, paddingTop: 34 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  tagline: { fontSize: 15, color: colors.textMuted, marginTop: 8, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 10 },
  metaRating: { flexDirection: 'row', alignItems: 'center' },
  metaLoc: { flexDirection: 'row', alignItems: 'center' },
  metaExp: { flexDirection: 'row', alignItems: 'center' },
  metaVerified: { flexDirection: 'row', alignItems: 'center' },
  ratingVal: { fontWeight: '800', color: colors.text, fontSize: 15 },
  newText: { fontWeight: '800', color: colors.primaryDark, fontSize: 14 },
  metaMuted: { fontSize: 13, color: colors.textMuted },
  metaDiv: { color: colors.border, marginHorizontal: 8 },
  verified: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  badgeRow: { paddingVertical: 12 },
  badge: { backgroundColor: colors.softGreen, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, borderWidth: 1, borderColor: '#D9EDDE' },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.text },
  about: { backgroundColor: 'transparent', borderRadius: radius.lg, padding: 16, marginTop: 4, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' },
  aboutHeader: { flexDirection: 'row', alignItems: 'center' },
  aboutIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  aboutTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginLeft: 10, letterSpacing: -0.2 },
  aboutBody: { fontSize: 15, color: colors.text, marginTop: 10, lineHeight: 23 },
  readMore: { color: colors.primaryDark, fontWeight: '700', marginTop: 10, fontSize: 14 },
  tabs: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 0 },
  tabText: { fontSize: 15, color: colors.textFaint, fontWeight: '500', paddingBottom: 10 },
  tabActive: { color: colors.primaryDark, fontWeight: '800' },
  tabUnderline: { height: 3, backgroundColor: colors.primaryDark, borderRadius: 2 },
  tabUnderlineHidden: { height: 3 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  seeAll: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  pkgHead: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, marginBottom: 10 },
  pkgSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  galleryThumb: { width: '48%', marginBottom: 12 },
  galleryImg: { width: '100%', height: 160 },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  viewerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  viewerCount: { color: colors.white, fontSize: 15, fontWeight: '700' },
  viewerClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  viewerPager: { flex: 1, marginTop: 4 },
  viewerZoomContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  viewerHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, textAlign: 'center', paddingVertical: 12 },
  review: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, marginTop: 10, ...shadow.card },
  reviewMine: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: colors.surfaceAlt },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  reviewName: { fontSize: 14, fontWeight: '700', color: colors.text },
  youPill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  youText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
  reviewStars: { flexDirection: 'row', alignItems: 'center' },
  reviewComment: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 19 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 },
  reviewHeadTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  reviewHeadSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  reviewBtnText: { color: colors.white, fontWeight: '800', fontSize: 13.5, marginLeft: 6 },
  reviewEmpty: { marginTop: 6 },
  vendorReply: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 10, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  vendorReplyLabel: { fontSize: 11, fontWeight: '800', color: colors.primaryDark, letterSpacing: 0.5, textTransform: 'uppercase' },
  vendorReplyText: { fontSize: 13.5, color: colors.text, marginTop: 4, lineHeight: 18 },
  contactWrap: { marginTop: 16 },
  contactHeading: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  contactSub: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  quickRow: { flexDirection: 'row', marginTop: 14 },
  quickPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 14 },
  quickPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 15, marginLeft: 8 },
  quickSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 14, marginLeft: 10, borderWidth: 1.5, borderColor: colors.primaryDark },
  quickSecondaryText: { color: colors.primaryDark, fontWeight: '800', fontSize: 15, marginLeft: 8 },
  quickDisabled: { opacity: 0.45 },
  contactCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: 14, paddingHorizontal: 6, ...shadow.card },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 13 },
  contactIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  contactRowText: { flex: 1, marginLeft: 12, marginRight: 8 },
  contactLabel: { fontSize: 11, fontWeight: '700', color: colors.textFaint, letterSpacing: 0.8 },
  contactValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  contactEmpty: { fontWeight: '500', color: colors.textFaint },
  contactHint: { fontSize: 12, color: colors.primaryDark, fontWeight: '600', marginTop: 2 },
  contactDivider: { height: 1, backgroundColor: colors.border, marginLeft: 64, opacity: 0.7 },
  socialCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: 14, padding: 16, ...shadow.card },
  socialTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  socialSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  socialRow: { flexDirection: 'row', marginTop: 14 },
  socialBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  socialIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  socialLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 8 },
  mapCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: 14, overflow: 'hidden', ...shadow.card },
  mapVisual: { backgroundColor: colors.primarySoft, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  mapPinWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.card },
  mapTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 10, textAlign: 'center' },
  mapSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  mapBody: { padding: 16 },
  mapMeta: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  eventChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  eventChip: { backgroundColor: colors.softGreen, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#D9EDDE' },
  eventChipText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primaryDark, borderRadius: radius.pill, paddingVertical: 12, marginTop: 12 },
  directionsText: { color: colors.primaryDark, fontWeight: '800', fontSize: 15, marginLeft: 8 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 },
  factTile: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10, alignItems: 'flex-start' },
  factValue: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 8 },
  factLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  ctaWrap: { paddingHorizontal: 20, marginTop: 20 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 16 },
  ctaText: { color: colors.white, fontWeight: '800', fontSize: 18, marginLeft: 10 },
});
