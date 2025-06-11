// src/screens/Dashboard.tsx
import React, {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootState, AppDispatch } from "@/src/store/index";
import {
  fetchInitialTasks,
  setFilter,
  setSort,
  toggleTaskStatus,
  updateTask,
  addTask,
} from "@/src/store/slices/taskSlice";
import { TaskCard } from "@/src/components/TaskCard";
import { LoadingSpinner } from "@/src/components/LoadingSpinner";
import { TaskForm } from "@/src/components/TaskForm";
import { Task, TaskFilter, TaskSort } from "@/src/types/index";
import { formatDate } from "@/src/utils/dateUtils";
import { router } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

// Memoized components for better performance
const MemoizedTaskCard = React.memo(TaskCard);
const MemoizedFilterButton = React.memo(
  ({
    option,
    isSelected,
    onPress,
  }: {
    option: { key: TaskFilter; label: string };
    isSelected: boolean;
    onPress: (key: TaskFilter) => void;
  }) => (
    <TouchableOpacity
      onPress={() => onPress(option.key)}
      className={`px-4 py-2 rounded-full mr-2 ${
        isSelected ? "bg-blue-600" : "bg-white border border-gray-300"
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-sm font-medium ${
          isSelected ? "text-white" : "text-gray-700"
        }`}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  )
);

const MemoizedCalendarDay = React.memo(
  ({
    date,
    dayName,
    isToday,
    isSelected,
    taskCount,
    onPress,
  }: {
    date: Date;
    dayName: string;
    isToday: boolean;
    isSelected: boolean;
    taskCount: number;
    onPress: (date: Date) => void;
  }) => (
    <TouchableOpacity
      onPress={() => onPress(date)}
      className="items-center mx-2"
      activeOpacity={0.7}
    >
      <Text className="text-sm text-gray-500 mb-2">{dayName}</Text>
      <View
        className={`w-12 h-12 rounded-full items-center justify-center ${
          isSelected
            ? "bg-[##552BFF]"
            : isToday
            ? "bg-purple-100 border-2 border-[#552BFF]"
            : "bg-gray-200"
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            isSelected
              ? "text-white"
              : isToday
              ? "text-[##552BFF]"
              : "text-gray-700"
          }`}
        >
          {date.getDate().toString().padStart(2, "0")}
        </Text>
      </View>
      {taskCount > 0 && (
        <View className="w-2 h-2 bg-orange-500 rounded-full mt-1" />
      )}
    </TouchableOpacity>
  )
);

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading, filter, sort, error } = useSelector(
    (state: RootState) => state.tasks
  );

  // Calendar and date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  });

  // Bottom sheet refs and state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  // Calendar scroll ref
  const calendarScrollRef = useRef<ScrollView>(null);

  // Memoized selectors for performance
  const taskStats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      pending: tasks.filter((t) => !t.completed).length,
    }),
    [tasks]
  );

  // Filter tasks by selected date and applied filters
  const filteredAndSortedTasks = useMemo(() => {
    try {
      let filtered = tasks;

      // Filter by selected date first
      const selectedDateString = selectedDate.toDateString();
      filtered = tasks.filter((task) => {
        try {
          const taskDate = new Date(task.dueDate);
          return (
            !isNaN(taskDate.getTime()) &&
            taskDate.toDateString() === selectedDateString
          );
        } catch {
          return false;
        }
      });

      // Apply status filter
      switch (filter) {
        case "completed":
          filtered = filtered.filter((task) => task.completed);
          break;
        case "incomplete":
          filtered = filtered.filter((task) => !task.completed);
          break;
        default:
          break;
      }

      // Apply sort with error handling
      return [...filtered].sort((a, b) => {
        try {
          if (sort === "dueDate") {
            const dateA = new Date(a.dueDate).getTime();
            const dateB = new Date(b.dueDate).getTime();

            // Handle invalid dates
            if (isNaN(dateA) || isNaN(dateB)) {
              return isNaN(dateA) ? 1 : -1;
            }

            return dateA - dateB;
          } else {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityA = priorityOrder[a.priority] || 0;
            const priorityB = priorityOrder[b.priority] || 0;
            return priorityB - priorityA;
          }
        } catch (error) {
          console.warn("Error sorting tasks:", error);
          return 0;
        }
      });
    } catch (error) {
      console.error("Error filtering and sorting tasks:", error);
      return [];
    }
  }, [tasks, filter, sort, selectedDate]);

  // Generate calendar days (extended range for horizontal scrolling)
  const calendarDays = useMemo(() => {
    try {
      const days = [];
      const totalDays = 42; // 6 weeks worth of days for smooth scrolling

      for (let i = 0; i < totalDays; i++) {
        const date = new Date(calendarStartDate);
        date.setDate(calendarStartDate.getDate() + i);

        const dayTasks = tasks.filter((task) => {
          try {
            const taskDate = new Date(task.dueDate);
            return (
              !isNaN(taskDate.getTime()) &&
              taskDate.toDateString() === date.toDateString()
            );
          } catch {
            return false;
          }
        });

        const today = new Date();
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          date.getDay()
        ];

        days.push({
          date: new Date(date),
          dayName,
          isToday: date.toDateString() === today.toDateString(),
          isSelected: date.toDateString() === selectedDate.toDateString(),
          taskCount: dayTasks.length,
        });
      }

      return days;
    } catch (error) {
      console.error("Error generating calendar days:", error);
      return [];
    }
  }, [calendarStartDate, tasks, selectedDate]);

  const filterOptions: { key: TaskFilter; label: string }[] = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "incomplete", label: "Incomplete" },
      { key: "completed", label: "Completed" },
    ],
    []
  );

  // Get current month and year from selected date
  const selectedMonth = selectedDate.toLocaleDateString("en-US", {
    month: "short",
  });
  const selectedYear = selectedDate.getFullYear();
  const selectedDateFormatted = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Optimized callbacks
  const handleDatePress = useCallback(
    (date: Date) => {
      try {
        setSelectedDate(new Date(date));

        // Auto-scroll calendar if selected date is getting close to edges
        const selectedIndex = calendarDays.findIndex(
          (day) => day.date.toDateString() === date.toDateString()
        );

        if (selectedIndex !== -1) {
          const dayWidth = 56; // Approximate width of each day
          const scrollPosition = Math.max(0, (selectedIndex - 3) * dayWidth);

          calendarScrollRef.current?.scrollTo({
            x: scrollPosition,
            animated: true,
          });
        }

        // Update calendar range if selected date is too far from current range
        const daysDiff = Math.abs(
          (date.getTime() - calendarStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff > 35) {
          const newStartDate = new Date(date);
          newStartDate.setDate(date.getDate() - 7); // Show a week before selected date
          setCalendarStartDate(newStartDate);
        }
      } catch (error) {
        console.error("Error handling date press:", error);
        Alert.alert("Error", "Failed to select date. Please try again.");
      }
    },
    [calendarDays, calendarStartDate]
  );

  const handleTaskPress = useCallback((task: Task) => {
    try {
      router.push({
        pathname: "/Tasks/TaskDetailsScreen",
        params: { taskId: task.id },
      });
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Failed to open task details. Please try again.");
    }
  }, []);

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      try {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) {
          Alert.alert("Error", "Task not found");
          return;
        }

        const updatedTask = {
          ...task,
          completed: !task.completed,
          updatedAt: new Date().toISOString(),
        };

        await dispatch(updateTask(updatedTask)).unwrap();
      } catch (error) {
        console.error("Error toggling task completion:", error);
        Alert.alert("Error", "Failed to update task. Please try again.");
      }
    },
    [tasks, dispatch]
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchInitialTasks());
  }, [dispatch]);

  const handleFilterPress = useCallback(
    (filterKey: TaskFilter) => {
      dispatch(setFilter(filterKey));
    },
    [dispatch]
  );

  const handleSortPress = useCallback(() => {
    dispatch(setSort(sort === "dueDate" ? "priority" : "dueDate"));
  }, [dispatch, sort]);

  const handleOpenBottomSheet = useCallback(() => {
    try {
      bottomSheetRef.current?.expand();
      setIsBottomSheetOpen(true);
    } catch (error) {
      console.error("Error opening bottom sheet:", error);
      // Fallback to navigation
      router.push("/Tasks/AddEditTaskScreen");
    }
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    try {
      bottomSheetRef.current?.close();
      setIsBottomSheetOpen(false);
    } catch (error) {
      console.error("Error closing bottom sheet:", error);
    }
  }, []);

  const handleBottomSheetChange = useCallback((index: number) => {
    setIsBottomSheetOpen(index > -1);
  }, []);

  const handleTaskSubmit = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      try {
        // Set the due date to selected date if not specified
        const taskWithDate = {
          ...taskData,
          dueDate: taskData.dueDate || selectedDate.toISOString(),
        };

        await dispatch(addTask(taskWithDate)).unwrap();
        handleCloseBottomSheet();
        Alert.alert("Success", "Task created successfully!");
      } catch (error) {
        console.error("Error creating task:", error);
        Alert.alert("Error", "Failed to create task. Please try again.");
      }
    },
    [dispatch, handleCloseBottomSheet, selectedDate]
  );

  // Navigation helpers for calendar
  const handlePreviousWeek = useCallback(() => {
    const newStartDate = new Date(calendarStartDate);
    newStartDate.setDate(calendarStartDate.getDate() - 7);
    setCalendarStartDate(newStartDate);
  }, [calendarStartDate]);

  const handleNextWeek = useCallback(() => {
    const newStartDate = new Date(calendarStartDate);
    newStartDate.setDate(calendarStartDate.getDate() + 7);
    setCalendarStartDate(newStartDate);
  }, [calendarStartDate]);

  // Optimized render functions
  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <MemoizedTaskCard
        task={item}
        onPress={() => handleTaskPress(item)}
        onToggleComplete={() => handleToggleComplete(item.id)}
      />
    ),
    [handleTaskPress, handleToggleComplete]
  );

  const keyExtractor = useCallback((item: Task) => `task-${item.id}`, []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 120, // Approximate height of TaskCard
      offset: 120 * index,
      index,
    }),
    []
  );

  // Effects
  useEffect(() => {
    dispatch(fetchInitialTasks());
  }, [dispatch]);

  // Error handling
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  // Auto-scroll to today on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayIndex = calendarDays.findIndex((day) => day.isToday);
      if (todayIndex !== -1 && calendarScrollRef.current) {
        const dayWidth = 56;
        const scrollPosition = Math.max(0, (todayIndex - 3) * dayWidth);
        calendarScrollRef.current.scrollTo({
          x: scrollPosition,
          animated: false,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [calendarDays]);

  if (loading && tasks.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
              colors={["#2563eb"]}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-4 pt-6 pb-2">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row gap-2">
                <Text className="text-3xl font-bold text-[#552BFF]">
                  {selectedMonth}
                </Text>
                <Text className="text-3xl font-bold text-[#84848A]">
                  {selectedYear}
                </Text>
              </View>
              {/* Calendar navigation arrows */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handlePreviousWeek}
                  className="p-2 mr-1 rounded-full bg-gray-200"
                  activeOpacity={0.7}
                >
                  <Text className="text-xl text-gray-700">{"‹"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextWeek}
                  className="p-2 ml-1 rounded-full bg-gray-200"
                  activeOpacity={0.7}
                >
                  <Text className="text-xl text-gray-700">{"›"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-lg text-[#84848A] mb-4 font-semibold">
              {selectedDateFormatted}
            </Text>

            {/* Horizontally Scrollable Calendar Week View */}
            <ScrollView
              ref={calendarScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              className="mb-6"
              decelerationRate="normal"
              snapToInterval={56} // Width of each day for smoother scrolling
              snapToAlignment="start"
            >
              {calendarDays.map((dayData, index) => (
                <MemoizedCalendarDay
                  key={`${dayData.date.toISOString()}-${index}`}
                  date={dayData.date}
                  dayName={dayData.dayName}
                  isToday={dayData.isToday}
                  isSelected={dayData.isSelected}
                  taskCount={dayData.taskCount}
                  onPress={handleDatePress}
                />
              ))}
            </ScrollView>
          </View>

          {/* Filter and Sort Controls */}
          <View className="px-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                <View className="flex-row">
                  {filterOptions.map((option) => (
                    <MemoizedFilterButton
                      key={`filter-${option.key}`}
                      option={option}
                      isSelected={filter === option.key}
                      onPress={handleFilterPress}
                    />
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSortPress}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-xs text-gray-600">
                  Sort: {sort === "dueDate" ? "Date" : "Priority"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Task Stats for Selected Date */}
            <View className="flex-row justify-between bg-white rounded-xl p-4 shadow-sm">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedTasks.length +
                    tasks
                      .filter((t) => {
                        try {
                          const taskDate = new Date(t.dueDate);
                          return (
                            taskDate.toDateString() ===
                            selectedDate.toDateString()
                          );
                        } catch {
                          return false;
                        }
                      })
                      .filter((t) => t.completed).length}
                </Text>
                <Text className="text-sm text-gray-500">Total</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {
                    tasks.filter((t) => {
                      try {
                        const taskDate = new Date(t.dueDate);
                        return (
                          taskDate.toDateString() ===
                            selectedDate.toDateString() && t.completed
                        );
                      } catch {
                        return false;
                      }
                    }).length
                  }
                </Text>
                <Text className="text-sm text-gray-500">Completed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">
                  {
                    tasks.filter((t) => {
                      try {
                        const taskDate = new Date(t.dueDate);
                        return (
                          taskDate.toDateString() ===
                            selectedDate.toDateString() && !t.completed
                        );
                      } catch {
                        return false;
                      }
                    }).length
                  }
                </Text>
                <Text className="text-sm text-gray-500">Pending</Text>
              </View>
            </View>
          </View>

          {/* Tasks List for Selected Date */}
          <View className="px-4 pb-6">
            {/* <Text className="text-lg font-semibold text-gray-900 mb-3">
              Tasks for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text> */}

            {filteredAndSortedTasks.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-gray-500 text-center text-lg mb-2">
                  {filter === "all"
                    ? "No tasks"
                    : `No ${filter} tasks for this date`}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredAndSortedTasks}
                renderItem={renderTaskItem}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          onPress={handleOpenBottomSheet}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#552BFF] rounded-full items-center justify-center shadow-lg"
          style={{
            elevation: 8,
            shadowColor: "#552BFF",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>

        {/* Bottom Sheet Modal */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleBottomSheetChange}
          enablePanDownToClose={true}
          backgroundStyle={{ backgroundColor: "#f9fafb" }}
          handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        >
          <BottomSheetView className="flex-1 px-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Create New Task
              </Text>
              <TouchableOpacity
                onPress={handleCloseBottomSheet}
                className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
              >
                <Text className="text-gray-600 text-lg">×</Text>
              </TouchableOpacity>
            </View>

            <TaskForm
              onSubmit={handleTaskSubmit}
              onCancel={handleCloseBottomSheet}
              defaultDate={selectedDate}
            />
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Dashboard;
