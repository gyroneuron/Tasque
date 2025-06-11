// src/components/video/VideoPlayer.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { VideoView } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoPlayerProps } from '@/src/types/video';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentVideo,
  isPlayerLoading,
  player,
  onClose,
  onFullscreenEnter,
  onFullscreenExit,
}) => {
  if (!currentVideo) return null;

  return (
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
          onFullscreenEnter={onFullscreenEnter}
          onFullscreenExit={onFullscreenExit}
        />
        
        <TouchableOpacity 
          className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2"
          onPress={onClose}
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
  );
};