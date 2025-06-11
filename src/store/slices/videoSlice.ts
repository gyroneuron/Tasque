import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Video } from '@/src/types/index';
import { apiService } from '@/src/services/api';
import { storageService } from '@/src/services/storage';

interface VideoState {
  videos: Video[];
  loading: boolean;
  error: string | null;
}

const initialState: VideoState = {
  videos: [],
  loading: false,
  error: null,
};

export const fetchVideos = createAsyncThunk(
  'videos/fetch',
  async () => {
    try {
      const remoteVideos = await apiService.fetchVideos();
      const localVideos = await storageService.getVideos();
      
      // Merge remote and local video data
      const mergedVideos = remoteVideos.map(remoteVideo => {
        const localVideo = localVideos.find(v => v.id === remoteVideo.id);
        return localVideo ? { ...remoteVideo, ...localVideo } : remoteVideo;
      });
      
      await storageService.saveVideos(mergedVideos);
      return mergedVideos;
    } catch (error) {
      const localVideos = await storageService.getVideos();
      return localVideos;
    }
  }
);

export const downloadVideo = createAsyncThunk(
  'videos/download',
  async (videoId: string, { getState, dispatch }) => {
    // This is a mock implementation
    // In a real app, you'd use react-native-fs or expo-file-system
    const state = getState() as { videos: VideoState };
    const video = state.videos.videos.find(v => v.id === videoId);
    
    if (!video) throw new Error('Video not found');

    // Simulate download progress
    for (let progress = 0; progress <= 100; progress += 10) {
      dispatch(updateDownloadProgress({ videoId, progress }));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const updatedVideo = {
      ...video,
      downloaded: true,
      downloadProgress: 100,
      localPath: `file://local/videos/${videoId}.mp4`,
    };

    const videos = await storageService.getVideos();
    const updatedVideos = videos.map(v => v.id === videoId ? updatedVideo : v);
    await storageService.saveVideos(updatedVideos);

    return updatedVideo;
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    updateDownloadProgress: (state, action) => {
      const { videoId, progress } = action.payload;
      const video = state.videos.find(v => v.id === videoId);
      if (video) {
        video.downloadProgress = progress;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch videos';
      })
      .addCase(downloadVideo.fulfilled, (state, action) => {
        const index = state.videos.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.videos[index] = action.payload;
        }
      });
  },
});

export const { updateDownloadProgress } = videoSlice.actions;
export default videoSlice.reducer;