export const isMobileDevice = () => {
    if (typeof window !== "undefined") {
      return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    return false;
  };
  
