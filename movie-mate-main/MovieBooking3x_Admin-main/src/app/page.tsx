"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { 
  AiOutlineVideoCamera, 
  AiOutlineCalendar, 
  AiOutlinePlus,
  AiOutlineEye
} from 'react-icons/ai';

interface DashboardStats {
  totalMovies: number;
  totalScreens: number;
  totalSchedules: number;
  recentMovies: {
    _id: string;
    title: string;
    createdAt: string;
  }[];
}

// Add interface for movie type
interface Movie {
  _id: string;
  title: string;
  createdAt: string;
  [key: string]: any; // Allow for other properties
}

// Add interface for various API response formats
interface ApiResponse {
  movies?: any[];
  screens?: any[];
  schedules?: any[];
  data?: any[];
  [key: string]: any;
}

// Add interface for screen type with movieSchedules
interface Screen {
  _id: string;
  name: string;
  location: string;
  city: string;
  screenType: string;
  movieSchedules: MovieSchedule[];
  [key: string]: any;
}

// Add interface for movie schedule type
interface MovieSchedule {
  movieId: string;
  showTime: string;
  showDate: string;
  notAvailableSeats?: string[];
  [key: string]: any;
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalMovies: 0,
    totalScreens: 0,
    totalSchedules: 0,
    recentMovies: []
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('Checking authentication for dashboard...');
        console.log('API URL:', API_BASE_URL);
        
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(error => {
          console.error('Auth check failed:', error.message);
          return null;
        });
        
        console.log('Dashboard auth check response:', response);
        
        // Check for various success response formats
        if (response && (response.success || response.status === 'success' || (response.admin && response.admin.name))) {
          console.log('Authentication successful for dashboard');
          setIsAuthenticated(true);
          // Don't fetch stats here - we'll do it in a separate useEffect
        } else {
          console.log('Authentication failed for dashboard, redirecting to login');
          // Use direct window.location for more reliable redirection
          window.location.href = '/pages/auth/signin';
          return; // Prevent further execution
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Use direct window.location for more reliable redirection
        window.location.href = '/pages/auth/signin';
        return; // Prevent further execution
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);
  
  // Separate useEffect for data fetching - only runs when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !checkingAuth) {
      fetchDashboardStats();
    }
  }, [isAuthenticated, checkingAuth]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard stats...');
      
      // Fetch movies
      console.log('Fetching movies for dashboard...');
      let movies = [];
      
      try {
        const moviesResponse = await apiRequest(endpoints.getAllMovies, {
          method: 'GET'
        });
        
        console.log('Movies API response:', moviesResponse);
        
        if (Array.isArray(moviesResponse)) {
          movies = moviesResponse;
        } else if (moviesResponse.data && Array.isArray(moviesResponse.data)) {
          movies = moviesResponse.data;
        } else if (moviesResponse.movies && Array.isArray(moviesResponse.movies)) {
          movies = moviesResponse.movies;
        } else {
          console.error('Unexpected movies response format:', moviesResponse);
        }
        
        console.log(`Successfully fetched ${movies.length} movies`);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
      
      // Fetch screens - use the direct endpoint
      console.log('Fetching screens for dashboard...');
      let screens = [];
      
      try {
        // Try to fetch all screens directly
        const screensResponse = await apiRequest(endpoints.getAllScreens, {
          method: 'GET'
        }).catch(error => {
          console.error('Failed to fetch screens:', error);
          return null;
        });
        
        console.log('Screens API response:', screensResponse);
        
        if (screensResponse && Array.isArray(screensResponse)) {
          screens = screensResponse;
          console.log(`Successfully fetched ${screens.length} screens`);
        } else if (screensResponse && screensResponse.data && Array.isArray(screensResponse.data)) {
          screens = screensResponse.data;
          console.log(`Successfully fetched ${screens.length} screens`);
        } else if (screensResponse && screensResponse.ok && screensResponse.data) {
          screens = screensResponse.data;
          console.log(`Successfully fetched ${screens.length} screens`);
        } else {
          console.error('Unexpected screens response format or no screens found:', screensResponse);
        }
      } catch (error) {
        console.error('Failed to fetch screens:', error);
      }
      
      // Fetch schedules - try direct endpoint
      console.log('Fetching all schedules...');
      let schedules = [];
      
      try {
        // First try the direct getAllSchedules endpoint
        const schedulesResponse = await apiRequest(endpoints.getAllSchedules, {
          method: 'GET'
        }).catch(error => {
          console.log('Direct schedules endpoint failed, will extract from screens:', error.message);
          return null;
        });
        
        console.log('Schedules API response:', schedulesResponse);
        
        // Check if we got schedules directly
        if (schedulesResponse && Array.isArray(schedulesResponse)) {
          schedules = schedulesResponse;
          console.log(`Successfully fetched ${schedules.length} schedules from direct endpoint`);
        } else if (schedulesResponse && schedulesResponse.data && Array.isArray(schedulesResponse.data)) {
          schedules = schedulesResponse.data;
          console.log(`Successfully fetched ${schedules.length} schedules from direct endpoint`);
        } else if (schedulesResponse && schedulesResponse.ok && schedulesResponse.data) {
          schedules = schedulesResponse.data;
          console.log(`Successfully fetched ${schedules.length} schedules from direct endpoint`);
        }
        
        // If direct endpoint didn't work, extract from screens
        if (schedules.length === 0 && screens.length > 0) {
          console.log('Falling back to extracting schedules from screens data...');
          
          // Extract all schedules from screens without date filtering
          screens.forEach((screen: Screen) => {
            if (screen.movieSchedules && Array.isArray(screen.movieSchedules)) {
              // Add screen information to each schedule for context
              const screenSchedules = screen.movieSchedules.map((schedule: MovieSchedule) => ({
                ...schedule,
                screenId: screen._id,
                screenName: screen.name,
                screenLocation: screen.location,
                screenCity: screen.city
              }));
              
              schedules.push(...screenSchedules);
            }
          });
          
          console.log(`Extracted ${schedules.length} total schedules from screens data`);
        }
        
        if (schedules.length === 0) {
          console.warn('No schedules found from any source');
        }
      } catch (error) {
        console.error('Failed to process schedules data:', error);
      }
      
      console.log(`Dashboard stats summary: ${movies.length} movies, ${screens.length} total screens, ${schedules.length} total schedules`);
      
      // Sort movies by creation date to get the most recent ones
      const sortedMovies = [...movies].sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      
      setStats({
        totalMovies: movies.length,
        totalScreens: screens.length, // Use total screens count instead of active screens
        totalSchedules: schedules.length,
        recentMovies: sortedMovies.slice(0, 5).map((movie: any) => ({
          _id: movie._id || '',
          title: movie.title || '',
          createdAt: movie.createdAt || ''
        }))
      });
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Display loading indicator while checking authentication
  if (checkingAuth) {
    return <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>;
  }
  
  // Should never see this since we redirect, but just in case
  if (!isAuthenticated) {
    return <div className="dashboard-loading">
      <p>Please log in to access the dashboard</p>
      <Link href="/pages/auth/signin">
        <button className="btn btn-primary">Go to Login</button>
      </Link>
    </div>;
  }

  return (
    <div>
      <div className="admin-card-header">
        <h1 className="admin-card-title">Dashboard</h1>
        <div>
          <Link href="/pages/movie/createmovie">
            <button className="btn btn-primary">
              <AiOutlinePlus /> Add New Movie
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="form-row">
        <div className="admin-card">
          <div className="text-center">
            <AiOutlineVideoCamera style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
            <h2>{stats.totalMovies}</h2>
            <p>Total Movies</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="text-center">
            <AiOutlineCalendar style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
            <h2>{stats.totalSchedules}</h2>
            <p>Total Schedules</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="text-center">
            <AiOutlineVideoCamera style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
            <h2>{stats.totalScreens}</h2>
            <p>Total Screens</p>
          </div>
        </div>
      </div>

      {/* Recent Movies */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Recent Movies</h2>
          <Link href="/pages/movie/managemovies">
            <button className="btn btn-outline">
              <AiOutlineEye /> View All
            </button>
          </Link>
        </div>
        {stats.recentMovies.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Movie Title</th>
                <th>Added Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentMovies.map((movie) => (
                <tr key={movie._id}>
                  <td>{movie.title}</td>
                  <td>{movie.createdAt ? formatDate(movie.createdAt) : 'N/A'}</td>
                  <td>
                    <Link href={`/pages/movie/edit/${movie._id}`}>
                      <button className="btn btn-outline">Edit</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center" style={{ padding: '20px' }}>No movies found. Add your first movie!</p>
        )}
      </div>

      {/* Quick Access */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Quick Access</h2>
        </div>
        <div className="form-row">
          <Link href="/pages/movie/createmovie" style={{ flex: 1, textDecoration: 'none' }}>
            <div className="admin-card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AiOutlineVideoCamera style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }} />
                <div>
                  <h3>Add New Movie</h3>
                  <p>Create a new movie listing</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/pages/schedule" style={{ flex: 1, textDecoration: 'none' }}>
            <div className="admin-card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AiOutlineCalendar style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }} />
                <div>
                  <h3>Manage Schedules</h3>
                  <p>Add or edit movie schedules</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
