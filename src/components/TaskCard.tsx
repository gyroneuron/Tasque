import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Task } from '../types';
import { formatTime, getPriorityColor, isOverdue } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onToggleComplete }) => {
  const priorityColor = getPriorityColor(task.priority);
  const overdue = isOverdue(task.dueDate);

  return (
    <Pressable onPress={onPress} className="mb-3">
      <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-2">
              <TouchableOpacity
                onPress={onToggleComplete}
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  task.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}
              >
                {task.completed && (
                  <Text className="text-white text-xs">✓</Text>
                )}
              </TouchableOpacity>
              <View 
                className={`w-2 h-2 rounded-full mr-2`}
                style={{ backgroundColor: priorityColor }}
              />
            </View>
            
            <Text 
              className={`text-base font-medium mb-1 ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            
            {task.description && (
              <Text 
                className={`text-sm mb-2 ${
                  task.completed ? 'text-gray-400' : 'text-gray-600'
                }`}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}
            
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">⏰</Text>
              <Text 
                className={`text-xs ${
                  overdue && !task.completed ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {formatTime(task.dueDate)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};