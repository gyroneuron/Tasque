// src/components/video/VideoItems.tsx

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { VideoItemProps, DownloadedVideoItemProps } from '@/src/types/video';

const { width: screenWidth } = Dimensions.get('window');

// Animated Trending Card Component
export const AnimatedTrendingCard = React.memo<VideoItemProps & { index: number }>(({ 
  item, 
  index, 
  isDownloaded, 
  isDownloading, 
  progress, 
  isOffline,
  onPlay,
  onDownload,
  onCancelDownload 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 150;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity 
        className="mr-3 w-48"
        onPress={onPlay}
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
                <Text className="text-[#552BFF] text-xs mr-1">{Math.round(progress * 100)}%</Text>
                <TouchableOpacity onPress={onCancelDownload}>
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
                  onDownload();
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
    </Animated.View>
  );
});

// Animated Video Item Component
export const AnimatedVideoItem = React.memo<VideoItemProps>(({ 
  item, 
  index, 
  isDownloaded, 
  isDownloading, 
  progress, 
  isOffline,
  onPlay,
  onDownload,
  onCancelDownload 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const delay = index * 100;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity 
        className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm"
        onPress={onPlay}
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
                      {Math.round(progress * 100)}%
                    </Text>
                    <TouchableOpacity onPress={onCancelDownload}>
                      <MaterialIcons name="close" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Progress.Bar 
                    progress={progress} 
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
                        onDownload();
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
    </Animated.View>
  );
});

// Animated Downloaded Video Item Component
export const AnimatedDownloadedVideoItem = React.memo<DownloadedVideoItemProps>(({ 
  item, 
  index, 
  onPlay, 
  onDelete 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 120;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity 
        className="flex-row bg-white rounded-xl overflow-hidden mb-4 shadow-sm"
        onPress={onPlay}
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
              onPress={onPlay}
              activeOpacity={0.8}
            >
              <FontAwesome name="play" size={10} color="#FFFFFF" />
              <Text className="text-white text-xs ml-1 font-medium">Play</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center border border-red-500 px-3 py-1 rounded-md"
              onPress={onDelete}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={10} color="#EF4444" />
              <Text className="text-red-500 text-xs ml-1 font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});