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
  Animated,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import BottomSheet, { BottomSheetView, BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
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
import { scale } from "@/src/utils/Responsive";

const { width: screenWidth } = Dimensions.get("window");

// Animated Task Card Component
const AnimatedTaskCard = React.memo(
  ({
    task,
    index,
    onPress,
    onToggleComplete,
    isLast,
  }: {
    task: Task;
    index: number;
    onPress: () => void;
    onToggleComplete: () => void;
    isLast: boolean;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      // Staggered animation with delay based on index
      const delay = index * 100; // 100ms delay between each item

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
        <TaskCard
          task={task}
          onPress={onPress}
          onToggleComplete={onToggleComplete}
          isLast={isLast}
        />
      </Animated.View>
    );
  }
);

// Animated Empty State Component
const AnimatedEmptyState = React.memo(({ filter }: { filter: TaskFilter }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
      className="items-center py-12"
    >
      <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Text className="text-3xl">📝</Text>
        </View>
        <Text className="text-gray-500 text-center text-lg mb-2 font-medium">
          {filter === "all"
            ? "No tasks for this date"
            : `No ${filter} tasks`}
        </Text>
        <Text className="text-gray-400 text-center text-sm">
          {filter === "all"
            ? "Tap the + button to create your first task"
            : "Try changing the filter or create a new task"}
        </Text>
      </View>
    </Animated.View>
  );
});

// Animated Filter Button Component
const AnimatedFilterButton = React.memo(
  ({
    option,
    isSelected,
    count,
    onPress,
    index,
  }: {
    option: { key: TaskFilter; label: string };
    isSelected: boolean;
    count: number;
    onPress: (key: TaskFilter) => void;
    index: number;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
      const delay = index * 50;
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index]);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => onPress(option.key)}
          className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
            isSelected ? "bg-[#552BFF]" : "bg-white border border-gray-300"
          }`}
          activeOpacity={0.7}
        >
          <View
            className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
              isSelected ? "bg-white bg-opacity-20" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isSelected ? "text-white" : "text-gray-600"
              }`}
            >
              {count}
            </Text>
          </View>
          <Text
            className={`text-sm font-medium ${
              isSelected ? "text-white" : "text-gray-700"
            }`}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

// Animated Calendar Day Component
const AnimatedCalendarDay = React.memo(
  ({
    date,
    dayName,
    isToday,
    isSelected,
    taskCount,
    onPress,
    index,
  }: {
    date: Date;
    dayName: string;
    isToday: boolean;
    isSelected: boolean;
    taskCount: number;
    onPress: (date: Date) => void;
    index: number;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-10)).current;

    useEffect(() => {
      const delay = index * 30;
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index]);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => onPress(date)}
          className="items-center mx-2"
          activeOpacity={0.7}
        >
          <Text className="text-sm text-gray-500 mb-2">{dayName}</Text>
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${
              isSelected
                ? "bg-[#552BFF]"
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
                  ? "text-[#552BFF]"
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
      </Animated.View>
    );
  }
);

// Animated Header Component
const AnimatedHeader = React.memo(
  ({
    selectedMonth,
    selectedYear,
    selectedDateFormatted,
    onPreviousWeek,
    onNextWeek,
  }: {
    selectedMonth: string;
    selectedYear: number;
    selectedDateFormatted: string;
    onPreviousWeek: () => void;
    onNextWeek: () => void;
  }) => {
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
        className="px-4 pt-6 pb-2"
      >
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
              onPress={onPreviousWeek}
              className="p-2 mr-1 rounded-full bg-gray-200"
              activeOpacity={0.7}
            >
              <Text className="text-xl text-gray-700">{"‹"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNextWeek}
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
      </Animated.View>
    );
  }
);

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading, filter, sort, error } = useSelector(
    (state: RootState) => state.tasks
  );

  // Animation trigger state
  const [animationKey, setAnimationKey] = useState(0);

  // Calendar and date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  });

  // Bottom sheet refs and state
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const snapPoints = useMemo(() => ["70%", "90%"], []);

  // Calendar scroll ref
  const calendarScrollRef = useRef<ScrollView>(null);

  // Get tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter((task) => {
      try {
        const taskDate = new Date(task.dueDate);
        return (
          !isNaN(taskDate.getTime()) &&
          taskDate.toDateString() === selectedDate.toDateString()
        );
      } catch {
        return false;
      }
    });
  }, [tasks, selectedDate]);

  // Calculate task counts for selected date
  const taskCounts = useMemo(() => {
    const total = tasksForSelectedDate.length;
    const completed = tasksForSelectedDate.filter((t) => t.completed).length;
    const incomplete = tasksForSelectedDate.filter((t) => !t.completed).length;

    return {
      all: total,
      completed,
      incomplete,
    };
  }, [tasksForSelectedDate]);

  // Filter tasks by selected date and applied filters
  const filteredAndSortedTasks = useMemo(() => {
    try {
      let filtered = tasksForSelectedDate;

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
      const sorted = [...filtered].sort((a, b) => {
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

      // Trigger animation when tasks change
      setAnimationKey(prev => prev + 1);
      
      return sorted;
    } catch (error) {
      console.error("Error filtering and sorting tasks:", error);
      return [];
    }
  }, [tasksForSelectedDate, filter, sort]);

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

  // Open modal
  const handleOpenBottomSheet = useCallback(() => {
    try {
      bottomSheetModalRef.current?.present();
    } catch (error) {
      console.error("Error opening bottom sheet:", error);
      router.push("/Tasks/AddEditTaskScreen");
    }
  }, []);

  // Close modal
  const handleCloseBottomSheet = useCallback(() => {
    try {
      bottomSheetModalRef.current?.dismiss();
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

  // Optimized render functions for timeline
  const renderTaskItem = useCallback(
    ({ item, index }: { item: Task; index: number }) => (
      <AnimatedTaskCard
        key={`${animationKey}-${item.id}`}
        task={item}
        index={index}
        onPress={() => handleTaskPress(item)}
        onToggleComplete={() => handleToggleComplete(item.id)}
        isLast={index === filteredAndSortedTasks.length - 1}
      />
    ),
    [handleTaskPress, handleToggleComplete, filteredAndSortedTasks.length, animationKey]
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
          contentContainerStyle={{ paddingBottom: scale(60) }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animated Header */}
          <AnimatedHeader
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedDateFormatted={selectedDateFormatted}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />

          {/* Animated Horizontally Scrollable Calendar Week View */}
          <ScrollView
            ref={calendarScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            className="mb-6 px-4"
            decelerationRate="normal"
            snapToInterval={56}
            snapToAlignment="start"
          >
            {calendarDays.map((dayData, index) => (
              <AnimatedCalendarDay
                key={`${dayData.date.toISOString()}-${index}`}
                date={dayData.date}
                dayName={dayData.dayName}
                isToday={dayData.isToday}
                isSelected={dayData.isSelected}
                taskCount={dayData.taskCount}
                onPress={handleDatePress}
                index={index}
              />
            ))}
          </ScrollView>

          {/* Animated Filter and Sort Controls */}
          <View className="px-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                <View className="flex-row">
                  {filterOptions.map((option, index) => (
                    <AnimatedFilterButton
                      key={`filter-${option.key}`}
                      option={option}
                      isSelected={filter === option.key}
                      count={taskCounts[option.key]}
                      onPress={handleFilterPress}
                      index={index}
                    />
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSortPress}
                className="px-3 py-2 bg-white border border-gray-500 rounded-lg ml-4"
                activeOpacity={0.7}
              >
                <Text className="text-xs text-gray-600">
                  Sort: {sort === "dueDate" ? "Date" : "Priority"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animated Tasks List with Timeline */}
          <View className="px-4 pb-6">
            {filteredAndSortedTasks.length === 0 ? (
              <AnimatedEmptyState filter={filter} />
            ) : (
              <View className="relative">
                {/* Timeline Container */}
                <FlatList
                  data={filteredAndSortedTasks}
                  renderItem={renderTaskItem}
                  keyExtractor={keyExtractor}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={8}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          onPress={handleOpenBottomSheet}
          className="absolute bottom-36 right-6 bg-[#552BFF] rounded-full items-center justify-center shadow-lg"
          style={{
            borderRadius: scale(30),
            width: scale(60),
            height: scale(60),
            elevation: 8,
            shadowColor: "#552BFF",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-3xl font-medium">+</Text>
        </TouchableOpacity>

        {/* Bottom Sheet Modal */}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              pressBehavior="close"
              opacity={0.5}
            />
          )}
          enablePanDownToClose={true}
          handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        >
          <BottomSheetView className="flex-1 px-4">
            <TaskForm
              onSubmit={handleTaskSubmit}
              onCancel={handleCloseBottomSheet}
              defaultDate={selectedDate}
            />
          </BottomSheetView>
        </BottomSheetModal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Dashboard;