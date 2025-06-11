import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Task } from "../types";
import { scale } from "../utils/Responsive";

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  defaultDate?: Date;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  defaultDate,
}) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(
    task ? new Date(task.dueDate) : defaultDate || new Date()
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task?.priority || "medium"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const TASK_COLORS = ["#FFF84E", "#FFA3FF", "#91F7FF", "#90FFA5", "#A5AAFF"];
  const [selectedColor, setSelectedColor] = useState<string>(
    task?.color || TASK_COLORS[0]
  );

  useEffect(() => {
    if (!task && defaultDate) {
      setDueDate(defaultDate);
    }
  }, [defaultDate, task]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (dueDate < new Date())
      newErrors.dueDate = "Due date cannot be in the past";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      priority,
      completed: task?.completed || false,
      color: selectedColor,
    };
    onSubmit(taskData);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Keep the time part from current dueDate
      const newDate = new Date(selectedDate);
      newDate.setHours(dueDate.getHours(), dueDate.getMinutes());
      setDueDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Keep the date part from current dueDate
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-green-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-red-500" },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.container}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            {task ? "Edit Task" : "Create New Task"}
          </Text>

          <TouchableOpacity
            onPress={onCancel}
            className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
          >
            <Text className="text-gray-600 text-lg">×</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ maxHeight: 420 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Task Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              className={`border rounded-lg px-3 py-3 text-base ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              returnKeyType="done"
              blurOnSubmit
            />
            {errors.title && (
              <Text className="text-red-500 text-xs mt-1">{errors.title}</Text>
            )}
          </View>

          {/* Description Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description"
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              textAlignVertical="top"
            />
          </View>

          {/* Due Date */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Due Date <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row space-x-2 " style={{ gap: scale(8) }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-3"
              >
                <Text className="text-base text-gray-900">
                  {dueDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-3"
              >
                <Text className="text-base text-gray-900">
                  {dueDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.dueDate && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.dueDate}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: "row", marginVertical: 12 }}>
            {TASK_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: color,
                  marginHorizontal: 6,
                  borderWidth: selectedColor === color ? 3 : 1,
                  borderColor: selectedColor === color ? "#333" : "#ccc",
                }}
              />
            ))}
          </View>

          {/* Priority */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Priority
            </Text>
            <View className="flex-row" style={{ gap: scale(8) }}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setPriority(option.value as any)}
                  className={`flex-1 flex-row items-center justify-center px-3 py-3 rounded-lg border ${
                    priority === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <View
                    className={`w-3 h-3 rounded-full mr-2 ${option.color}`}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      priority === option.value
                        ? "text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleSubmit}
            className="flex-1 bg-[#FCFCA4] rounded-2xl py-4 border border-gray-300 items-center justify-center"
          >
            <Text className="text-center text-black font-medium">
              {task ? "Update" : "Create"} Task
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dueDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    minHeight: 320,
    justifyContent: "flex-start",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
});
