import React from 'react';
import { View, ActivityIndicator } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'small', 
  color = '#6366f1' 
}) => (
  <View className="flex-1 justify-center items-center">
    <ActivityIndicator size={size} color={color} />
  </View>
);