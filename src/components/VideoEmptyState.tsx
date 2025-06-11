// src/components/video/VideoEmptyState.tsx

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmptyStateProps } from '@/src/types/video';

export const AnimatedEmptyState = React.memo<EmptyStateProps>(({ 
  activeTab, 
  searchQuery, 
  isOffline, 
  onClearSearch, 
  onOpenSettings 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getIcon = () => {
    if (activeTab === 'online') {
      if (searchQuery) return 'search-off';
      if (isOffline) return 'cloud-off';
      return 'play-circle-outline';
    }
    return 'download';
  };

  const getTitle = () => {
    if (activeTab === 'online') {
      if (searchQuery) return 'No videos found';
      if (isOffline) return 'No internet connection';
      return 'No videos available';
    }
    if (searchQuery) return 'No downloaded videos match your search';
    return 'No downloaded videos yet';
  };

  const getDescription = () => {
    if (activeTab === 'online') {
      if (searchQuery) return 'Try searching for something else or check your spelling';
      if (isOffline) return 'Connect to the internet to browse and download videos';
      return 'Pull down to refresh and check for new videos';
    }
    if (searchQuery) return 'Clear your search to see all downloaded videos';
    return 'Switch to Online Videos tab to download videos for offline viewing';
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
      className="flex-1 justify-center items-center py-20"
    >
      <View className="items-center">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
          <MaterialIcons 
            name={getIcon() as any} 
            size={40} 
            color="#9CA3AF" 
          />
        </View>
        
        <Text className="text-gray-500 text-lg text-center mt-4 font-medium">
          {getTitle()}
        </Text>
        
        <Text className="text-gray-400 text-sm text-center mt-2 px-8">
          {getDescription()}
        </Text>
        
        {/* Action Buttons */}
        {activeTab === 'online' && isOffline && (
          <TouchableOpacity 
            className="mt-6 bg-[#552BFF] px-6 py-3 rounded-lg"
            onPress={onOpenSettings}
          >
            <Text className="text-white font-medium">Open Settings</Text>
          </TouchableOpacity>
        )}
        
        {searchQuery && (
          <TouchableOpacity 
            className="mt-4 bg-gray-100 px-6 py-3 rounded-lg"
            onPress={onClearSearch}
          >
            <Text className="text-gray-600 font-medium">Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});