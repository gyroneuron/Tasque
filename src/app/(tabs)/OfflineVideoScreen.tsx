import React, { useEffect, useState, useCallback } from 'react';
import { 
  ActivityIndicator, 
  Alert,
  FlatList, 
  Image, 
  RefreshControl,
  Text, 
  TouchableOpacity, 
  View,
  Dimensions,
  BackHandler,
  AppState,
  Linking,
  TextInput
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialIcons, FontAwesome, Feather, Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkNetworkStatus, 
  fetchVideos, 
  loadDownloadedVideos, 
  downloadVideo, 
  deleteVideo,
  setActiveTab,
  setCurrentVideo,
  setIsPlaying,
  setRefreshing,
  pauseAllDownloads,
  resumeAllDownloads,
  cancelDownload,
  clearError
} from '../../store/slices/videoSlice';
import { RootState } from '../../store/index'
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { scale } from '@/src/utils/Responsive';

// Updated interfaces to match the slice
interface DownloadedVideo {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnailUrl: string;
  uri: string;
  description: string;
  views: string;
  fileSize?: string;
  downloadDate?: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  author: string;
  duration: string;
  isLive: boolean;
  subscriber: string;
  thumbnailUrl: string;
  uploadTime: string;
  videoUrl: string;
  views: string;
  downloaded?: boolean;
  downloadProgress?: number;
  localPath?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoApp = () => {
  const dispatch = useDispatch();
  const {
    videos,
    downloadedVideos,
    isLoading,
    isOffline,
    refreshing,
    activeTab,
    currentVideo,
    downloadProgress,
    activeDownloads, // Updated from downloadTasks
    isPlaying,
    error
  } = useSelector((state: RootState) => state.videos);
  
  // Local state for enhanced UX
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState({ free: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'duration' | 'date' | 'views'>('title');
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const player = useVideoPlayer(currentVideo?.uri || '', (player) => {
    if (currentVideo) {
      setIsPlayerLoading(true);
      player.loop = false;
      setPlayerError(null);
    }
  });

  // Enhanced initialization with error handling
  const initApp = useCallback(async () => {
    try {
      // Check storage space
      await checkStorageSpace();
      
      // Initialize in sequence with proper error handling
      await dispatch(checkNetworkStatus()).unwrap();
      await dispatch(loadDownloadedVideos()).unwrap();
      
      if (!isOffline) {
        await dispatch(fetchVideos()).unwrap();
        setLastSyncTime(new Date());
        setRetryCount(0);
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initApp();
        }, 2000 * (retryCount + 1));
      }
    }
  }, [dispatch, isOffline, retryCount]);

  // Check available storage space
  const checkStorageSpace = async () => {
    try {
      const info = await FileSystem.getFreeDiskStorageAsync();
      const total = await FileSystem.getTotalDiskCapacityAsync();
      setStorageInfo({ 
        free: info / (1024 * 1024 * 1024),
        total: total / (1024 * 1024 * 1024) 
      });
    } catch (error) {
      console.warn('Could not get storage info:', error);
    }
  };

  // Initialize app
  useEffect(() => {
    initApp();
  }, [initApp]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        dispatch(pauseAllDownloads());
      } else if (nextAppState === 'active') {
        dispatch(resumeAllDownloads());
        checkStorageSpace(); // Refresh storage info when app becomes active
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [dispatch]);

  // Handle back button for fullscreen player
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentVideo || isFullscreen) {
        dispatch(setCurrentVideo(null));
        setIsFullscreen(false);
        return true;
      }
      if (showSearch) {
        setShowSearch(false);
        setSearchQuery('');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentVideo, isFullscreen, showSearch, dispatch]);

  // Enhanced player event handling
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
  }, [player, dispatch]);

  // Enhanced refresh with network check
  const onRefresh = useCallback(async () => {
    if (isOffline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    dispatch(setRefreshing(true));
    try {
      await dispatch(fetchVideos()).unwrap();
      setLastSyncTime(new Date());
      setRetryCount(0);
      await checkStorageSpace();
    } catch (error) {
      Alert.alert(
        'Sync Failed', 
        'Unable to refresh videos. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: onRefresh }
        ]
      );
    }
  }, [dispatch, isOffline]);

  // Enhanced download with storage check
  const handleDownload = useCallback(async (item: Video) => {
    // Check if already downloading using activeDownloads
    if (activeDownloads.includes(item.id)) {
      Alert.alert(
        'Download in Progress',
        'This video is already being downloaded.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if already downloaded
    const isAlreadyDownloaded = downloadedVideos.some(v => v.id === item.id);
    if (isAlreadyDownloaded) {
      Alert.alert(
        'Already Downloaded',
        'This video is already saved on your device.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check storage space (assume average video is 50MB)
    if (storageInfo.free < 0.1) {
      Alert.alert(
        'Low Storage Space',
        `You have ${storageInfo.free.toFixed(1)}GB free space. Please free up some space before downloading.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    // Confirm download with better info
    Alert.alert(
      'Download Video',
      `Download "${item.title}" for offline viewing?\n\nBy: ${item.author}\nDuration: ${item.duration}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: async () => {
            try {
              await dispatch(downloadVideo(item)).unwrap();
              checkStorageSpace();
              Alert.alert('Download Started', `"${item.title}" is being downloaded.`);
            } catch (error) {
              Alert.alert(
                'Download Failed',
                typeof error === 'string' ? error : 'Unable to start download. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  }, [activeDownloads, downloadedVideos, storageInfo, dispatch]);

  // Enhanced delete with confirmation
  const handleDelete = useCallback((item: DownloadedVideo) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${item.title}"? This will free up ${item.fileSize || 'some'} storage space.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteVideo(item.id)).unwrap();
              checkStorageSpace();
              Alert.alert('Video Deleted', 'The video has been removed from your device.');
            } catch (error) {
              Alert.alert('Delete Failed', 'Unable to delete video. Please try again.');
            }
          }
        }
      ]
    );
  }, [dispatch]);

  // Play video with error handling - Updated to handle both Video and DownloadedVideo
  const handlePlayVideo = useCallback(async (item: Video | DownloadedVideo) => {
    try {
      // For online videos, check if downloaded first
      if ('videoUrl' in item) {
        const downloadedVideo = downloadedVideos.find(v => v.id === item.id);
        if (downloadedVideo) {
          // Play downloaded version
          const fileInfo = await FileSystem.getInfoAsync(downloadedVideo.uri);
          if (!fileInfo.exists) {
            Alert.alert(
              'Video Not Found',
              'This video file is no longer available. Please download it again.',
              [
                { text: 'OK' },
                { text: 'Remove from List', onPress: () => dispatch(deleteVideo(item.id)) }
              ]
            );
            return;
          }
          dispatch(setCurrentVideo(downloadedVideo));
        } else {
          // Play online version - create temporary DownloadedVideo object
          const tempVideo: DownloadedVideo = {
            id: item.id,
            title: item.title,
            author: item.author,
            duration: item.duration,
            thumbnailUrl: item.thumbnailUrl,
            uri: item.videoUrl, // Use videoUrl for streaming
            description: item.description,
            views: item.views
          };
          dispatch(setCurrentVideo(tempVideo));
        }
      } else {
        // For downloaded videos
        const fileInfo = await FileSystem.getInfoAsync(item.uri);
        if (!fileInfo.exists) {
          Alert.alert(
            'Video Not Found',
            'This video file is no longer available. It may have been deleted.',
            [
              { text: 'OK' },
              { text: 'Remove from List', onPress: () => dispatch(deleteVideo(item.id)) }
            ]
          );
          return;
        }
        dispatch(setCurrentVideo(item));
      }
    } catch (error) {
      Alert.alert('Playback Error', 'Unable to play this video. Please try again.');
    }
  }, [dispatch, downloadedVideos]);

  // Cancel ongoing download
  const handleCancelDownload = useCallback((itemId: string) => {
    Alert.alert(
      'Cancel Download',
      'Are you sure you want to cancel this download?',
      [
        { text: 'Continue Download', style: 'cancel' },
        { 
          text: 'Cancel Download', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelDownload(itemId)).unwrap();
              Alert.alert('Download Cancelled', 'The download has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel download.');
            }
          }
        }
      ]
    );
  }, [dispatch]);

  // Filter and sort videos
  const getFilteredVideos = useCallback((videoList: Video[] | DownloadedVideo[]) => {
    let filtered = videoList;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = videoList.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'duration':
          return a.duration.localeCompare(b.duration);
        case 'views':
          if ('views' in a && 'views' in b) {
            const viewsA = parseInt(a.views.replace(/[^\d]/g, '')) || 0;
            const viewsB = parseInt(b.views.replace(/[^\d]/g, '')) || 0;
            return viewsB - viewsA;
          }
          return 0;
        case 'date':
          if ('downloadDate' in a && 'downloadDate' in b) {
            return new Date(b.downloadDate || 0).getTime() - new Date(a.downloadDate || 0).getTime();
          }
          if ('uploadTime' in a && 'uploadTime' in b) {
            return new Date(b.uploadTime || 0).getTime() - new Date(a.uploadTime || 0).getTime();
          }
          return 0;
        default:
          return 0;
      }
    });
  }, [searchQuery, sortBy]);

  // Get trending videos (top videos by views)
  const getTrendingVideos = useCallback(() => {
    if (activeTab !== 'online' || !videos.length) return [];
    
    return [...videos]
      .sort((a, b) => {
        const viewsA = parseInt(a.views.replace(/[^\d]/g, '')) || 0;
        const viewsB = parseInt(b.views.replace(/[^\d]/g, '')) || 0;
        return viewsB - viewsA;
      })
      .slice(0, 5);
  }, [videos, activeTab]);

  // Render trending video card
  const renderTrendingCard = useCallback(({ item, index }: { item: Video; index: number }) => {
    const isDownloaded = downloadedVideos.some(v => v.id === item.id);
    const progress = downloadProgress[item.id];
    const isDownloading = activeDownloads.includes(item.id);

    return (
      <TouchableOpacity 
        className="mr-3 w-48"
        onPress={() => handlePlayVideo(item)}
        activeOpacity={0.8}
      >
        <View className="relative">
          <Image 
            source={{ uri: item.thumbnailUrl }} 
            className="w-48 h-28 bg-gray-200 rounded-xl"
            defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }}
          />
          
          {/* Trending Badge */}
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-md flex-row items-center">
            <MaterialIcons name="trending-up" size={12} color="white" />
            <Text className="text-white text-xs font-bold ml-1">#{index + 1}</Text>
          </View>

          {/* Live Badge */}
          {item.isLive && (
            <View className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-md">
              <Text className="text-white text-xs font-bold">LIVE</Text>
            </View>
          )}

          {/* Duration */}
          <View className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded">
            <Text className="text-white text-xs font-medium">{item.duration}</Text>
          </View>

          {/* Play Overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black bg-opacity-40 rounded-full p-3">
              <FontAwesome name="play" size={16} color="white" />
            </View>
          </View>

          {/* Download Status */}
          {isDownloaded && (
            <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <MaterialIcons name="check" size={12} color="white" />
            </View>
          )}
        </View>

        <View className="mt-2">
          <Text className="text-gray-900 text-sm font-semibold" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">{item.author}</Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-gray-400 text-xs">{item.views} views</Text>
            
            {isDownloading ? (
              <View className="flex-row items-center">
                <Text className="text-[#552BFF] text-xs mr-1">{Math.round((progress || 0) * 100)}%</Text>
                <TouchableOpacity onPress={() => handleCancelDownload(item.id)}>
                  <MaterialIcons name="close" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : isDownloaded ? (
              <View className="flex-row items-center">
                <MaterialIcons name="offline-pin" size={14} color="#10B981" />
              </View>
            ) : (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleDownload(item);
                }}
                disabled={isOffline || item.isLive}
                className={isOffline || item.isLive ? 'opacity-50' : ''}
              >
                <MaterialIcons 
                  name="cloud-download" 
                  size={14} 
                  color={isOffline || item.isLive ? "#9CA3AF" : "#552BFF"} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [downloadedVideos, downloadProgress, activeDownloads, isOffline, handleDownload, handleCancelDownload, handlePlayVideo]);

  // Render video item with enhanced features
  const renderVideoItem = useCallback(({ item }: { item: Video }) => {
    const isDownloaded = downloadedVideos.some(v => v.id === item.id);
    const progress = downloadProgress[item.id];
    const isDownloading = activeDownloads.includes(item.id);

    return (
      <TouchableOpacity 
        className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm"
        onPress={() => handlePlayVideo(item)}
        activeOpacity={0.8}
      >
        <View className="flex-row">
          <View className="relative">
            <Image 
              source={{ uri: item.thumbnailUrl }} 
              className="w-28 h-20 bg-gray-200"
              defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }}
            />
            
            {/* Live Badge */}
            {item.isLive && (
              <View className="absolute top-1 left-1 bg-red-600 px-1 py-0.5 rounded">
                <Text className="text-white text-xs font-bold">LIVE</Text>
              </View>
            )}
            
            <View className="absolute bottom-1 right-1 bg-black bg-opacity-70 px-1 rounded">
              <Text className="text-white text-xs">{item.duration}</Text>
            </View>
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black bg-opacity-30 rounded-full p-2">
                <FontAwesome name="play" size={10} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 p-3 justify-between">
            <View>
              <Text className="text-gray-900 text-sm font-medium" numberOfLines={2}>
                {item.title}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">{item.author} • {item.subscriber}</Text>
              <Text className="text-gray-400 text-xs mt-1">
                {item.views} views • {new Date(item.uploadTime).toLocaleDateString()}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between mt-2">
              {isDownloading ? (
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[#552BFF] text-xs font-medium">
                      {Math.round((progress || 0) * 100)}%
                    </Text>
                    <TouchableOpacity onPress={() => handleCancelDownload(item.id)}>
                      <MaterialIcons name="close" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Progress.Bar 
                    progress={progress || 0} 
                    width={screenWidth - 200}
                    color="#552BFF"
                    unfilledColor="#E5E7EB"
                    borderWidth={0}
                    height={3}
                  />
                </View>
              ) : (
                <View className="flex-row items-center">
                  {isDownloaded ? (
                    <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-md mr-2">
                      <MaterialIcons name="check-circle" size={14} color="#10B981" />
                      <Text className="text-green-600 text-xs ml-1 font-medium">Saved</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      className={`flex-row items-center bg-gray-50 px-2 py-1 rounded-md mr-2 ${
                        isOffline || item.isLive ? 'opacity-50' : ''
                      }`}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      disabled={isOffline || item.isLive}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons 
                        name="cloud-download" 
                        size={14} 
                        color={isOffline || item.isLive ? "#9CA3AF" : "#552BFF"} 
                      />
                      <Text className={`text-xs ml-1 font-medium ${
                        isOffline || item.isLive ? 'text-gray-400' : 'text-[#552BFF]'
                      }`}>
                        {item.isLive ? 'Live' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [downloadedVideos, downloadProgress, activeDownloads, isOffline, handleDownload, handleCancelDownload, handlePlayVideo]);

  // Render downloaded video item with enhanced features
  const renderDownloadedVideoItem = useCallback(({ item }: { item: DownloadedVideo }) => (
    <TouchableOpacity 
      className="flex-row bg-white rounded-xl overflow-hidden mb-4 shadow-sm"
      onPress={() => handlePlayVideo(item)}
      activeOpacity={0.8}
    >
      <View className="relative">
        <Image 
          source={{ uri: item.thumbnailUrl }} 
          className="w-32 h-24 bg-gray-200"
        />
        <View className="absolute inset-0 items-center justify-center">
          <View className="bg-black bg-opacity-50 rounded-full p-2">
            <FontAwesome name="play" size={16} color="white" />
          </View>
        </View>
        <View className="absolute bottom-1 right-1 bg-black bg-opacity-70 px-1 rounded">
          <Text className="text-white text-xs">{item.duration}</Text>
        </View>
        {/* Offline indicator */}
        <View className="absolute top-1 left-1 bg-green-500 rounded-full p-1">
          <MaterialIcons name="offline-pin" size={12} color="white" />
        </View>
      </View>

      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-gray-900 text-sm font-medium" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">{item.author}</Text>
          <View className="flex-row items-center mt-1">
            <MaterialIcons name="storage" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1">
              {item.fileSize || 'Unknown size'}
              {item.downloadDate && ` • Downloaded ${new Date(item.downloadDate).toLocaleDateString()}`}
            </Text>
          </View>
        </View>

        <View className="flex-row mt-2">
          <TouchableOpacity 
            className="flex-row items-center bg-[#552BFF] px-3 py-1 rounded-md mr-2"
            onPress={() => handlePlayVideo(item)}
            activeOpacity={0.8}
          >
            <FontAwesome name="play" size={10} color="#FFFFFF" />
            <Text className="text-white text-xs ml-1 font-medium">Play</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-row items-center border border-red-500 px-3 py-1 rounded-md"
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={10} color="#EF4444" />
            <Text className="text-red-500 text-xs ml-1 font-medium">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [handlePlayVideo, handleDelete]);

  const filteredVideos = getFilteredVideos(activeTab === 'online' ? videos : downloadedVideos);
  const trendingVideos = getTrendingVideos();

  const [showLastSync, setShowLastSync] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-6 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-gray-900 text-2xl font-bold">Video Library</Text>
          <View className="flex-row items-center">
            {/* Search Button */}
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              className="mr-3"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            {/* Storage Info */}
            {storageInfo.free > 0 && (
              <View className="flex-row items-center">
                <MaterialIcons name="storage" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">
                  {storageInfo.free.toFixed(1)}GB free
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLastSync((prev) => !prev)}
                  className="ml-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}
            {showLastSync && lastSyncTime && !isOffline && (
              <Text
                onPress={() => setShowLastSync(false)}
                className="text-gray-400 text-xs ml-2"
              >
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="mb-4">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-900"
                placeholder="Search videos..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="clear" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tab Navigation */}
        <View className="flex-row bg-gray-100 rounded-xl overflow-hidden">
          <TouchableOpacity
            className={`flex-1 py-3 items-center ${activeTab === 'online' ? 'bg-[#552BFF]' : ''}`}
            onPress={() => dispatch(setActiveTab('online'))}
            activeOpacity={0.8}
          >
            <Text className={`font-medium ${activeTab === 'online' ? 'text-white' : 'text-gray-600'}`}>
              Online Videos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center ${activeTab === 'offline' ? 'bg-[#552BFF]' : ''}`}
            onPress={() => dispatch(setActiveTab('offline'))}
            activeOpacity={0.8}
          >
            <Text className={`font-medium ${activeTab === 'offline' ? 'text-white' : 'text-gray-600'}`}>
              My Downloads ({downloadedVideos.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Status & Error Banner */}
      {(isOffline || error || playerError) && (
        <View className={`flex-row items-center justify-center p-3 ${
          isOffline ? 'bg-orange-500' : 'bg-red-500'
        }`}>
          <MaterialIcons 
            name={isOffline ? "signal-wifi-off" : "error"} 
            size={18} 
            color="#FFFFFF" 
          />
          <Text className="text-white ml-2 text-sm font-medium">
            {isOffline 
              ? 'You are currently offline' 
              : playerError || error || 'Something went wrong'}
          </Text>
          {(error || playerError) && (
            <TouchableOpacity 
              className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded"
              onPress={() => {
                dispatch(clearError());
                setPlayerError(null);
                if (error) initApp();
              }}
            >
              <Text className="text-white text-xs">
                {error ? 'Retry' : 'Dismiss'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Enhanced Video Player */}
      {currentVideo && (
        <View className="bg-black">
          <View className="relative">
            {isPlayerLoading && (
              <View className="absolute inset-0 bg-black items-center justify-center z-10">
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text className="text-white mt-2">Loading video...</Text>
              </View>
            )}
            
            <VideoView
              style={{ width: '100%', height: 220 }}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
              onFullscreenEnter={() => setIsFullscreen(true)}
              onFullscreenExit={() => setIsFullscreen(false)}
            />
            
            <TouchableOpacity 
              className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2"
              onPress={() => dispatch(setCurrentVideo(null))}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <Text className="text-white text-base font-semibold" numberOfLines={2}>
              {currentVideo.title}
            </Text>
            <Text className="text-gray-300 text-sm mt-1">{currentVideo.author}</Text>
            {currentVideo.description && (
              <Text className="text-gray-400 text-sm mt-2" numberOfLines={3}>
                {currentVideo.description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {isLoading && filteredVideos.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#552BFF" />
          <Text className="text-gray-500 mt-2">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading videos...'}
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Trending Section - Only for Online Tab */}
          {activeTab === 'online' && trendingVideos.length > 0 && !isOffline && !searchQuery && (
            <View className="bg-white mb-2">
              <View className="px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <MaterialIcons name="trending-up" size={20} color="#EF4444" />
                    <Text className="text-gray-900 text-lg font-bold ml-2">Trending Now</Text>
                  </View>
                </View>
              </View>
              
              <FlatList
                data={trendingVideos}
                renderItem={renderTrendingCard}
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
                  {activeTab === 'online' 
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
                    onPress={() => {
                      const sorts: Array<typeof sortBy> = activeTab === 'online' 
                        ? ['views', 'title', 'author', 'duration'] 
                        : ['date', 'title', 'author', 'duration'];
                      const currentIndex = sorts.indexOf(sortBy);
                      const nextSort = sorts[(currentIndex + 1) % sorts.length];
                      setSortBy(nextSort);
                    }}
                  >
                    <MaterialIcons name="sort" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-xs ml-1 capitalize">{sortBy}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <FlatList
              data={filteredVideos}
              renderItem={activeTab === 'online' ? renderVideoItem : renderDownloadedVideoItem}
              keyExtractor={(item) => item.id}
              className="flex-1 bg-gray-50"
              contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#552BFF']}
                  tintColor="#552BFF"
                  enabled={activeTab === 'online'}
                />
              }
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-20">
                  <View className="items-center">
                    <MaterialIcons 
                      name={activeTab === 'online' 
                        ? searchQuery 
                          ? 'search-off' 
                          : isOffline 
                            ? 'cloud-off' 
                            : 'play-circle-outline'
                        : 'download'} 
                      size={64} 
                      color="#D1D5DB" 
                    />
                    <Text className="text-gray-500 text-lg text-center mt-4 font-medium">
                      {activeTab === 'online' 
                        ? searchQuery
                          ? 'No videos found'
                          : isOffline 
                            ? 'No internet connection' 
                            : 'No videos available'
                        : searchQuery 
                          ? 'No downloaded videos match your search'
                          : 'No downloaded videos yet'}
                    </Text>
                    <Text className="text-gray-400 text-sm text-center mt-2 px-8">
                      {activeTab === 'online' 
                        ? searchQuery
                          ? 'Try searching for something else or check your spelling'
                          : isOffline 
                            ? 'Connect to the internet to browse and download videos'
                            : 'Pull down to refresh and check for new videos'
                        : searchQuery
                          ? 'Clear your search to see all downloaded videos'
                          : 'Switch to Online Videos tab to download videos for offline viewing'}
                    </Text>
                    
                    {/* Action Buttons */}
                    {activeTab === 'online' && isOffline && (
                      <TouchableOpacity 
                        className="mt-4 bg-[#552BFF] px-4 py-2 rounded-lg"
                        onPress={() => Linking.openSettings()}
                      >
                        <Text className="text-white font-medium">Open Settings</Text>
                      </TouchableOpacity>
                    )}
                    
                    {searchQuery && (
                      <TouchableOpacity 
                        className="mt-4 bg-gray-100 px-4 py-2 rounded-lg"
                        onPress={() => setSearchQuery('')}
                      >
                        <Text className="text-gray-600 font-medium">Clear Search</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              }
              ListHeaderComponent={
                filteredVideos.length > 0 && searchQuery ? (
                  <View className="mb-2">
                    <Text className="text-gray-500 text-sm">
                      Showing results for "{searchQuery}"
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      )}

      {/* Download Progress Indicator */}
      {activeDownloads.length > 0 && (
        <View className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#552BFF" />
            <Text className="text-gray-700 text-xs ml-2 font-medium">
              {activeDownloads.length} downloading
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default VideoApp;