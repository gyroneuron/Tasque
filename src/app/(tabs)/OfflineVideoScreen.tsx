// src/screens/VideoApp.tsx

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  RefreshControl,
  Text, 
  TouchableOpacity, 
  View,
  Dimensions,
  Linking,
  Animated
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale } from '@/src/utils/Responsive';

// Custom Hooks
import { useVideoApp } from '@/src/hooks/useVideoApp';

// Components
import { VideoHeader } from '@/src/components/VideoHeader';
import { VideoPlayer } from '@/src/components/VideoPlayer';
import { AnimatedTrendingCard, AnimatedVideoItem, AnimatedDownloadedVideoItem } from '@/src/components/VideoItems';
import { AnimatedEmptyState } from '@/src/components/VideoEmptyState';

// Types
import { Video, DownloadedVideo, ActiveTab } from '@/src/types/video';
import { setCurrentVideo, setActiveTab, setIsPlaying, clearError } from '@/src/store/slices/videoSlice';

const { width: screenWidth } = Dimensions.get('window');

// Animated Section Header Component - memoized
const AnimatedSectionHeader = React.memo<{ 
  title: string;
  icon: string;
  delay?: number;
}>(({ title, icon, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
      className="px-4 py-3 border-b border-gray-100"
    >
      <View className="flex-row items-center">
        <MaterialIcons name={icon as any} size={20} color="#EF4444" />
        <Text className="text-gray-900 text-lg font-bold ml-2">{title}</Text>
      </View>
    </Animated.View>
  );
});

const VideoApp: React.FC = () => {
  const {
    // State
    videoState,
    retryCount,
    isFullscreen,
    setIsFullscreen,
    playerError,
    setPlayerError,
    storageInfo,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    sortBy,
    setSortBy,
    isPlayerLoading,
    setIsPlayerLoading,
    lastSyncTime,
    showLastSync,
    setShowLastSync,

    // Actions
    dispatch,
    initApp,
    onRefresh,
    handleDownload,
    handleDelete,
    handlePlayVideo,
    handleCancelDownload,
    filteredVideos,
    trendingVideos,
  } = useVideoApp();

  const [animationKey, setAnimationKey] = useState(0);

  const player = useVideoPlayer(videoState.currentVideo?.uri || '', (player) => {
    if (videoState.currentVideo) {
      setIsPlayerLoading(true);
      player.loop = false;
      setPlayerError(null);
    }
  });

  // Enhanced player event handling - stable dependencies
  useEffect(() => {
    if (!player) return;

    const subscriptions = [
      player.addListener('playingChange', ({ isPlaying: playing }) => {
        dispatch(setIsPlaying(playing));
      }),
      
      player.addListener('statusChange', ({ status, error }) => {
        if (status === 'loading') {
          setIsPlayerLoading(true);
        } else if (status === 'readyToPlay') {
          setIsPlayerLoading(false);
          setPlayerError(null);
        } else if (status === 'error') {
          setIsPlayerLoading(false);
          setPlayerError(error?.message || 'Video playback failed');
        }
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub?.remove());
    };
  }, [player, dispatch, setIsPlayerLoading, setPlayerError]);

  // Trigger animation when content changes - with proper dependency
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [filteredVideos.length, videoState.activeTab]); // Only when actual content changes

  // Memoized props to prevent object recreation
  const headerProps = useMemo(() => ({
    storageInfo,
    showSearch,
    searchQuery,
    showLastSync,
    lastSyncTime,
    isOffline: videoState.isOffline,
    activeTab: videoState.activeTab,
    downloadedVideosCount: videoState.downloadedVideos.length,
    onToggleSearch: () => setShowSearch(!showSearch),
    onToggleLastSync: () => setShowLastSync(!showLastSync),
    onSearchChange: setSearchQuery,
    onTabChange: (tab: ActiveTab) => dispatch(setActiveTab(tab)),
  }), [
    storageInfo,
    showSearch,
    searchQuery,
    showLastSync,
    lastSyncTime,
    videoState.isOffline,
    videoState.activeTab,
    videoState.downloadedVideos.length,
    setShowSearch,
    setShowLastSync,
    setSearchQuery,
    dispatch
  ]);

  // Video player props - memoized
  const playerProps = useMemo(() => ({
    currentVideo: videoState.currentVideo,
    isPlayerLoading,
    player,
    isFullscreen,
    onClose: () => dispatch(setCurrentVideo(null)),
    onFullscreenEnter: () => setIsFullscreen(true),
    onFullscreenExit: () => setIsFullscreen(false),
  }), [
    videoState.currentVideo,
    isPlayerLoading,
    player,
    isFullscreen,
    dispatch,
    setIsFullscreen
  ]);

  // Empty state props - memoized
  const emptyStateProps = useMemo(() => ({
    activeTab: videoState.activeTab,
    searchQuery,
    isOffline: videoState.isOffline,
    onClearSearch: () => setSearchQuery(''),
    onOpenSettings: () => Linking.openSettings(),
  }), [
    videoState.activeTab,
    searchQuery,
    videoState.isOffline,
    setSearchQuery
  ]);

  // Render functions - stable with useCallback
  const renderTrendingItem = useCallback(({ item, index }: { item: Video; index: number }) => (
    <AnimatedTrendingCard
      key={`${animationKey}-trending-${item.id}`}
      item={item}
      index={index}
      isDownloaded={videoState.downloadedVideos.some(v => v.id === item.id)}
      isDownloading={videoState.activeDownloads.includes(item.id)}
      progress={videoState.downloadProgress[item.id] || 0}
      isOffline={videoState.isOffline}
      onPlay={() => handlePlayVideo(item)}
      onDownload={() => handleDownload(item)}
      onCancelDownload={() => handleCancelDownload(item.id)}
    />
  ), [
    animationKey,
    videoState.downloadedVideos,
    videoState.activeDownloads,
    videoState.downloadProgress,
    videoState.isOffline,
    handlePlayVideo,
    handleDownload,
    handleCancelDownload
  ]);

  const renderVideoItem = useCallback(({ item, index }: { item: Video | DownloadedVideo; index: number }) => {
    if (videoState.activeTab === 'online') {
      const videoItem = item as Video;
      return (
        <AnimatedVideoItem
          key={`${animationKey}-video-${videoItem.id}`}
          item={videoItem}
          index={index}
          isDownloaded={videoState.downloadedVideos.some(v => v.id === videoItem.id)}
          isDownloading={videoState.activeDownloads.includes(videoItem.id)}
          progress={videoState.downloadProgress[videoItem.id] || 0}
          isOffline={videoState.isOffline}
          onPlay={() => handlePlayVideo(videoItem)}
          onDownload={() => handleDownload(videoItem)}
          onCancelDownload={() => handleCancelDownload(videoItem.id)}
        />
      );
    } else {
      const downloadedItem = item as DownloadedVideo;
      return (
        <AnimatedDownloadedVideoItem
          key={`${animationKey}-downloaded-${downloadedItem.id}`}
          item={downloadedItem}
          index={index}
          onPlay={() => handlePlayVideo(downloadedItem)}
          onDelete={() => handleDelete(downloadedItem)}
        />
      );
    }
  }, [
    videoState.activeTab,
    animationKey,
    videoState.downloadedVideos,
    videoState.activeDownloads,
    videoState.downloadProgress,
    videoState.isOffline,
    handlePlayVideo,
    handleDownload,
    handleCancelDownload,
    handleDelete
  ]);

  // Handle error dismissal - stable function
  const handleErrorDismiss = useCallback(() => {
    dispatch(clearError());
    setPlayerError(null);
    if (videoState.error) {
      initApp();
    }
  }, [dispatch, setPlayerError, videoState.error, initApp]);

  // Handle sort change - stable function
  const handleSortChange = useCallback(() => {
    const sorts = videoState.activeTab === 'online' 
      ? ['views', 'title', 'author', 'duration'] 
      : ['date', 'title', 'author', 'duration'];
    const currentIndex = sorts.indexOf(sortBy);
    const nextSort = sorts[(currentIndex + 1) % sorts.length];
    setSortBy(nextSort as any);
  }, [videoState.activeTab, sortBy, setSortBy]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <VideoHeader {...headerProps} />

      {/* Network Status & Error Banner */}
      {(videoState.isOffline || videoState.error || playerError) && (
        <View className={`flex-row items-center justify-center p-3 ${
          videoState.isOffline ? 'bg-orange-500' : 'bg-red-500'
        }`}>
          <MaterialIcons 
            name={videoState.isOffline ? "signal-wifi-off" : "error"} 
            size={18} 
            color="#FFFFFF" 
          />
          <Text className="text-white ml-2 text-sm font-medium">
            {videoState.isOffline 
              ? 'You are currently offline' 
              : playerError || videoState.error || 'Something went wrong'}
          </Text>
          {(videoState.error || playerError) && (
            <TouchableOpacity 
              className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded"
              onPress={handleErrorDismiss}
            >
              <Text className="text-white text-xs">
                {videoState.error ? 'Retry' : 'Dismiss'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Video Player */}
      <VideoPlayer {...playerProps} />

      {/* Content */}
      {videoState.isLoading && filteredVideos.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#552BFF" />
          <Text className="text-gray-500 mt-2">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading videos...'}
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Trending Section - Only for Online Tab */}
          {videoState.activeTab === 'online' && trendingVideos.length > 0 && !videoState.isOffline && !searchQuery && (
            <View className="bg-white mb-2">
              <AnimatedSectionHeader 
                title="Trending Now" 
                icon="trending-up" 
                delay={200}
              />
              
              <FlatList
                data={trendingVideos}
                renderItem={renderTrendingItem}
                keyExtractor={(item) => `trending-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                snapToInterval={scale(180)}
                decelerationRate="fast"
              />
            </View>
          )}

          {/* Main Content List */}
          <View className="flex-1">
            {/* Section Header with Sort */}
            <View className="px-4 py-3 border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 text-lg font-semibold">
                  {videoState.activeTab === 'online' 
                    ? searchQuery 
                      ? `Search Results` 
                      : 'All Videos'
                    : 'Downloaded Videos'}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-sm mr-3">
                    {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
                  </Text>
                  
                  {/* Sort Button */}
                  <TouchableOpacity 
                    className="flex-row items-center bg-gray-100 px-2 py-1 rounded-md"
                    onPress={handleSortChange}
                  >
                    <MaterialIcons name="sort" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-xs ml-1 capitalize">{sortBy}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {filteredVideos.length === 0 ? (
              <AnimatedEmptyState {...emptyStateProps} />
            ) : (
              <FlatList
                data={filteredVideos}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id}
                className="flex-1 bg-gray-50"
                contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={videoState.refreshing}
                    onRefresh={onRefresh}
                    colors={['#552BFF']}
                    tintColor="#552BFF"
                    enabled={videoState.activeTab === 'online'}
                  />
                }
                ListHeaderComponent={
                  filteredVideos.length > 0 && searchQuery ? (
                    <View className="mb-2">
                      <Text className="text-gray-500 text-sm">
                        `Showing results for ${searchQuery}`
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      )}

      {/* Download Progress Indicator */}
      {videoState.activeDownloads.length > 0 && (
        <View className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#552BFF" />
            <Text className="text-gray-700 text-xs ml-2 font-medium">
              {videoState.activeDownloads.length} downloading
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default VideoApp;