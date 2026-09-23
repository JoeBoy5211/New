import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useHomeBanners } from '@/hooks/useHomeBanners';
import type { HomeBanner } from '@/types/domain';

const AUTOPLAY_MS = 5000;
/** Must match the horizontal padding of the home content. */
const SIDE_PAD = 20;

const FALLBACK_BANNER = require('../../../assets/ethiopian-banner.png');

/**
 * Fixed-size home banner slot (full width, 767:318).
 * - 0 banners (or load error): built-in banner, same size as before.
 * - 1 banner: static image, same size.
 * - 2+: paging carousel with dots + autoplay — `cover` crop keeps the
 *   slot size identical no matter the image dimensions.
 */
export function HomeBannerCarousel({
  onPressBanner,
  onPressFallback,
}: {
  onPressBanner: (banner: HomeBanner) => void;
  onPressFallback: () => void;
}) {
  const { data } = useHomeBanners();
  const banners = data ?? [];
  const { width: winWidth } = useWindowDimensions();
  const slideWidth = Math.max(1, winWidth - SIDE_PAD * 2);
  const listRef = useRef<FlatList<HomeBanner>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [banners.length]);

  // Autoplay: re-arms on every index change, so a manual swipe restarts
  // the timer instead of fighting the user.
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setTimeout(() => {
      const next = (index + 1) % banners.length;
      try {
        listRef.current?.scrollToIndex({ index: next, animated: true });
      } catch {
        setIndex(next);
      }
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, banners.length]);

  if (banners.length === 0) {
    return (
      <View style={styles.slot}>
        <Pressable
          onPress={onPressFallback}
          accessibilityRole="button"
          accessibilityLabel="Authentic Ethiopian Catering - Explore Now"
          style={({ pressed }) => [styles.fill, pressed && { opacity: 0.94 }]}
        >
          <Image source={FALLBACK_BANNER} style={styles.fill} resizeMode="contain" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={(_, i) => ({ length: slideWidth, offset: slideWidth * i, index: i })}
        onMomentumScrollEnd={(e) =>
          setIndex(
            Math.min(
              banners.length - 1,
              Math.max(0, Math.round(e.nativeEvent.contentOffset.x / slideWidth)),
            ),
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressBanner(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title || 'Home banner'}
            style={({ pressed }) => [{ width: slideWidth }, pressed && { opacity: 0.94 }]}
          >
            <Image source={{ uri: item.image_url }} style={styles.slideImg} resizeMode="cover" />
          </Pressable>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Identical slot to the previous static banner — size never changes.
  slot: {
    width: '100%',
    aspectRatio: 767 / 318,
    marginTop: 18,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F3EDE2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  fill: { width: '100%', height: '100%' },
  slideImg: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginHorizontal: 3,
  },
  dotActive: { width: 18, backgroundColor: '#FFFFFF' },
});
