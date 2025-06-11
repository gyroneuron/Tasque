export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  author: string;
  duration: string;
  isLive: boolean;
  subscriber: string;
  thumbnailUrl: string;
  uploadTime: string;
  videoUrl: string;
  views: string;
  downloaded?: boolean;
  downloadProgress?: number;
  localPath?: string;
}

export type TaskFilter = 'all' | 'completed' | 'incomplete';
export type TaskSort = 'dueDate' | 'priority';