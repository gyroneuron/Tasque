import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/src/store/index';
import { deleteTask, updateTask } from '@/src/store/slices/taskSlice';
import { formatDate, formatTime, getPriorityColor, isOverdue } from '@/src/utils/dateUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface RouteParams {
  taskId: string;
}

const { width: screenWidth } = Dimensions.get('window');

const TaskDetailsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [completionAnimation] = useState(new Animated.Value(0));
  
  const taskId = typeof params.taskId === 'string' ? params.taskId : '';
  const task = useSelector((state: RootState) =>
    state.tasks.tasks.find(t => t.id === taskId)
  );

  useEffect(() => {
    if (!task) {
      // Only navigate back if the task was deleted (not on initial mount)
      router.back();
    }
  }, [task, router]);

  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-8 shadow-lg items-center max-w-sm">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">📋</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Task Not Found
            </Text>
            <Text className="text-gray-500 text-center mb-6 leading-6">
              The task you're looking for doesn't exist or has been deleted.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-[#552BFF] px-8 py-3 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    router.push({
      pathname: '/Tasks/AddEditTaskScreen',
      params: { taskId: task.id }
    });
  };

  const handleShare = async () => {
    try {
      const message = `📋 Task: ${task.title}\n\n📝 Description: ${task.description || 'No description'}\n\n📅 Due: ${formatDate(task.dueDate)} at ${formatTime(task.dueDate)}\n\n🏷️ Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}\n\n✅ Status: ${task.completed ? 'Completed' : 'Pending'}`;
      
      await Share.share({
        message,
        title: 'Task Details',
      });
    } catch (error) {
      console.error('Error sharing task:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTask(task.id));
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async () => {
    try {
      // Trigger completion animation
      if (!task.completed) {
        Animated.sequence([
          Animated.timing(completionAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(completionAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }

      const updatedTask = {
        ...task,
        completed: !task.completed,
        updatedAt: new Date().toISOString(),
      };
      await dispatch(updateTask(updatedTask));
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  const priorityColor = getPriorityColor(task.priority);
  const overdue = isOverdue(task.dueDate) && !task.completed;

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high': 
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' };
      case 'medium': 
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟡' };
      case 'low': 
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '🟢' };
      default: 
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '⚪' };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  const getTimeUntilDue = () => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600', bg: 'bg-red-50' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600', bg: 'bg-orange-50' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-blue-600', bg: 'bg-blue-50' };
    } else {
      return { text: `${diffDays} days left`, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const timeInfo = getTimeUntilDue();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Enhanced Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-lg text-gray-700">←</Text>
          </TouchableOpacity>
          
          <Text className="text-lg font-bold text-gray-900">Task Details</Text>
          
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-base">📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              className="w-10 h-10 bg-[#552BFF] rounded-xl items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-base">✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Main Task Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 overflow-hidden">
          {/* Completion Animation Overlay */}
          <Animated.View
            className="absolute inset-0 bg-green-500 items-center justify-center"
            style={{
              opacity: completionAnimation,
              transform: [{
                scale: completionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
            }}
          >
            <Text className="text-white text-6xl">✅</Text>
            <Text className="text-white text-xl font-bold mt-2">Completed!</Text>
          </Animated.View>

          {/* Status Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleToggleComplete}
                className={`w-8 h-8 rounded-full border-2 mr-3 items-center justify-center ${
                  task.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300 bg-white'
                }`}
                activeOpacity={0.8}
              >
                {task.completed && (
                  <Text className="text-white text-sm font-bold">✓</Text>
                )}
              </TouchableOpacity>
              
              <View className={`flex-row items-center px-3 py-2 rounded-xl border ${priorityConfig.bg} ${priorityConfig.border}`}>
                <Text className="mr-1">{priorityConfig.icon}</Text>
                <Text className={`text-sm font-semibold ${priorityConfig.text} capitalize`}>
                  {task.priority}
                </Text>
              </View>
            </View>

            <View className={`px-3 py-2 rounded-xl ${
              task.completed ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <Text className={`text-sm font-semibold ${
                task.completed ? 'text-green-700' : 'text-orange-700'
              }`}>
                {task.completed ? '✅ Done' : '⏳ Pending'}
              </Text>
            </View>
          </View>

          {/* Task Title */}
          <Text 
            className={`text-2xl font-bold mb-6 leading-8 ${
              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {task.title}
          </Text>

          {/* Description */}
          {task.description && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Text className="text-base">📝</Text>
                <Text className="text-lg font-semibold text-gray-900 ml-2">Description</Text>
              </View>
              <View className="bg-gray-50 rounded-2xl p-4">
                <Text className={`text-base leading-6 ${
                  task.completed ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  {task.description}
                </Text>
              </View>
            </View>
          )}

          {/* Due Date Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-base">⏰</Text>
              <Text className="text-lg font-semibold text-gray-900 ml-2">Due Date</Text>
            </View>
            
            <View className="bg-gray-50 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-medium text-gray-900">
                  📅 {formatDate(task.dueDate)}
                </Text>
                <Text className="text-base font-medium text-gray-600">
                  🕐 {formatTime(task.dueDate)}
                </Text>
              </View>
              
              <View className={`${timeInfo.bg} rounded-xl p-3 mt-2`}>
                <Text className={`text-sm font-semibold ${timeInfo.color} text-center`}>
                  {timeInfo.text}
                </Text>
              </View>
            </View>
          </View>

          {/* Metadata */}
          <View className="border-t border-gray-200 pt-6">
            <View className="flex-row justify-between">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm">📅</Text>
                  <Text className="text-sm font-medium text-gray-700 ml-1">Created</Text>
                </View>
                <Text className="text-sm text-gray-600">
                  {formatDate(task.createdAt)}
                </Text>
              </View>
              
              <View className="flex-1 ml-3">
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm">🔄</Text>
                  <Text className="text-sm font-medium text-gray-700 ml-1">Updated</Text>
                </View>
                <Text className="text-sm text-gray-600">
                  {formatDate(task.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleToggleComplete}
              className={`flex-row items-center p-4 rounded-2xl ${
                task.completed ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
              }`}
              activeOpacity={0.8}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                task.completed ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                <Text className="text-lg">
                  {task.completed ? '↩️' : '✅'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${
                  task.completed ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                </Text>
                <Text className={`text-sm ${
                  task.completed ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {task.completed ? 'Reopen this task' : 'Mark this task as done'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEdit}
              className="flex-row items-center p-4 rounded-2xl bg-blue-50 border border-blue-200"
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Text className="text-lg">✏️</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-blue-700">Edit Task</Text>
                <Text className="text-sm text-blue-600">Modify title, description, or due date</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="bg-white rounded-3xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Danger Zone</Text>
          
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-row items-center p-4 rounded-2xl bg-red-50 border border-red-200"
            activeOpacity={0.8}
          >
            <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
              <Text className="text-lg">🗑️</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-red-700">Delete Task</Text>
              <Text className="text-sm text-red-600">Permanently remove this task</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TaskDetailsScreen;