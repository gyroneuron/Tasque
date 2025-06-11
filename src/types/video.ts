// src/types/video.ts

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

export interface DownloadedVideo {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnailUrl: string;
  uri: string;
  description: string;
  views: string;
  fileSize?: string;
  downloadDate?: string;
}

export interface StorageInfo {
  free: number;
  total: number;
}

export type SortBy = 'title' | 'author' | 'duration' | 'date' | 'views';
export type ActiveTab = 'online' | 'offline';

export interface VideoItemProps {
  item: Video;
  index: number;
  isDownloaded: boolean;
  isDownloading: boolean;
  progress: number;
  isOffline: boolean;
  onPlay: () => void;
  onDownload: () => void;
  onCancelDownload: () => void;
}

export interface DownloadedVideoItemProps {
  item: DownloadedVideo;
  index: number;
  onPlay: () => void;
  onDelete: () => void;
}

export interface EmptyStateProps {
  activeTab: ActiveTab;
  searchQuery: string;
  isOffline: boolean;
  onClearSearch: () => void;
  onOpenSettings: () => void;
}

export interface VideoPlayerProps {
  currentVideo: DownloadedVideo | null;
  isPlayerLoading: boolean;
  player: any;
  isFullscreen: boolean;
  onClose: () => void;
  onFullscreenEnter: () => void;
  onFullscreenExit: () => void;
}

export interface VideoHeaderProps {
  storageInfo: StorageInfo;
  showSearch: boolean;
  searchQuery: string;
  showLastSync: boolean;
  lastSyncTime: Date | null;
  isOffline: boolean;
  activeTab: ActiveTab;
  downloadedVideosCount: number;
  onToggleSearch: () => void;
  onToggleLastSync: () => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: ActiveTab) => void;
}