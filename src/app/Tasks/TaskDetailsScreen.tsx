import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/src/store/index';
import { deleteTask, updateTask } from '@/src/store/slices/taskSlice';
import { formatDate, formatTime, getPriorityColor, isOverdue } from '@/src/utils/dateUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';


interface RouteParams {
  taskId: string;
}

const TaskDetailsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const router = useRouter();
  const params = useLocalSearchParams();
  
  const taskId = typeof params.taskId === 'string' ? params.taskId : '';
  const task = useSelector((state: RootState) =>
    state.tasks.tasks.find(t => t.id === taskId)
  );

  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View className="items-center px-6">
          <Text className="text-6xl mb-4">📋</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">Task not found</Text>
          <Text className="text-gray-500 text-center mb-6">
            The task you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    router.push({
      pathname: '/Tasks/AddEditTaskScreen',
      params: { taskId: task.id }
    })
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
              router.back();
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

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-800';
      case 'medium': return 'text-yellow-800';
      case 'low': return 'text-green-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Text className="text-lg text-gray-600">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Task Details</Text>
          <TouchableOpacity
            onPress={handleEdit}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Text className="text-lg">✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Task Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          {/* Status and Priority */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleToggleComplete}
                className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                  task.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}
              >
                {task.completed && (
                  <Text className="text-white text-sm">✓</Text>
                )}
              </TouchableOpacity>
              <View 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: priorityColor }}
              />
              <View className={`px-3 py-1 rounded-full ${getPriorityBgColor(task.priority)}`}>
                <Text className={`text-xs font-medium ${getPriorityTextColor(task.priority)} capitalize`}>
                  {task.priority} Priority
                </Text>
              </View>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              task.completed ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <Text className={`text-xs font-medium ${
                task.completed ? 'text-green-800' : 'text-orange-800'
              }`}>
                {task.completed ? 'Completed' : 'Pending'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text 
            className={`text-2xl font-bold mb-4 ${
              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {task.title}
          </Text>

          {/* Description */}
          {task.description && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
              <Text className={`text-base leading-6 ${
                task.completed ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {task.description}
              </Text>
            </View>
          )}

          {/* Due Date */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Due Date</Text>
            <View className="flex-row items-center flex-wrap">
              <Text className="text-base text-gray-900 mr-4">
                📅 {formatDate(task.dueDate)}
              </Text>
              <Text 
                className={`text-base mr-2 ${
                  overdue ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                🕐 {formatTime(task.dueDate)}
              </Text>
              {overdue && (
                <View className="bg-red-100 px-2 py-1 rounded-full">
                  <Text className="text-xs text-red-800 font-medium">Overdue</Text>
                </View>
              )}
            </View>
          </View>

          {/* Metadata */}
          <View className="border-t border-gray-200 pt-4">
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Created</Text>
                <Text className="text-sm text-gray-700">
                  {formatDate(task.createdAt)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Last Updated</Text>
                <Text className="text-sm text-gray-700">
                  {formatDate(task.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleToggleComplete}
            className={`rounded-xl py-4 ${
              task.completed ? 'bg-orange-600' : 'bg-green-600'
            }`}
          >
            <Text className="text-center text-white font-semibold text-lg">
              {task.completed ? '↩️ Mark as Incomplete' : '✅ Mark as Complete'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEdit}
            className="bg-blue-600 rounded-xl py-4"
          >
            <Text className="text-center text-white font-semibold text-lg">
              ✏️ Edit Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-600 rounded-xl py-4"
          >
            <Text className="text-center text-white font-semibold text-lg">
              🗑️ Delete Task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TaskDetailsScreen;