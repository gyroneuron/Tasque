import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addTask, updateTask } from '@/src/store/slices/taskSlice';
import { TaskForm } from '@/src/components/TaskForm';
import { Task } from '../../types';
import { useRouter, useLocalSearchParams } from 'expo-router';

const AddEditTaskScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useLocalSearchParams();

  const taskId = typeof params.taskId === 'string' ? params.taskId : undefined;
  const task = useSelector((state: RootState) => 
    taskId ? state.tasks.tasks.find(t => t.id === taskId) : undefined
  );

  const handleSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (task) {
        const updatedTask: Task = {
          ...task,
          ...taskData,
          updatedAt: new Date().toISOString(),
        };
        await dispatch(updateTask(updatedTask));
      } else {
        await dispatch(addTask(taskData));
      }
      router.back();
    } catch (error) {
      console.error('Error saving task:', error);
      // You could add error handling here, like showing an alert
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <TaskForm
        task={task}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
};

export default AddEditTaskScreen;