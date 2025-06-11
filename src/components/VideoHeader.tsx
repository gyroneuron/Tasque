// src/components/video/VideoHeader.tsx

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoHeaderProps } from '@/src/types/video';
import { setActiveTab } from '@/src/store/slices/videoSlice';

// Animated Header Component
const AnimatedHeader = React.memo(() => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text className="text-gray-900 text-2xl font-bold">Video Library</Text>
    </Animated.View>
  );
});

// Animated Search Bar Component
const AnimatedSearchBar = React.memo(({ 
  searchQuery, 
  onSearchChange 
}: { 
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="mb-4"
    >
      <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
        <MaterialIcons name="search" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Search videos..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <MaterialIcons name="clear" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

// Animated Tab Navigation Component
const AnimatedTabNavigation = React.memo(({ 
  activeTab, 
  downloadedVideosCount, 
  onTabChange 
}: { 
  activeTab: string;
  downloadedVideosCount: number;
  onTabChange: (tab: 'online' | 'offline') => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="flex-row bg-gray-100 rounded-xl overflow-hidden"
    >
      <TouchableOpacity
        className={`flex-1 py-3 items-center ${activeTab === 'online' ? 'bg-[#552BFF]' : ''}`}
        onPress={() => onTabChange('online')}
        activeOpacity={0.8}
      >
        <Text className={`font-medium ${activeTab === 'online' ? 'text-white' : 'text-gray-600'}`}>
          Online Videos
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 py-3 items-center ${activeTab === 'offline' ? 'bg-[#552BFF]' : ''}`}
        onPress={() => onTabChange('offline')}
        activeOpacity={0.8}
      >
        <Text className={`font-medium ${activeTab === 'offline' ? 'text-white' : 'text-gray-600'}`}>
          My Downloads ({downloadedVideosCount})
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export const VideoHeader: React.FC<VideoHeaderProps> = ({
  storageInfo,
  showSearch,
  searchQuery,
  showLastSync,
  lastSyncTime,
  isOffline,
  activeTab,
  downloadedVideosCount,
  onToggleSearch,
  onToggleLastSync,
  onSearchChange,
  onTabChange,
}) => {
  return (
    <View className="px-4 pt-6 pb-4 bg-white border-b border-gray-100">
      <View className="flex-row items-center justify-between mb-6">
        <AnimatedHeader />
        <View className="flex-row items-center">
          {/* Search Button */}
          <TouchableOpacity
            onPress={onToggleSearch}
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
                onPress={onToggleLastSync}
                className="ml-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}
          {showLastSync && lastSyncTime && !isOffline && (
            <Text
              onPress={onToggleLastSync}
              className="text-gray-400 text-xs ml-2"
            >
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>

      {/* Animated Search Bar */}
      {showSearch && (
        <AnimatedSearchBar 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      )}

      {/* Animated Tab Navigation */}
      <AnimatedTabNavigation 
        activeTab={activeTab}
        downloadedVideosCount={downloadedVideosCount}
        onTabChange={onTabChange}
      />
    </View>
  );
};