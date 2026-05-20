import { API_BASE_URL } from './api';

/**
 * Check if the user is authenticated
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export const checkAuthentication = async (): Promise<boolean> => {
  try {
    // Check if we have an adminId in localStorage
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      console.log("No adminId found in localStorage, user needs to log in");
      return false;
    }
    
    // Try direct fetch to avoid CORS issues
    const response = await fetch(`${API_BASE_URL}/admin/public/checklogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminId }),
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      console.error("Authentication check failed:", response.status);
      return false;
    }
    
    const data = await response.json();
    return data.ok || data.success || false;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

/**
 * Redirect to login page if not authenticated
 */
export const redirectIfNotAuthenticated = async (): Promise<boolean> => {
  const isAuthenticated = await checkAuthentication();
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login...");
    window.location.href = '/pages/auth/signin';
    return false;
  }
  
  return true;
};

/**
 * Get the admin ID from localStorage
 * @returns string | null - The admin ID or null if not found
 */
export const getAdminId = (): string | null => {
  return localStorage.getItem('adminId');
};

/**
 * Get the admin auth token from localStorage
 * @returns string | null - The admin auth token or null if not found
 */
export const getAdminAuthToken = (): string | null => {
  return localStorage.getItem('adminAuthToken');
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('adminId');
  localStorage.removeItem('adminAuthToken');
}; 