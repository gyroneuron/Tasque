import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Video } from '@/src/types/index';

const TASKS_KEY = 'tasks';
const VIDEOS_KEY = 'videos';

export const storageService = {
  async getTasks(): Promise<Task[]> {
    try {
      const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
      return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  async getVideos(): Promise<Video[]> {
    try {
      const videosJson = await AsyncStorage.getItem(VIDEOS_KEY);
      return videosJson ? JSON.parse(videosJson) : [];
    } catch (error) {
      console.error('Error getting videos:', error);
      return [];
    }
  },

  async saveVideos(videos: Video[]): Promise<void> {
    try {
      await AsyncStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
    } catch (error) {
      console.error('Error saving videos:', error);
    }
  },
};