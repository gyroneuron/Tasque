import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/src/store/index';
import {
  fetchInitialTasks,
  setFilter,
  setSort,
  toggleTaskStatus,
  updateTask,
} from '@/src/store/slices/taskSlice';
import { TaskCard } from '@/src/components/TaskCard';
import { LoadingSpinner } from '@/src/components/LoadingSpinner';
import { Task, TaskFilter, TaskSort } from '@/src/types/index';
import { formatDate } from '@/src/utils/dateUtils';
import { router } from 'expo-router';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading, filter, sort } = useSelector((state: RootState) => state.tasks);

  useEffect(() => {
    dispatch(fetchInitialTasks());
  }, [dispatch]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply filter
    switch (filter) {
      case 'completed':
        filtered = tasks.filter(task => task.completed);
        break;
      case 'incomplete':
        filtered = tasks.filter(task => !task.completed);
        break;
      default:
        filtered = tasks;
    }

    // Apply sort - create a copy first to avoid mutating read-only array
    return [...filtered].sort((a, b) => {
      if (sort === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    });
  }, [tasks, filter, sort]);

  const handleTaskPress = (task: Task) => {
    router.push({ 
      pathname: '/Tasks/TaskDetailsScreen', 
      params: { taskId: task.id } 
    });
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        completed: !task.completed,
        updatedAt: new Date().toISOString(),
      };
      dispatch(updateTask(updatedTask));
    }
  };

  const handleRefresh = () => {
    dispatch(fetchInitialTasks());
  };

  const filterOptions: { key: TaskFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'incomplete', label: 'Incomplete' },
    { key: 'completed', label: 'Completed' },
  ];

  const today = new Date();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'short' });
  const currentYear = today.getFullYear();

  // Generate week days for calendar
  const getWeekDays = () => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading && tasks.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold text-blue-600">{currentMonth}</Text>
              <Text className="text-3xl font-bold text-gray-400">{currentYear}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/Tasks/AddEditTaskScreen')}
              className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg"
            >
              <Text className="text-white text-2xl font-light">+</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-lg text-gray-600 mb-4">
            {today.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>

          {/* Calendar Week View */}
          <View className="flex-row justify-between mb-6">
            {weekDays.map((date, index) => {
              const isToday = date.toDateString() === today.toDateString();
              const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.dueDate);
                return taskDate.toDateString() === date.toDateString();
              });
              
              return (
                <View key={`${date.toDateString()}-${index}`} className="items-center">
                  <Text className="text-sm text-gray-500 mb-2">{dayNames[index]}</Text>
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isToday ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isToday ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {date.getDate().toString().padStart(2, '0')}
                    </Text>
                  </View>
                  {dayTasks.length > 0 && (
                    <View className="w-1 h-1 bg-blue-600 rounded-full mt-1" />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Filter and Sort Controls */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2">
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={`filter-${option.key}`}
                    onPress={() => dispatch(setFilter(option.key))}
                    className={`px-4 py-2 rounded-full ${
                      filter === option.key
                        ? 'bg-blue-600'
                        : 'bg-white border border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        filter === option.key ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => dispatch(setSort(sort === 'dueDate' ? 'priority' : 'dueDate'))}
              className="ml-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
            >
              <Text className="text-xs text-gray-600">
                Sort: {sort === 'dueDate' ? 'Date' : 'Priority'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Task Stats */}
          <View className="flex-row justify-between bg-white rounded-xl p-4 shadow-sm">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {tasks.length}
              </Text>
              <Text className="text-sm text-gray-500">Total</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.completed).length}
              </Text>
              <Text className="text-sm text-gray-500">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-orange-600">
                {tasks.filter(t => !t.completed).length}
              </Text>
              <Text className="text-sm text-gray-500">Pending</Text>
            </View>
          </View>
        </View>

        {/* Tasks List */}
        <View className="px-4 pb-6">
          {filteredAndSortedTasks.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 text-center text-lg mb-2">
                {filter === 'all' ? 'No tasks found' : `No ${filter} tasks`}
              </Text>
              <Text className="text-gray-400 text-center mb-4">
                {filter === 'all' 
                  ? 'Create your first task to get started' 
                  : `You have no ${filter} tasks at the moment`
                }
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  onPress={() => router.push('/Tasks/AddEditTaskScreen')}
                  className="bg-blue-600 px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-medium">Create Your First Task</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={`task-${task.id}`}
                task={task}
                onPress={() => handleTaskPress(task)}
                onToggleComplete={() => handleToggleComplete(task.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Dashboard;