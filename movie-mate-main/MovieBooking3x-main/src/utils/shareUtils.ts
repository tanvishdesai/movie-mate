/**
 * Utilities for sharing content across different devices and browsers
 */

// Check if the Web Share API is available
export const isWebShareAvailable = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

// Use the native Web Share API if available, otherwise fallback to our custom modal
export const shareContent = async (
  title: string,
  text: string,
  url: string,
  onFallback: () => void
): Promise<boolean> => {
  if (isWebShareAvailable()) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      console.error('Error sharing via Web Share API:', error);
      // If user cancelled or sharing failed, show our custom modal
      onFallback();
      return false;
    }
  } else {
    // Fallback to custom share modal
    onFallback();
    return false;
  }
};

// Generate social media sharing URLs
export const generateSharingUrls = (title: string, url: string, description?: string) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = description ? encodeURIComponent(description) : encodedTitle;
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedDescription} ${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription} ${encodedUrl}`,
  };
};

export default {
  isWebShareAvailable,
  shareContent,
  generateSharingUrls,
}; 