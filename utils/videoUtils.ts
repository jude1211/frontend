/**
 * Utility functions for handling video URLs and embedding
 */

export interface VideoPlatform {
  name: string;
  embedUrl: string;
  watchUrl: string;
}

/**
 * Converts various YouTube URL formats to embeddable format
 */
export const convertYouTubeUrlToEmbed = (url: string): string => {
  if (!url) return '';
  
  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&autoplay=0&controls=1`;
    }
  }

  return '';
};

/**
 * Extracts video ID from YouTube URL
 */
export const extractYouTubeVideoId = (url: string): string => {
  if (!url) return '';
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
};

/**
 * Validates if a URL is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return convertYouTubeUrlToEmbed(url) !== '';
};

/**
 * Gets the platform name from a video URL
 */
export const getVideoPlatform = (url: string): string => {
  if (isValidYouTubeUrl(url)) return 'YouTube';
  // Future: Add support for other platforms
  // if (isValidVimeoUrl(url)) return 'Vimeo';
  // if (isValidDailymotionUrl(url)) return 'Dailymotion';
  return 'Unknown';
};

/**
 * Converts any video URL to embeddable format
 */
export const convertToEmbedUrl = (url: string): string => {
  if (isValidYouTubeUrl(url)) {
    return convertYouTubeUrlToEmbed(url);
  }
  // Future: Add support for other platforms
  return '';
};
