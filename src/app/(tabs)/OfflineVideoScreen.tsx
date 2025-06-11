import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/src/store/index';
import { fetchVideos, downloadVideo } from '@/src/store/slices/videoSlice';
import { LoadingSpinner } from '@/src/components/LoadingSpinner';
import { Video } from '@/src/types/index';

const OfflineVideoScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { videos, loading } = useSelector((state: RootState) => state.videos);

  useEffect(() => {
    dispatch(fetchVideos());
  }, [dispatch]);

  const handleDownload = (videoId: string) => {
    Alert.alert(
      'Download Video',
      'Do you want to download this video for offline viewing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            dispatch(downloadVideo(videoId));
          },
        },
      ]
    );
  };

  const handlePlay = (video: Video) => {
    if (video.downloaded) {
      Alert.alert(
        'Play Video',
        `Playing: ${video.title}`,
        [
          { text: 'OK' }
        ]
      );
      // Here you would implement actual video playback
      // using react-native-video or expo-av
    } else {
      Alert.alert(
        'Video Not Downloaded', 
        'Please download the video first to watch it offline.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download Now', onPress: () => handleDownload(video.id) }
        ]
      );
    }
  };

  const handleRefresh = () => {
    dispatch(fetchVideos());
  };

  const downloadedVideos = videos.filter((v: Video) => v.downloaded);
  const availableVideos = videos.filter((v: Video) => !v.downloaded);

  if (loading && videos.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            🎥 Offline Videos
          </Text>
          <Text className="text-gray-600">
            Download videos to watch without internet connection
          </Text>
        </View>

        {/* Storage Info */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900 mb-1">
                Storage Usage
              </Text>
              <Text className="text-sm text-gray-600">
                {downloadedVideos.length} videos downloaded
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-blue-600">
                {downloadedVideos.length}
              </Text>
              <Text className="text-xs text-gray-500">of {videos.length}</Text>
            </View>
          </View>
        </View>

        {/* Downloaded Videos Section */}
        {downloadedVideos.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">
                📱 Downloaded ({downloadedVideos.length})
              </Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-800 text-sm font-medium">Available Offline</Text>
              </View>
            </View>

            {downloadedVideos.map((video: Video) => (
              <TouchableOpacity
                key={video.id}
                onPress={() => handlePlay(video)}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                activeOpacity={0.7}
              >
                <View className="flex-row">
                  <View className="relative">
                    <Image
                      source={{ uri: video.thumbnailUrl }}
                      className="w-24 h-16 rounded-lg mr-4"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black bg-opacity-30 rounded-lg items-center justify-center">
                      <Text className="text-white text-2xl">▶️</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                      {video.description}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-1">
                      By {video.author} • {video.views} views • {video.duration}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-green-100 px-2 py-1 rounded mr-2">
                        <Text className="text-green-800 text-xs font-medium">✓ Downloaded</Text>
                      </View>
                      <Text className="text-blue-600 text-sm font-medium">Tap to play</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available for Download Section */}
        {availableVideos.length > 0 && (
          <View>
            <Text className="text-xl font-semibold text-gray-900 mb-4">
              ☁️ Available for Download ({availableVideos.length})
            </Text>

            {availableVideos.map((video: Video) => (
              <View key={video.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex-row">
                  <Image
                    source={{ uri: video.thumbnailUrl }}
                    className="w-24 h-16 rounded-lg mr-4"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                      {video.description}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-1">
                      By {video.author} • {video.views} views • {video.duration}
                    </Text>
                    
                    {video.downloadProgress !== undefined && 
                     video.downloadProgress > 0 && 
                     video.downloadProgress < 100 ? (
                      <View>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-sm text-gray-600">Downloading...</Text>
                          <Text className="text-sm text-blue-600 font-medium">{video.downloadProgress}%</Text>
                        </View>
                        <View className="bg-gray-200 rounded-full h-2">
                          <View
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${video.downloadProgress}%` }}
                          />
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleDownload(video.id)}
                        className="bg-blue-600 rounded-lg py-2 px-4 self-start"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-medium">⬇️ Download</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {videos.length === 0 && !loading && (
          <View className="items-center py-12">
            <Text className="text-6xl mb-4">🎬</Text>
            <Text className="text-xl font-semibold text-gray-900 mb-2">No Videos Available</Text>
            <Text className="text-gray-500 text-center mb-6">
              We couldn't load any videos at the moment. Check your internet connection and try again.
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        {videos.length > 0 && (
          <View className="bg-blue-50 rounded-xl p-4 mt-4">
            <Text className="text-blue-800 font-medium mb-2">📊 Quick Stats</Text>
            <View className="flex-row justify-between">
              <Text className="text-blue-700">Total Videos: {videos.length}</Text>
              <Text className="text-blue-700">Downloaded: {downloadedVideos.length}</Text>
              <Text className="text-blue-700">Available: {availableVideos.length}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OfflineVideoScreen;