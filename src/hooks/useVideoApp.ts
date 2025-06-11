// src/hooks/useVideoApp.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, AppState, BackHandler, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import { RootState } from '../store/index';
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
} from '../store/slices/videoSlice';
import { Video, DownloadedVideo, StorageInfo, SortBy, ActiveTab } from '../types/video';

export const useVideoApp = () => {
  const dispatch = useDispatch();
  const videoState = useSelector((state: RootState) => state.videos);

  // Local state
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ free: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showLastSync, setShowLastSync] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check available storage space - memoized to prevent recreating on every render
  const checkStorageSpace = useCallback(async () => {
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
  }, []);

  // Enhanced initialization with error handling - stable function
  const initApp = useCallback(async () => {
    if (isInitialized) return; // Prevent multiple initializations
    
    try {
      await checkStorageSpace();
      await dispatch(checkNetworkStatus()).unwrap();
      await dispatch(loadDownloadedVideos()).unwrap();

      if (!videoState.isOffline) {
        await dispatch(fetchVideos()).unwrap();
        setLastSyncTime(new Date());
        setRetryCount(0);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          // Don't call initApp recursively, just retry the failed parts
          dispatch(fetchVideos());
        }, 2000 * (retryCount + 1));
      }
    }
  }, [dispatch, checkStorageSpace, videoState.isOffline, retryCount, isInitialized]);

  // Enhanced refresh with network check - stable function
  const onRefresh = useCallback(async () => {
    if (videoState.isOffline) {
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
  }, [dispatch, videoState.isOffline, checkStorageSpace]);

  // Enhanced download with storage check - stable function
  const handleDownload = useCallback(async (item: Video) => {
    if (videoState.activeDownloads.includes(item.id)) {
      Alert.alert(
        'Download in Progress',
        'This video is already being downloaded.',
        [{ text: 'OK' }]
      );
      return;
    }

    const isAlreadyDownloaded = videoState.downloadedVideos.some(v => v.id === item.id);
    if (isAlreadyDownloaded) {
      Alert.alert(
        'Already Downloaded',
        'This video is already saved on your device.',
        [{ text: 'OK' }]
      );
      return;
    }

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
  }, [videoState.activeDownloads, videoState.downloadedVideos, storageInfo, dispatch, checkStorageSpace]);

  // Enhanced delete with confirmation - stable function
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
  }, [dispatch, checkStorageSpace]);

  // Play video with error handling - stable function
  const handlePlayVideo = useCallback(async (item: Video | DownloadedVideo) => {
    try {
      if ('videoUrl' in item) {
        const downloadedVideo = videoState.downloadedVideos.find(v => v.id === item.id);
        if (downloadedVideo) {
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
          const tempVideo: DownloadedVideo = {
            id: item.id,
            title: item.title,
            author: item.author,
            duration: item.duration,
            thumbnailUrl: item.thumbnailUrl,
            uri: item.videoUrl,
            description: item.description,
            views: item.views
          };
          dispatch(setCurrentVideo(tempVideo));
        }
      } else {
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
  }, [dispatch, videoState.downloadedVideos]);

  // Cancel ongoing download - stable function
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

  // Filter and sort videos - memoized to prevent recalculation
  const getFilteredVideos = useCallback((videoList: Video[] | DownloadedVideo[]) => {
    let filtered = videoList;

    if (searchQuery.trim()) {
      filtered = videoList.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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

  // Get trending videos - memoized
  const getTrendingVideos = useCallback(() => {
    if (videoState.activeTab !== 'online' || !videoState.videos.length) return [];

    return [...videoState.videos]
      .sort((a, b) => {
        const viewsA = parseInt(a.views.replace(/[^\d]/g, '')) || 0;
        const viewsB = parseInt(b.views.replace(/[^\d]/g, '')) || 0;
        return viewsB - viewsA;
      })
      .slice(0, 5);
  }, [videoState.videos, videoState.activeTab]);

  // Memoized computed values to prevent recalculation
  const filteredVideos = useMemo(() => {
    return getFilteredVideos(videoState.activeTab === 'online' ? videoState.videos : videoState.downloadedVideos);
  }, [getFilteredVideos, videoState.activeTab, videoState.videos, videoState.downloadedVideos]);

  const trendingVideos = useMemo(() => {
    return getTrendingVideos();
  }, [getTrendingVideos]);

  // Initialize app only once
  useEffect(() => {
    if (!isInitialized) {
      initApp();
    }
  }, []); // Empty dependency array - run only once

  // Handle app state changes - with stable dependencies
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        dispatch(pauseAllDownloads());
      } else if (nextAppState === 'active') {
        dispatch(resumeAllDownloads());
        checkStorageSpace();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [dispatch, checkStorageSpace]);

  // Handle back button for fullscreen player - with stable dependencies
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (videoState.currentVideo || isFullscreen) {
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
  }, [videoState.currentVideo, isFullscreen, showSearch, dispatch]);

  return {
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
    getFilteredVideos,
    getTrendingVideos,
    checkStorageSpace,

    // Computed (memoized)
    filteredVideos,
    trendingVideos,
  };
};