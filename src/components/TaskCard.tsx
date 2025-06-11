import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Task } from '../types';
import { formatTime, getPriorityColor, isOverdue } from '../utils/dateUtils';
import { SymbolView } from 'expo-symbols';
import { scale } from '../utils/Responsive';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  isLast?: boolean;
}

const getAnimationSpeed = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return 1000;
    case 'medium':
      return 2000;
    default:
      return 3000;
  }
};

const getPriorityBackgroundColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return '#FFE4B5'; // Light orange/peach
    case 'medium':
      return '#E6E6FA'; // Light purple
    case 'low':
      return '#E0FFFF'; // Light cyan
    default:
      return '#F0F8FF'; // Light blue
  }
};



const getPriorityTextColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return '#FF6B35'; // Orange
    case 'medium':
      return '#8A2BE2'; // Purple
    case 'low':
      return '#20B2AA'; // Cyan
    default:
      return '#4682B4'; // Steel blue
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onPress, 
  onToggleComplete, 
  isLast = false 
}) => {
  const backgroundColor = task.color || '#FFF84E';
  const priorityColor = getPriorityColor(task.priority);
  const textColor = getPriorityTextColor(task.priority);
  const overdue = isOverdue(task.dueDate);
  const animationDuration = getAnimationSpeed(task.priority);
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      rotateValue.setValue(0);
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }).start(() => startRotation());
    };

    startRotation();
  }, [animationDuration, rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="relative">
      {/* Timeline Dot and Line */}
      <View className="absolute left-0 top-0 bottom-0 items-center" style={{ width: 20 }}>
        {/* Dot */}
        <View 
          className="w-3 h-3 rounded-full mt-6 z-10"
          style={{ backgroundColor: priorityColor }}
        />
        
        {/* Vertical Line */}
        {!isLast && (
          <View className="flex-1 w-0.5 bg-gray-300 mt-1" 
            style={{
              borderLeftWidth: 1,
              borderLeftColor: '#D1D5DB',
              borderStyle: 'dashed',
              minHeight: 40,
            }}
          />
        )}
      </View>

      {/* Task Card */}
      <Pressable onPress={onPress} className="ml-8 mb-4">
        <View 
          className="rounded-2xl p-4 shadow-sm"
          style={{ backgroundColor }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              {/* Task Title */}
              <Text 
                className={`text-lg font-medium mb-2 ${
                  task.completed ? 'line-through opacity-50' : ''
                }`}
                style={{ color: task.completed ? '#000' : '#000' }}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              
              {/* Time */}
              <View className="flex-row items-center">
                <SymbolView
                  name="clock"
                  colors={[overdue && !task.completed ? '#EF4444' : '#000']}
                  size={scale(16)}
                  weight="regular"
                />
                <Text 
                  className={`text-sm ml-1 ${
                    overdue && !task.completed ? 'text-red-500' : 'text-gray-600'
                  }`}
                >
                  {formatTime(task.dueDate)}
                </Text>
              </View>
            </View>

            {/* Completion Checkbox */}
            <TouchableOpacity
              onPress={onToggleComplete}
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ml-3 ${
                task.completed 
                  ? 'border-green-500' 
                  : 'border-gray-400'
              }`}
              style={{ 
                backgroundColor: task.completed ? '#10B981' : 'transparent'
              }}
            >
              {task.completed && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </View>
  );
};