export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  sources: string[];
  subtitle: string;
  thumb: string;
  downloaded: boolean;
  downloadProgress?: number;
  localPath?: string;
}

export type TaskFilter = 'all' | 'completed' | 'incomplete';
export type TaskSort = 'dueDate' | 'priority';