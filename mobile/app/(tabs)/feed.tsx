import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
  Image,
  ActivityIndicator,
  Keyboard,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TextInput
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { usePromotions, Promotion } from '@/src/hooks/usePromotions';
import { api } from '@/src/api/client';
import { Heart, MessageCircle, Download, Bookmark, Play, X, Search, Send } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import BottomSheet, { BottomSheetView, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useAuth } from '@/src/context/AuthContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const { width, height } = Dimensions.get('window');

const resolveImageUrl = (path?: string) => {
  if (!path) return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800';
  if (path.startsWith('http')) return path;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const PromotionItem = React.memo(({ 
  item, 
  isActive, 
  onLike, 
  onSave, 
  onFollow, 
  onShare,
  onCommentPress
}: { 
  item: Promotion; 
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onFollow: (id: string) => void;
  onShare: (id: string) => void;
  onCommentPress: (id: string) => void;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const colorScheme = useColorScheme() ?? 'dark';
  const tint = Colors[colorScheme].tint;

  useEffect(() => {
    if (isActive && item.media_type === 'video' && videoRef.current) {
      videoRef.current.playAsync();
      setIsPlaying(true);
    } else if (!isActive && item.media_type === 'video' && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
      videoRef.current.setPositionAsync(0);
    }
  }, [isActive, item.media_type]);

  const togglePlay = () => {
    if (item.media_type !== 'video' || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (item.media_type !== 'video') return;
    
    setIsDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access to download videos.');
        return;
      }

      // Determine correct extension from URL or default to mp4
      const urlParts = item.media_url.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : 'mp4';
      const cleanExtension = extension.split('?')[0]; // strip query params
      
      const fileUri = `${FileSystem.cacheDirectory}${item.id}.${cleanExtension}`;
      
      const downloadRes = await FileSystem.downloadAsync(
        resolveImageUrl(item.media_url),
        fileUri
      );

      if (downloadRes.status === 200) {
        // Create an asset which already saves it to the gallery
        await MediaLibrary.createAssetAsync(downloadRes.uri);
        Alert.alert('Success', 'Video saved to gallery!');
      } else {
        throw new Error('Download failed');
      }
    } catch (e) {
      console.log('Download error', e);
      Alert.alert('Download Failed', 'Could not save video. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.itemContainer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay}>
        {item.media_type === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: resolveImageUrl(item.media_url) }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isActive}
            isMuted={false}
          />
        ) : (
          <Image
            source={{ uri: resolveImageUrl(item.media_url) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
      </Pressable>

      <View style={styles.gradientOverlay} pointerEvents="none" />

      {!isPlaying && item.media_type === 'video' && (
        <View style={styles.playOverlay} pointerEvents="none">
          <Play size={64} color="rgba(255,255,255,0.7)" fill="rgba(255,255,255,0.7)" />
        </View>
      )}

      {/* Info Overlay (Bottom Left) */}
      <View style={styles.infoOverlay} pointerEvents="box-none">
        <Link href={`/caterer/${item.caterer_id}`} asChild>
          <Pressable style={styles.catererInfoRow}>
            <Image
              source={{ uri: resolveImageUrl(item.caterer_image) }}
              style={styles.avatar}
            />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.catererName}>@{item.caterer_name}</Text>
                {!item.is_following && (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); onFollow(item.caterer_id); }}
                    style={[styles.followBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                  >
                    <Text style={styles.followBtnText}>+ Follow</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.followersText}>{item.followers_count || 0} followers</Text>
            </View>
          </Pressable>
        </Link>
        <Text style={styles.captionText} numberOfLines={3}>{item.caption}</Text>
        <View style={styles.tagsRow}>
          {item.tags?.split(',').map((tag, i) => (
            <Text key={i} style={[styles.tagText, { color: tint }]}>#{tag.trim()}</Text>
          ))}
        </View>
      </View>

      {/* Actions Bar (Bottom Right) */}
      <View style={styles.actionsOverlay} pointerEvents="box-none">
        <Pressable style={styles.actionBtn} onPress={() => onLike(item.id)}>
          <View style={[styles.iconWrap, item.is_liked && { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
            <Heart size={28} color={item.is_liked ? '#EF4444' : '#FFF'} fill={item.is_liked ? '#EF4444' : 'transparent'} />
          </View>
          <Text style={styles.actionCount}>{item.likes_count || 0}</Text>
        </Pressable>
        
        <Pressable style={styles.actionBtn} onPress={() => onCommentPress(item.id)}>
          <View style={styles.iconWrap}>
            <MessageCircle size={28} color="#FFF" />
          </View>
          <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onSave(item.id)}>
          <View style={[styles.iconWrap, item.is_saved && { backgroundColor: 'rgba(234,179,8,0.2)' }]}>
            <Bookmark size={26} color={item.is_saved ? '#EAB308' : '#FFF'} fill={item.is_saved ? '#EAB308' : 'transparent'} />
          </View>
          <Text style={styles.actionCount}>Save</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleDownload} disabled={isDownloading}>
          <View style={styles.iconWrap}>
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Download size={26} color="#FFF" />
            )}
          </View>
          <Text style={styles.actionCount}>{isDownloading ? '…' : 'Download'}</Text>
        </Pressable>

        <Link href={`/caterer/${item.caterer_id}`} asChild>
          <Pressable style={[styles.actionBtn, { marginTop: 8 }]}>
            <Image
              source={{ uri: resolveImageUrl(item.caterer_image) }}
              style={styles.actionAvatar}
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
});

export default function FeedScreen() {
  const { promotions, isLoading, refetch, toggleLike, toggleSave, toggleFollow, trackShare } = usePromotions();
  const [activeTab, setActiveTab] = useState<'discovery' | 'following' | 'saved'>('discovery');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const colorScheme = useColorScheme() ?? 'dark';
  const tint = Colors[colorScheme].tint;
  const isDark = colorScheme === 'dark';
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { user } = useAuth();
  
  // To deal with Bottom Tab bar height offset
  const tabBarHeight = useBottomTabBarHeight();
  const itemHeight = height - tabBarHeight;

  useFocusEffect(
    useCallback(() => {
      // Refresh on navigation focus
      refetch(searchTerm, activeTab === 'saved', false, activeTab === 'following');
    }, [activeTab, searchTerm])
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60
  }).current;

  const handleSearchSubmit = () => {
    refetch(searchTerm, activeTab === 'saved', false, activeTab === 'following');
  };

  const openComments = useCallback(async (id: string) => {
    setSelectedPromotionId(id);
    setComments([]);
    bottomSheetRef.current?.expand();
    setIsCommentsLoading(true);
    try {
      const { data } = await api.get(`/promotions/${id}/comments`);
      if (data?.success) {
        setComments(data.comments || []);
      }
    } catch (e) {
      console.log('Error fetching comments', e);
    } finally {
      setIsCommentsLoading(false);
    }
  }, []);

  const submitComment = async () => {
    if (!commentText.trim() || !user?.id || !selectedPromotionId) return;
    try {
      const { data } = await api.post(`/promotions/${selectedPromotionId}/comments`, {
        userId: user.id,
        comment: commentText.trim()
      });
      if (data?.success && data.comment) {
        setComments([data.comment, ...comments]);
        setCommentText('');
      }
    } catch (e) {
      console.log('Error posting comment', e);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const renderItem = useCallback(({ item, index }: { item: Promotion, index: number }) => (
    <View style={{ height: itemHeight, width }}>
      <PromotionItem
        item={item}
        isActive={index === activeIndex}
        onLike={toggleLike}
        onSave={toggleSave}
        onFollow={toggleFollow}
        onShare={trackShare}
        onCommentPress={openComments}
      />
    </View>
  ), [activeIndex, itemHeight, toggleLike, toggleSave, toggleFollow, trackShare, openComments]);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }), [itemHeight]);

  if (isLoading && promotions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={tint} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemHeight}
        snapToAlignment="start"
        keyboardShouldPersistTaps="handled"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { height: itemHeight }]}>
            <View style={styles.emptyIconWrap}>
              <X size={40} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySub}>We couldn't find any content. Check your filters or try exploring other feeds.</Text>
            <Pressable style={[styles.emptyBtn, { borderColor: tint }]} onPress={() => {setSearchTerm(''); setActiveTab('discovery');}}>
              <Text style={[styles.emptyBtnText, { color: tint }]}>Clear Filters</Text>
            </Pressable>
          </View>
        }
      />

      {/* Floating Header Overlay */}
      <View style={[styles.headerOverlay, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]} pointerEvents="box-none">
        <View style={styles.headerTopRow} pointerEvents="box-none">
          {!isSearchActive ? (
            <View style={styles.tabsRow} pointerEvents="box-none">
              {(['discovery', 'following', 'saved'] as const).map(tab => (
                <Pressable 
                  key={tab} 
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              ))}
              <Pressable 
                style={[styles.tabBtn, { backgroundColor: 'transparent', marginLeft: 4 }]} 
                onPress={() => setIsSearchActive(true)}
              >
                <Search size={20} color="#FFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.searchRow}>
              <Search size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search hashtags..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={() => {
                  handleSearchSubmit();
                  setIsSearchActive(false);
                }}
                autoFocus
                returnKeyType="search"
              />
              <Pressable 
                onPress={() => {
                  setSearchTerm('');
                  setIsSearchActive(false);
                  handleSearchSubmit();
                }} 
                style={{ padding: 4 }}
              >
                <X size={20} color="#FFF" />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Comment Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['65%', '90%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#555' : '#ccc' }}
      >
        <BottomSheetView style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: isDark ? '#FFF' : '#000' }]}>{comments.length} Comments</Text>
        </BottomSheetView>
        
        <BottomSheetScrollView style={styles.sheetBody}>
          {isCommentsLoading ? (
            <ActivityIndicator color={tint} style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#888', marginTop: 30 }}>No comments yet. Be the first!</Text>
          ) : (
            comments.map(c => (
              <View key={c.id} style={styles.commentRow}>
                {c.user_avatar ? (
                  <Image source={{ uri: resolveImageUrl(c.user_avatar) }} style={styles.commentAvatar} />
                ) : (
                  <View style={[styles.commentAvatar, { backgroundColor: isDark ? '#333' : '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: isDark ? '#FFF' : '#000', fontWeight: 'bold' }}>{(c.user_name || '?')[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.commentContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.commentName, { color: isDark ? '#FFF' : '#000' }]}>{c.user_name || 'User'}</Text>
                    <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                  </View>
                  <Text style={[styles.commentText, { color: isDark ? '#DDD' : '#333' }]}>{c.comment}</Text>
                </View>
              </View>
            ))
          )}
        </BottomSheetScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          <View style={[styles.commentInputRow, { borderTopColor: isDark ? '#333' : '#EEE', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <TextInput
              style={[styles.commentInput, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', color: isDark ? '#FFF' : '#000' }]}
              placeholder="Add a comment..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={commentText}
              onChangeText={setCommentText}
            />
            <Pressable 
              style={[styles.commentSendBtn, { backgroundColor: commentText.trim() ? tint : (isDark ? '#333' : '#DDD') }]}
              disabled={!commentText.trim()}
              onPress={() => {
                submitComment();
                Keyboard.dismiss();
              }}
            >
              <Send size={16} color="#FFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  itemContainer: { flex: 1, backgroundColor: '#000' },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Info Overlay (Bottom Left)
  infoOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    width: width * 0.72,
    zIndex: 10,
  },
  catererInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  catererName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followersText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  followBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  followBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  captionText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Actions Bar (Bottom Right)
  actionsOverlay: {
    position: 'absolute',
    bottom: 24,
    right: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  // Header Overlay
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    height: Platform.OS === 'ios' ? 24 : 34,
  },
  searchBtn: {
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { color: '#FFF', fontSize: 24, fontWeight: '700', marginBottom: 12 },
  emptySub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },

  // Bottom Sheet
  sheetHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    alignItems: 'center'
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetBody: { flex: 1 },
  commentRow: { flexDirection: 'row', padding: 16, gap: 12 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentContent: { flex: 1 },
  commentName: { fontSize: 13, fontWeight: '700' },
  commentTime: { fontSize: 11, color: '#888' },
  commentText: { fontSize: 14, marginTop: 4, lineHeight: 18 },
  commentInputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 12
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
