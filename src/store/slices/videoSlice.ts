import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_DIRECTORY = FileSystem.documentDirectory + 'downloaded_videos/';

// Store download tasks outside of Redux state to avoid serialization issues
const downloadTasks: Record<string, FileSystem.DownloadResumable> = {};

// Updated interfaces to match your types
export interface Video {
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

interface DownloadedVideo {
  id: string;
  uri: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  author: string;
  description: string;
  views: string;
  downloadDate?: string;
  fileSize?: string;
}

interface VideoState {
  videos: Video[];
  downloadedVideos: DownloadedVideo[];
  isLoading: boolean;
  isOffline: boolean;
  refreshing: boolean;
  activeTab: 'online' | 'offline';
  currentVideo: DownloadedVideo | null;
  downloadProgress: Record<string, number>;
  isPlaying: boolean;
  error: string | null;
  activeDownloads: string[]; // Just track IDs of active downloads
}

const initialState: VideoState = {
  videos: [],
  downloadedVideos: [],
  isLoading: true,
  isOffline: false,
  refreshing: false,
  activeTab: 'online',
  currentVideo: null,
  downloadProgress: {},
  isPlaying: false,
  error: null,
  activeDownloads: [],
};

export const checkNetworkStatus = createAsyncThunk(
  'videos/checkNetworkStatus',
  async () => {
    try {
      const netState = await Network.getNetworkStateAsync();
      return !netState.isConnected;
    } catch (error) {
      console.error('Network check failed:', error);
      return true; // Assume offline if check fails
    }
  }
);

export const fetchVideos = createAsyncThunk(
  'videos/fetch',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { videos: VideoState };
    
    if (state.videos.isOffline) {
      try {
        const cachedVideos = await AsyncStorage.getItem('videos');
        return { videos: cachedVideos ? JSON.parse(cachedVideos) : [], fromCache: true };
      } catch (error) {
        return rejectWithValue('Failed to load cached videos');
      }
    }

    try {
      const response = await fetch(
        'https://gist.githubusercontent.com/poudyalanil/ca84582cbeb4fc123a13290a586da925/raw/14a27bd0bcd0cd323b35ad79cf3b493dddf6216b/videos.json'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      await AsyncStorage.setItem('videos', JSON.stringify(data));
      return { videos: data, fromCache: false };
    } catch (error) {
      console.error('Fetch error:', error);
      try {
        const cachedVideos = await AsyncStorage.getItem('videos');
        return { 
          videos: cachedVideos ? JSON.parse(cachedVideos) : [], 
          fromCache: true 
        };
      } catch (cacheError) {
        return rejectWithValue('Failed to fetch videos and no cache available');
      }
    }
  }
);

export const loadDownloadedVideos = createAsyncThunk(
  'videos/loadDownloaded',
  async (_, { rejectWithValue }) => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, { intermediates: true });
      }

      const downloaded = await AsyncStorage.getItem('downloadedVideos');
      return downloaded ? JSON.parse(downloaded) : [];
    } catch (error) {
      console.error('Load downloaded error:', error);
      return rejectWithValue('Failed to load downloaded videos');
    }
  }
);

export const downloadVideo = createAsyncThunk(
  'videos/download',
  async (video: Video, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as { videos: VideoState };
    
    if (state.videos.isOffline) {
      return rejectWithValue('You need to be online to download videos');
    }

    const alreadyDownloaded = state.videos.downloadedVideos.some(v => v.id === video.id);
    if (alreadyDownloaded) {
      return rejectWithValue('This video is already downloaded');
    }

    if (!video.videoUrl) {
      return rejectWithValue('Invalid video URL');
    }

    // Check if already downloading
    if (state.videos.activeDownloads.includes(video.id)) {
      return rejectWithValue('This video is already being downloaded');
    }

    dispatch(addActiveDownload(video.id));
    dispatch(setDownloadProgress({ id: video.id, progress: 0 }));

    try {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, { intermediates: true });
      
      const fileName = `video_${video.id}.mp4`;
      const fileUri = DOWNLOAD_DIRECTORY + fileName;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        video.videoUrl,
        fileUri,
        {},
        (downloadProgress: any) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          dispatch(setDownloadProgress({ id: video.id, progress }));
        }
      );

      // Store the download task outside Redux state
      downloadTasks[video.id] = downloadResumable;

      const result = await downloadResumable.downloadAsync();
      
      if (!result) {
        throw new Error('Download was cancelled or failed');
      }

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const fileSizeInMB = fileInfo.size ? (fileInfo.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown';
      
      const newDownloadedVideo: DownloadedVideo = {
        id: video.id,
        uri: result.uri,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        author: video.author,
        description: video.description,
        views: video.views,
        downloadDate: new Date().toISOString(),
        fileSize: fileSizeInMB,
      };

      const updatedDownloads = [...state.videos.downloadedVideos, newDownloadedVideo];
      await AsyncStorage.setItem('downloadedVideos', JSON.stringify(updatedDownloads));
      
      // Clean up
      delete downloadTasks[video.id];
      dispatch(removeActiveDownload(video.id));
      dispatch(clearDownloadProgress(video.id));
      
      return newDownloadedVideo;
    } catch (error) {
      console.error('Download error:', error);
      delete downloadTasks[video.id];
      dispatch(removeActiveDownload(video.id));
      dispatch(clearDownloadProgress(video.id));
      return rejectWithValue(error.message || 'Download failed');
    }
  }
);

export const cancelDownload = createAsyncThunk(
  'videos/cancelDownload',
  async (videoId: string, { dispatch, rejectWithValue }) => {
    try {
      const downloadTask = downloadTasks[videoId];
      
      if (downloadTask) {
        // Cancel the download
        await downloadTask.cancelAsync();
        
        // Try to clean up the partial file
        const fileName = `video_${videoId}.mp4`;
        const fileUri = DOWNLOAD_DIRECTORY + fileName;
        
        try {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(fileUri);
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up partial download file:', cleanupError);
        }
      }
      
      // Clean up
      delete downloadTasks[videoId];
      dispatch(removeActiveDownload(videoId));
      dispatch(clearDownloadProgress(videoId));
      
      return videoId;
    } catch (error) {
      console.error('Cancel download failed:', error);
      // Still clean up even if cancellation failed
      delete downloadTasks[videoId];
      dispatch(removeActiveDownload(videoId));
      dispatch(clearDownloadProgress(videoId));
      return rejectWithValue(error.message || 'Failed to cancel download');
    }
  }
);

export const deleteVideo = createAsyncThunk(
  'videos/delete',
  async (videoId: string, { getState, rejectWithValue }) => {
    const state = getState() as { videos: VideoState };
    const videoToDelete = state.videos.downloadedVideos.find(v => v.id === videoId);
    
    if (!videoToDelete) {
      return rejectWithValue('Video not found');
    }

    try {
      // Delete file
      const fileInfo = await FileSystem.getInfoAsync(videoToDelete.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(videoToDelete.uri);
      }
      
      const updatedDownloads = state.videos.downloadedVideos.filter(v => v.id !== videoId);
      await AsyncStorage.setItem('downloadedVideos', JSON.stringify(updatedDownloads));
      
      return videoId;
    } catch (error) {
      console.error('Delete error:', error);
      return rejectWithValue(error.message || 'Failed to delete video');
    }
  }
);

export const pauseAllDownloads = createAsyncThunk(
  'videos/pauseAllDownloads',
  async (_, { getState }) => {
    try {
      const state = getState() as { videos: VideoState };
      const activeDownloadIds = state.videos.activeDownloads;
      
      const pausePromises = activeDownloadIds.map(async (videoId) => {
        const task = downloadTasks[videoId];
        if (task) {
          try {
            await task.pauseAsync();
          } catch (error) {
            console.warn(`Failed to pause download for video ${videoId}:`, error);
          }
        }
      });
      
      await Promise.allSettled(pausePromises);
    } catch (error) {
      console.error('Pause all downloads failed:', error);
    }
  }
);

export const resumeAllDownloads = createAsyncThunk(
  'videos/resumeAllDownloads',
  async (_, { getState }) => {
    try {
      const state = getState() as { videos: VideoState };
      const activeDownloadIds = state.videos.activeDownloads;
      
      const resumePromises = activeDownloadIds.map(async (videoId) => {
        const task = downloadTasks[videoId];
        if (task) {
          try {
            await task.resumeAsync();
          } catch (error) {
            console.warn(`Failed to resume download for video ${videoId}:`, error);
          }
        }
      });
      
      await Promise.allSettled(resumePromises);
    } catch (error) {
      console.error('Resume all downloads failed:', error);
    }
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'online' | 'offline'>) => {
      state.activeTab = action.payload;
    },
    setCurrentVideo: (state, action: PayloadAction<DownloadedVideo | null>) => {
      state.currentVideo = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setDownloadProgress: (state, action: PayloadAction<{ id: string, progress: number }>) => {
      state.downloadProgress[action.payload.id] = action.payload.progress;
    },
    clearDownloadProgress: (state, action: PayloadAction<string>) => {
      delete state.downloadProgress[action.payload];
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    addActiveDownload: (state, action: PayloadAction<string>) => {
      if (!state.activeDownloads.includes(action.payload)) {
        state.activeDownloads.push(action.payload);
      }
    },
    removeActiveDownload: (state, action: PayloadAction<string>) => {
      state.activeDownloads = state.activeDownloads.filter(id => id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Network Status
      .addCase(checkNetworkStatus.fulfilled, (state, action) => {
        state.isOffline = action.payload;
      })
      
      // Fetch Videos
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.videos = action.payload.videos;
        state.isLoading = false;
        state.refreshing = false;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.refreshing = false;
        state.error = action.payload as string;
      })
      
      // Load Downloaded Videos
      .addCase(loadDownloadedVideos.fulfilled, (state, action) => {
        state.downloadedVideos = action.payload;
      })
      .addCase(loadDownloadedVideos.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Download Video
      .addCase(downloadVideo.fulfilled, (state, action) => {
        state.downloadedVideos = [...state.downloadedVideos, action.payload];
      })
      .addCase(downloadVideo.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Cancel Download
      .addCase(cancelDownload.fulfilled, (state, action) => {
        // Clean up is handled in the thunk and reducers
      })
      .addCase(cancelDownload.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Delete Video
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.downloadedVideos = state.downloadedVideos.filter(v => v.id !== action.payload);
        if (state.currentVideo?.id === action.payload) {
          state.currentVideo = null;
        }
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  setActiveTab, 
  setCurrentVideo, 
  setIsPlaying, 
  setDownloadProgress, 
  clearDownloadProgress,
  setRefreshing,
  addActiveDownload,
  removeActiveDownload,
  clearError,
} = videoSlice.actions;

export default videoSlice.reducer;