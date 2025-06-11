import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from '../types';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task ? new Date(task.dueDate) : new Date());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (dueDate < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      priority,
      completed: task?.completed || false,
    };

    onSubmit(taskData);
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-xl p-6 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          {task ? 'Edit Task' : 'Create New Task'}
        </Text>

        {/* Title Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            className={`border rounded-lg px-3 py-3 text-base ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
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
          <View className="flex-row space-x-2">
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
                {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.dueDate && (
            <Text className="text-red-500 text-xs mt-1">{errors.dueDate}</Text>
          )}
        </View>

        {/* Priority */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Priority
          </Text>
          <View className="flex-row space-x-2">
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setPriority(option.value as any)}
                className={`flex-1 flex-row items-center justify-center px-3 py-3 rounded-lg border ${
                  priority === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <View className={`w-3 h-3 rounded-full mr-2 ${option.color}`} />
                <Text
                  className={`text-sm font-medium ${
                    priority === option.value ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 bg-gray-200 rounded-lg py-3"
          >
            <Text className="text-center text-gray-700 font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            className="flex-1 bg-blue-600 rounded-lg py-3"
          >
            <Text className="text-center text-white font-medium">
              {task ? 'Update' : 'Create'} Task
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setDueDate(selectedTime);
            }
          }}
        />
      )}
    </ScrollView>
  );
};
