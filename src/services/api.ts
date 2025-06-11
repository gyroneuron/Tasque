export const apiService = {
  async fetchTodos() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=20');
      if (!response.ok) throw new Error('Failed to fetch todos');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async fetchVideos() {
    try {
      const response = await fetch(
        'https://gist.githubusercontent.com/poudyalanil/ca84582cbeb4fc123a13290a586da925/raw/14a27bd0bcd0cd323b35ad79cf3b493dddf6216b/videos.json'
      );
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();

      // Handle array root response
      if (Array.isArray(data)) {
        return data.map((video: any) => ({
          id: video.title.replace(/\s+/g, '-').toLowerCase(),
          title: video.title,
          description: video.description,
          sources: video.sources,
          subtitle: video.subtitle,
          thumb: video.thumb,
          downloaded: false,
          downloadProgress: 0,
        }));
      }

      // Fallback for old structure
      if (
        data.categories &&
        Array.isArray(data.categories) &&
        data.categories[0] &&
        Array.isArray(data.categories[0].videos)
      ) {
        return data.categories[0].videos.map((video: any) => ({
          id: video.title.replace(/\s+/g, '-').toLowerCase(),
          title: video.title,
          description: video.description,
          sources: video.sources,
          subtitle: video.subtitle,
          thumb: video.thumb,
          downloaded: false,
          downloadProgress: 0,
        }));
      }

      console.error('Unexpected video API response structure:', data);
      return [];
    } catch (error) {
      console.error('Video API Error:', error);
      throw error;
    }
  },
};