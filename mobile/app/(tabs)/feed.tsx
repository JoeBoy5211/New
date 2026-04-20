import React, {
  useCallback,
  useRef,
  useState,
  memo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/Colors';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChefHat,
  Play,
  Volume2,
  VolumeX,
  X,
  Send,
  UserPlus,
  UserCheck,
  ImageIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT;

// ── URL Helpers ───────────────────────────────────────────────────────────────

/** Resolve a relative path to a full URL */
const resolveMediaUrl = (path?: string): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

/**
 * Convert a Cloudinary video URL to an HLS manifest URL for adaptive bitrate
 * streaming. Non-Cloudinary URLs and image URLs are returned unchanged.
 *
 * Before: https://res.cloudinary.com/<cloud>/video/upload/v123/foo.mp4
 * After:  https://res.cloudinary.com/<cloud>/video/upload/sp_auto,f_auto,q_auto:eco/v123/foo.m3u8
 */
const toHlsUrl = (url: string): string => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/video/upload/')) return url;
  // If already transformed, return as-is
  if (url.includes('sp_auto')) return url;
  return url
    .replace('/video/upload/', '/video/upload/sp_auto,f_auto,q_auto:eco/')
    .replace(/\.(mp4|webm|mov|avi)(\?.*)?$/, '.m3u8');
};

/** Returns the best playback URL: HLS for Cloudinary videos, raw URL otherwise */
const getVideoUrl = (rawUrl: string): string => {
  return toHlsUrl(rawUrl);
};

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

// ── Comment Sheet ─────────────────────────────────────────────────────────────

const CommentSheet = memo(function CommentSheet({
  promotion,
  visible,
  onClose,
  userId,
}: {
  promotion: any;
  visible: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const border = isDark ? DARK.border : LIGHT.border;
  const tint = isDark ? DARK.tint : LIGHT.tint;

  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: commentsRes, isLoading } = useQuery({
    queryKey: ['comments', promotion?.id],
    queryFn: async () => {
      const res = await api.get(`/promotions/${promotion.id}/comments`);
      return res.data.comments as any[];
    },
    enabled: !!promotion?.id && visible,
  });

  const comments = commentsRes ?? [];

  const handleSend = async () => {
    if (!comment.trim() || !userId) return;
    setSending(true);
    try {
      await api.post(`/promotions/${promotion.id}/comments`, {
        userId,
        comment: comment.trim(),
      });
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', promotion.id] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    } catch {
      Alert.alert('Error', 'Could not send comment.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.commentBackdrop} onPress={onClose} />
        <View style={[styles.commentSheet, { backgroundColor: bg }]}>
          {/* Handle */}
          <View style={[styles.commentHandle, { backgroundColor: border }]} />

          {/* Header */}
          <View style={[styles.commentHeader, { borderBottomColor: border }]}>
            <Text style={[styles.commentHeaderTitle, { color: text }]}>
              Comments ({formatCount(promotion?.comments_count ?? comments.length)})
            </Text>
            <Pressable onPress={onClose}>
              <X size={22} color={subtle} />
            </Pressable>
          </View>

          {/* List */}
          {isLoading ? (
            <ActivityIndicator color={tint} style={{ marginVertical: 24 }} />
          ) : comments.length === 0 ? (
            <View style={styles.commentEmpty}>
              <MessageCircle size={36} color={subtle} />
              <Text style={[styles.commentEmptyText, { color: subtle }]}>
                No comments yet. Be the first!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}
              showsVerticalScrollIndicator={false}
            >
              {comments.map((c: any) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={[styles.commentAvatar, { backgroundColor: BRAND.burgundy }]}>
                    <Text style={styles.commentAvatarText}>
                      {(c.user_name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={[styles.commentUser, { color: tint }]}>
                      {c.user_name || 'Customer'}
                    </Text>
                    <Text style={[styles.commentText, { color: text }]}>{c.comment}</Text>
                    <Text style={[styles.commentTime, { color: subtle }]}>
                      {new Date(c.created_at || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Input */}
          {userId ? (
            <View style={[styles.commentInputRow, { borderTopColor: border, backgroundColor: bg }]}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment…"
                placeholderTextColor={subtle}
                style={[styles.commentInput, { backgroundColor: isDark ? DARK.surface : LIGHT.surface, color: text }]}
                multiline
                maxLength={300}
              />
              <Pressable
                onPress={handleSend}
                disabled={!comment.trim() || sending}
                style={[
                  styles.commentSendBtn,
                  { backgroundColor: comment.trim() ? tint : isDark ? '#333' : '#EEE' },
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={16} color="#fff" />
                )}
              </Pressable>
            </View>
          ) : (
            <View style={[styles.commentInputRow, { borderTopColor: border }]}>
              <Text style={[styles.commentLoginHint, { color: subtle }]}>
                Sign in to comment
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ── Lazy Video Component ──────────────────────────────────────────────────────
/**
 * Shows a low-res thumbnail immediately, then fades in the video once it starts
 * playing. This prevents the "black flash" when navigating the feed.
 *
 * HLS fallback: if the .m3u8 URL errors (e.g. for videos uploaded before HLS
 * eager transforms were enabled), automatically retries with the MP4 fallbackUrl.
 */
const LazyVideo = memo(function LazyVideo({
  videoUrl,
  fallbackUrl,
  thumbnailUrl,
  shouldPlay,
  isMuted,
  onError,
  onPlaybackStatusUpdate,
}: {
  videoUrl: string;
  fallbackUrl?: string | null;  // original .mp4 URL to retry if HLS fails
  thumbnailUrl?: string | null;
  shouldPlay: boolean;
  isMuted: boolean;
  onError: () => void;
  onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
}) {
  const [videoReady, setVideoReady] = useState(false);
  const [activeUrl, setActiveUrl] = useState(videoUrl);
  const hlsFailed = useRef(false);
  const videoOpacity = useRef(new Animated.Value(0)).current;

  const handleReadyForDisplay = useCallback(() => {
    setVideoReady(true);
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [videoOpacity]);

  const handleError = useCallback(() => {
    // If HLS failed and we have a MP4 fallback, try it once before giving up
    if (!hlsFailed.current && fallbackUrl && fallbackUrl !== activeUrl) {
      hlsFailed.current = true;
      setVideoReady(false);
      videoOpacity.setValue(0);
      setActiveUrl(fallbackUrl);
    } else {
      onError();
    }
  }, [fallbackUrl, activeUrl, onError, videoOpacity]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Thumbnail shown while video loads */}
      {thumbnailUrl && !videoReady && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      {/* Hardware-accelerated video player */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: videoReady ? videoOpacity : 0 }]}>
        <Video
          source={{ uri: activeUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted={isMuted}
          // shouldPlay is the declarative, hardware-friendly API — avoids
          // calling playAsync/pauseAsync imperatively which can cause state bugs
          shouldPlay={shouldPlay}
          onError={handleError}
          useNativeControls={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onReadyForDisplay={handleReadyForDisplay}
          progressUpdateIntervalMillis={500}
          // Uses Android's native MediaPlayer for hardware decoding (better battery, lower CPU)
          androidImplementation="MediaPlayer"
        />
      </Animated.View>
    </View>
  );
});

// ── Single Video Item ─────────────────────────────────────────────────────────

const FeedItem = memo(function FeedItem({
  item,
  isActive,
  globalMuted,
  onToggleMute,
  userId,
  onLike,
  onSave,
  onFollow,
  /**
   * windowDistance: distance from current active index.
   * 0 = active, 1 = adjacent (preload), >=2 = release resources
   */
  windowDistance,
}: {
  item: any;
  isActive: boolean;
  globalMuted: boolean;
  onToggleMute: () => void;
  userId?: string;
  onLike: (id: string, liked: boolean) => void;
  onSave: (id: string, saved: boolean) => void;
  onFollow: (catererId: string, following: boolean) => void;
  windowDistance: number;
}) {
  const router = useRouter();
  const [videoError, setVideoError] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const queryClient = useQueryClient();

  // Double tap state
  const lastTap = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const isVideo = item.media_type === 'video';
  const rawMediaUrl = resolveMediaUrl(item.media_url);

  // Apply HLS transformation for Cloudinary videos
  const mediaUrl = isVideo && rawMediaUrl ? getVideoUrl(rawMediaUrl) : rawMediaUrl;

  // Thumbnail: prefer dedicated thumbnail_url, fallback to caterer cover image
  const thumbnailUrl = resolveMediaUrl(item.thumbnail_url || item.caterer_image);

  /**
   * Memory management: if this item is more than 2 positions away from the
   * active index, null out the video source so expo-av releases the decoder.
   */
  const shouldRenderVideo = isVideo && windowDistance <= 1;
  const shouldReleaseVideo = isVideo && windowDistance > 2;

  /**
   * Only the active item plays. Adjacent items (distance=1) are mounted but
   * paused so they can pre-buffer silently.
   */
  const shouldPlay = isActive && !videoPaused && !videoError;

  const handleLike = async (isDoubleTap = false) => {
    if (!userId) {
      if (!isDoubleTap) Alert.alert('Sign In Required', 'Please sign in to like posts.');
      return;
    }

    if (isDoubleTap) {
      triggerHeartAnimation();
      if (item.is_liked) return;
    }

    const newLiked = !item.is_liked;
    onLike(item.id, newLiked);
    try {
      await api.post(`/promotions/${item.id}/like`, { userId });
    } catch {
      onLike(item.id, !newLiked);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleLike(true);
    } else {
      if (isVideo) {
        setVideoPaused(p => !p);
      }
    }
    lastTap.current = now;
  };

  const triggerHeartAnimation = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 300,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsBuffering(status.isBuffering);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to save posts.');
      return;
    }
    const newSaved = !item.is_saved;
    onSave(item.id, newSaved);
    try {
      await api.post(`/promotions/${item.id}/save`, { userId });
    } catch {
      onSave(item.id, !newSaved);
    }
  };

  const handleFollow = async () => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to follow caterers.');
      return;
    }
    const newFollowing = !item.is_following;
    onFollow(item.caterer_id, newFollowing);
    try {
      await api.post(`/promotions/${item.caterer_id}/follow`, { userId });
    } catch {
      onFollow(item.caterer_id, !newFollowing);
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/promotions/${item.id}/share`);
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    } catch {}
  };

  return (
    <View style={styles.feedItem}>
      {/* ── Media ── */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleTap}>
        {isVideo && mediaUrl && !videoError && !shouldReleaseVideo ? (
          shouldRenderVideo ? (
            <LazyVideo
              videoUrl={mediaUrl}
              fallbackUrl={rawMediaUrl}  {/* MP4 fallback if HLS .m3u8 is not yet generated */}
              thumbnailUrl={thumbnailUrl}
              shouldPlay={shouldPlay}
              isMuted={globalMuted}
              onError={() => setVideoError(true)}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />
          ) : (
            // Adjacent slot: show thumbnail only, keep video unmounted until close
            thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.mediaPlaceholder]}>
                <ImageIcon size={48} color="rgba(255,255,255,0.3)" />
              </View>
            )
          )
        ) : mediaUrl && !shouldReleaseVideo ? (
          <Image
            source={{ uri: mediaUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.mediaPlaceholder]}>
            {!shouldReleaseVideo && <ImageIcon size={48} color="rgba(255,255,255,0.3)" />}
          </View>
        )}
      </Pressable>

      {/* ── Linear Gradient overlay ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* ── Buffering indicator ── */}
      {isActive && isVideo && isBuffering && !videoPaused && (
        <View style={styles.centerIndicator}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
        </View>
      )}

      {/* ── Paused indicator ── */}
      {isVideo && videoPaused && !isBuffering && (
        <View style={styles.centerIndicator}>
          <Play size={64} color="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.85)" />
        </View>
      )}

      {/* ── Animated Heart (Double Tap) ── */}
      <Animated.View
        style={[
          styles.centerIndicator,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Heart size={100} color="#FF2D55" fill="#FF2D55" />
      </Animated.View>

      {/* ── Mute button (top right) ── */}
      <Pressable onPress={onToggleMute} style={styles.muteBtn} hitSlop={12}>
        {globalMuted ? (
          <VolumeX size={18} color="#fff" />
        ) : (
          <Volume2 size={18} color="#fff" />
        )}
      </Pressable>

      {/* ── Right Action Bar ── */}
      <View style={styles.actionBar}>
        {/* Avatar + Follow */}
        <View style={styles.avatarContainer}>
          <Pressable
            onPress={() => router.push(`/caterer/${item.caterer_id}` as any)}
            style={styles.catererAvatarWrap}
          >
            {item.caterer_image ? (
              <Image
                source={{ uri: resolveMediaUrl(item.caterer_image) as string }}
                style={styles.catererAvatar}
              />
            ) : (
              <View style={[styles.catererAvatar, { backgroundColor: BRAND.burgundy, justifyContent: 'center', alignItems: 'center' }]}>
                <ChefHat size={20} color={BRAND.gold} />
              </View>
            )}
          </Pressable>
          <Pressable onPress={handleFollow} style={[styles.followBtn, { backgroundColor: item.is_following ? 'rgba(255,255,255,0.25)' : BRAND.gold }]}>
            {item.is_following ? (
              <UserCheck size={14} color="#fff" />
            ) : (
              <UserPlus size={14} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Like */}
        <Pressable onPress={() => handleLike()} style={styles.actionItem}>
          <Heart
            size={28}
            color={item.is_liked ? '#FF2D55' : '#fff'}
            fill={item.is_liked ? '#FF2D55' : 'transparent'}
          />
          <Text style={styles.actionCount}>{formatCount(item.likes_count ?? 0)}</Text>
        </Pressable>

        {/* Comment */}
        <Pressable onPress={() => setCommentVisible(true)} style={styles.actionItem}>
          <MessageCircle size={28} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(item.comments_count ?? 0)}</Text>
        </Pressable>

        {/* Save */}
        <Pressable onPress={handleSave} style={styles.actionItem}>
          <Bookmark
            size={26}
            color={item.is_saved ? BRAND.gold : '#fff'}
            fill={item.is_saved ? BRAND.gold : 'transparent'}
          />
          <Text style={styles.actionCount}>{formatCount(item.shares_count ?? 0)}</Text>
        </Pressable>

        {/* Share */}
        <Pressable onPress={handleShare} style={styles.actionItem}>
          <Share2 size={24} color="#fff" />
        </Pressable>
      </View>

      {/* ── Bottom Info ── */}
      <View style={styles.bottomInfo}>
        {/* Caterer name */}
        <Pressable
          onPress={() => router.push(`/caterer/${item.caterer_id}` as any)}
          style={styles.catererNameRow}
        >
          <ChefHat size={13} color={BRAND.gold} />
          <Text style={styles.catererName} numberOfLines={1}>
            {item.caterer_name}
          </Text>
          {item.is_following && (
            <View style={styles.followingBadge}>
              <Text style={styles.followingBadgeText}>Following</Text>
            </View>
          )}
        </Pressable>

        {/* Caption */}
        {item.caption ? (
          <Text style={styles.caption} numberOfLines={3}>
            {item.caption}
          </Text>
        ) : null}

        {/* Tags */}
        {item.tags ? (
          <Text style={styles.tags} numberOfLines={1}>
            {item.tags
              .split(',')
              .map((t: string) => `#${t.trim()}`)
              .join('  ')}
          </Text>
        ) : null}
      </View>

      {/* Comment Sheet */}
      <CommentSheet
        promotion={item}
        visible={commentVisible}
        onClose={() => setCommentVisible(false)}
        userId={userId}
      />
    </View>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tint = isDark ? DARK.tint : LIGHT.tint;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [backendReady, setBackendReady] = useState(false);
  const flashListRef = useRef<FlashList<any>>(null);

  // ── Render cold-start: ping /api/pulse on startup to wake Render dyno ──
  useEffect(() => {
    const warmup = async () => {
      try {
        await api.get('/pulse', { timeout: 8000 });
      } catch {
        // Silently ignore — even a timeout means the dyno is waking up
      } finally {
        setBackendReady(true);
      }
    };
    warmup();
  }, []);

  // Pause everything when tab is unfocused
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await api.get('/promotions', {
        headers: user?.id ? { 'user-id': user.id } : {},
      });
      return res.data.promotions as any[];
    },
    retry: 1,
    // Wait until the pulse check is done to reduce chance of hitting a cold dyno
    enabled: backendReady,
  });

  useEffect(() => {
    if (data) setLocalItems(data);
  }, [data]);

  // Optimistic update helpers
  const handleLike = useCallback((id: string, liked: boolean) => {
    setLocalItems(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, is_liked: liked, likes_count: liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
          : p
      )
    );
  }, []);

  const handleSave = useCallback((id: string, saved: boolean) => {
    setLocalItems(prev =>
      prev.map(p => (p.id === id ? { ...p, is_saved: saved } : p))
    );
  }, []);

  const handleFollow = useCallback((catererId: string, following: boolean) => {
    setLocalItems(prev =>
      prev.map(p =>
        p.caterer_id === catererId ? { ...p, is_following: following } : p
      )
    );
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  /**
   * 80% viewability threshold — an item is only considered "active" when it
   * occupies at least 80% of the screen, matching TikTok's behaviour.
   */
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  // ── Loading ──
  if (isLoading || !backendReady) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <StatusBar barStyle="light-content" />
        <ChefHat size={40} color={BRAND.gold} />
        <ActivityIndicator color={BRAND.gold} style={{ marginTop: 16 }} />
        <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 10, fontSize: 13 }}>
          {!backendReady ? 'Waking up server…' : 'Loading Feed…'}
        </Text>
      </View>
    );
  }

  // ── Error / Empty ──
  if (isError || !localItems || localItems.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: '#0A0A0A' }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyIconWrap}>
          <ChefHat size={48} color={BRAND.gold} />
        </View>
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptySub}>
          Caterers haven't posted any content yet.{'\n'}Check back soon for videos & photos!
        </Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Feed tab header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerRight}>
          <ChefHat size={18} color={BRAND.gold} />
          <Text style={styles.headerBrand}>CaterConnect</Text>
        </View>
      </View>

      <FlashList
        ref={flashListRef}
        data={localItems}
        estimatedItemSize={VIDEO_HEIGHT}
        keyExtractor={item => item.id}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        overrideItemLayout={(layout) => {
          layout.size = VIDEO_HEIGHT;
        }}
        renderItem={({ item, index }) => {
          const windowDistance = Math.abs(index - activeIndex);
          return (
            <FeedItem
              item={item}
              isActive={isScreenFocused && index === activeIndex}
              globalMuted={globalMuted}
              onToggleMute={() => setGlobalMuted(m => !m)}
              userId={user?.id}
              onLike={handleLike}
              onSave={handleSave}
              onFollow={handleFollow}
              windowDistance={windowDistance}
            />
          );
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  /* ── Header ── */
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingHorizontal: SPACING.md,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '800',
    ...Platform.select({ ios: { fontFamily: 'Georgia' }, android: { fontFamily: 'serif' } }),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  headerBrand: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Feed item ── */
  feedItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#0A0A0A',
  },
  mediaPlaceholder: {
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
  },
  centerIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 48,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Right action bar ── */
  actionBar: {
    position: 'absolute',
    right: 12,
    bottom: Platform.OS === 'ios' ? 110 : 90,
    alignItems: 'center',
    gap: 18,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  catererAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  catererAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  followBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* ── Bottom info ── */
  bottomInfo: {
    position: 'absolute',
    left: SPACING.md,
    right: 80,
    bottom: Platform.OS === 'ios' ? 110 : 90,
    gap: 6,
  },
  catererNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catererName: {
    color: '#fff',
    fontSize: TYPOGRAPHY.md,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flexShrink: 1,
  },
  followingBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  followingBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  caption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tags: {
    color: BRAND.gold,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* ── Empty / Error ── */
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(204,133,51,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '800',
    ...Platform.select({ ios: { fontFamily: 'Georgia' }, android: { fontFamily: 'serif' } }),
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: BRAND.burgundy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sm,
  },

  /* ── Comment Sheet ── */
  commentBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentSheet: {
    height: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  commentHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentHeaderTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '800',
  },
  commentEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  commentEmptyText: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  commentBody: { flex: 1, gap: 3 },
  commentUser: { fontSize: TYPOGRAPHY.sm, fontWeight: '700' },
  commentText: { fontSize: TYPOGRAPHY.sm, lineHeight: 18 },
  commentTime: { fontSize: 10 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentInput: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: TYPOGRAPHY.sm,
    maxHeight: 100,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentLoginHint: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sm,
    paddingVertical: 12,
  },
});
