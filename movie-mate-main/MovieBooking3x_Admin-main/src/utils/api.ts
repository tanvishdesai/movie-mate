/**
 * API utility functions for making requests to the backend
 */

// API base URL from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:8000';

/**
 * Make an API request with standard options and error handling
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Use public endpoints to avoid CORS issues with auth endpoints
    let finalEndpoint = endpoint;
    const adminId = localStorage.getItem('adminId');

    // Authentication endpoints
    if (endpoint === endpoints.login) {
      finalEndpoint = '/admin/public/login';
      console.log('Using public login endpoint to avoid CORS issues');
      
      // For login requests, ensure the body is properly formatted
      if (options.body && typeof options.body === 'string') {
        try {
          const parsedBody = JSON.parse(options.body);
          console.log('Login request body:', parsedBody);
          
          // Ensure email and password are present
          if (!parsedBody.email || !parsedBody.password) {
            console.error('Missing email or password in login request');
          }
        } catch (e) {
          console.error('Error parsing request body:', e);
        }
      }
    } else if (endpoint === endpoints.checkLogin) {
      finalEndpoint = '/admin/public/checklogin';
      console.log('Using public checklogin endpoint to avoid CORS issues');
      
      // For checklogin, we need to use POST and include the adminId from localStorage
      if (adminId) {
        options.method = 'POST';
        options.body = JSON.stringify({ adminId });
        console.log('Including adminId in checklogin request:', adminId);
      } else {
        console.warn('No adminId found in localStorage for checklogin request');
      }
    } 
    // Movie management endpoints
    else if (endpoint === endpoints.getAllMovies) {
      finalEndpoint = '/movie/public/admin/movies';
      console.log('Using public movies endpoint to avoid CORS issues');
      
      // Convert to POST and include adminId
      if (adminId) {
        options.method = 'POST';
        options.body = JSON.stringify({ adminId });
      } else {
        console.warn('No adminId found in localStorage for movies request');
      }
    } else if (endpoint === endpoints.createMovie) {
      finalEndpoint = '/movie/public/admin/createmovie';
      console.log('Using public create movie endpoint to avoid CORS issues');
      
      // Include adminId in the request body
      if (adminId && options.body && typeof options.body === 'string') {
        try {
          const parsedBody = JSON.parse(options.body);
          options.body = JSON.stringify({ ...parsedBody, adminId });
        } catch (e) {
          console.error('Error parsing request body:', e);
        }
      } else {
        console.warn('No adminId found in localStorage for create movie request');
      }
    } else if (endpoint.includes('/movie/deletemovie/')) {
      const movieId = endpoint.split('/').pop();
      finalEndpoint = `/movie/public/admin/deletemovie/${movieId}`;
      console.log('Using public delete movie endpoint to avoid CORS issues');
      
      // Convert to POST and include adminId
      if (adminId) {
        options.method = 'POST';
        options.body = JSON.stringify({ adminId });
      } else {
        console.warn('No adminId found in localStorage for delete movie request');
      }
    }
    // Screen management endpoints
    else if (endpoint === endpoints.getAllScreens) {
      finalEndpoint = '/movie/public/admin/screens';
      console.log('Using public screens endpoint to avoid CORS issues');
      
      // Convert to POST and include adminId
      if (adminId) {
        options.method = 'POST';
        options.body = JSON.stringify({ adminId });
      } else {
        console.warn('No adminId found in localStorage for screens request');
      }
    }
    // Schedule management endpoints
    else if (endpoint === endpoints.getAllSchedules) {
      finalEndpoint = '/movie/public/admin/schedules';
      console.log('Using public schedules endpoint to avoid CORS issues');
      
      // Convert to POST and include adminId
      if (adminId) {
        options.method = 'POST';
        options.body = JSON.stringify({ adminId });
      } else {
        console.warn('No adminId found in localStorage for schedules request');
      }
    }
    
    // Add cache control headers for auth endpoints to prevent caching
    const isAuthEndpoint = endpoint.includes('/admin/login') || 
                           endpoint.includes('/admin/logout') || 
                           endpoint.includes('/admin/checklogin') ||
                           endpoint.includes('/admin/register');
    const authHeaders: Record<string, string> = isAuthEndpoint ? {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } : {};
    
    // For public endpoints, don't include credentials as they might cause CORS issues
    const isPublicEndpoint = finalEndpoint.includes('/public/');
    const credentials = isPublicEndpoint ? 'omit' : 'include';
    
    // Add authorization header if token is available
    const adminAuthToken = localStorage.getItem('adminAuthToken');
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth headers for non-public endpoints
    if (!isPublicEndpoint && authHeaders) {
      headers = { ...headers, ...authHeaders };
    }

    // Add any headers from options
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      headers = { ...headers, ...optionHeaders };
    }

    // Add Authorization header if token is available
    if (adminAuthToken) {
      headers['Authorization'] = `Bearer ${adminAuthToken}`;
    }
    
    // Ensure credentials are included for authentication
    const requestOptions: RequestInit = {
      ...options,
      credentials: credentials as RequestCredentials,
      headers,
      mode: 'cors', // Explicitly set CORS mode
    };

    // Log the request for debugging
    console.log(`API Request: ${finalEndpoint} (Public: ${isPublicEndpoint})`);
    
    const url = `${API_BASE_URL}${finalEndpoint}`;
    console.log('Full URL:', url);
    
    try {
      const response = await fetch(url, requestOptions);
      
      console.log(`API Response status: ${response.status} for ${finalEndpoint}`);
      
      // Parse the response
      if (response.ok) {
        if (response.status === 204) {
          return { success: true }; // No content
        }
        
        try {
          const data = await response.json();
          
          // Normalize response for consistent handling
          // Some APIs might use 'status' instead of 'success', or return an array
          if (Array.isArray(data)) {
            return { success: true, data };
          } else if (typeof data === 'object') {
            // If response has no explicit success flag but request was successful,
            // add a success flag for consistent handling
            if (data.success === undefined && data.status === undefined) {
              return { ...data, success: true };
            }
            // If response uses 'status: "success"' format, normalize to success: true
            else if (data.status === 'success') {
              return { ...data, success: true };
            }
          }
          
          return data;
        } catch (error) {
          console.error('Error parsing response JSON:', error);
          // Even if JSON parsing fails, since response was ok, return success
          return { success: true };
        }
      } else {
        // Try to get error details from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `API request failed with status ${response.status}`);
        } catch (parseError) {
          throw new Error(`API request failed with status ${response.status}`);
        }
      }
    } catch (fetchError: any) {
      // Handle network errors, CORS errors, etc.
      if (fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError') {
        console.error('Network or CORS error:', fetchError);
        throw new Error(`Network error: Please check if the backend server is running at ${API_BASE_URL} and CORS is properly configured. Original error: ${fetchError.message}`);
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Common API endpoints
 */
export const endpoints = {
  // Authentication
  login: '/admin/login',
  checkLogin: '/admin/checklogin',
  logout: '/admin/logout',
  register: '/admin/register',
  
  // Movies - using correct endpoints
  getAllMovies: '/movie/movies',
  createMovie: '/movie/createmovie',
  deleteMovie: (id: string) => `/movie/deletemovie/${id}`,
  updateMovie: (id: string) => `/movie/movies/${id}`,
  
  // Screens
  getAllScreens: '/movie/screens',
  getScreensByCity: (city: string) => `/movie/screensbycity/${city.toLowerCase()}`,
  getScreensByMovieSchedule: (city: string, date: string, movieId: string) => 
    `/movie/screensbymovieschedule/${city.toLowerCase()}/${date}/${movieId}`,
  
  // Schedules - specific schedule endpoints
  getAllSchedules: '/movie/schedules',
  getSchedulesByMovie: (screenId: string, date: string, movieId: string) => 
    `/movie/schedulebymovie/${screenId}/${date}/${movieId}`,
  
  // Images
  uploadImage: '/image/uploadimage',
};