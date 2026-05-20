"use client"
import React, { useState, useEffect } from 'react'
import './schedule.css'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineCalendar, AiOutlineFieldTime, AiOutlineSearch } from 'react-icons/ai';

interface Schedule {
  screenId: string,
  movieId: string,
  showTime: string,
  showDate: string
}

interface Screen {
  _id: string;
  name: string;
  location: string;
  seats: any[]; // Change the type to an array of numbers
  city: string;
  screenType: string;
}

interface Movie {
  _id: string;
  title: string;
  description: string;
  portraitImgUrl: string;
  portraitImg: File | null;
  landscapeImgUrl: string;
  landscapeImg: File | null;
  rating: number;
  genre: string[];
  duration: number;
}

const SchedulePage = () => {
  const [schedule, setSchedule] = useState<Schedule>({
    screenId: '',
    movieId: '',
    showTime: '',
    showDate: ''
  });

  const [city, setCity] = useState('');
  const [screens, setScreens] = useState<Screen[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication when component mounts
  useEffect(() => {
    const checkAuthentication = async () => {
      const adminAuthToken = localStorage.getItem('adminAuthToken');
      if (!adminAuthToken) {
        toast.error("Please login to continue");
        window.location.href = '/pages/auth/signin';
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/admin/checklogin`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminAuthToken}`
          },
          credentials: 'include'
        });

        const data = await res.json();
        if (!data.ok) {
          toast.error("Session expired. Please login again");
          window.location.href = '/pages/auth/signin';
          return;
        }

        setIsAuthenticated(true);
        getMovies(); // Only fetch movies if authenticated
      } catch (error) {
        console.error('Auth check failed:', error);
        toast.error("Authentication failed. Please login again");
        window.location.href = '/pages/auth/signin';
      }
    };

    checkAuthentication();
  }, []);

  const getMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/movies`);
      const data = await res.json();
      if (data.ok) {
        setMovies(data.data);
        console.log('Movies fetched successfully:', data.data);
      } else {
        toast.error('Failed to fetch movies');
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const getScreensByCity = async () => {
    if (city === '') {
      toast.error('Please select a city');
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/screensbycity/${city.toLowerCase()}`);
      const data = await res.json();
      
      if (data.ok) {
        setScreens(data.data);
        console.log('Screens fetched successfully:', data.data);
        if (data.data.length === 0) {
          toast.info('No screens found in this city');
        }
      } else {
        toast.error(data.message || 'Failed to fetch screens');
      }
    } catch (error) {
      console.error('Error fetching screens:', error);
      toast.error('Failed to fetch screens');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!schedule.screenId || !schedule.movieId || !schedule.showTime || !schedule.showDate) {
      toast.error("Please fill all the fields");
      return;
    }

    // Get admin token from localStorage
    const adminAuthToken = localStorage.getItem('adminAuthToken');
    if (!adminAuthToken) {
      toast.error("Please login again to continue");
      window.location.href = '/pages/auth/signin';
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/addmoviescheduletoscreen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthToken}`
        },
        credentials: 'include',
        body: JSON.stringify(schedule)
      });

      const data = await res.json();
      
      if (data.ok) {
        toast.success("Schedule created successfully");
        // Reset form after successful submission
        setSchedule({
          screenId: '',
          movieId: '',
          showTime: '',
          showDate: ''
        });
      } else {
        toast.error(data.message || "Schedule creation failed");
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error("Schedule creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-page">
      <ToastContainer position="top-center" />
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h1 className="admin-card-title">Create New Schedule</h1>
        </div>
        
        <div className="admin-card-content">
          <div className="city-search-section">
            <h2>Step 1: Select City</h2>
            <div className="city-search-container">
              <div className="search-input-group">
                <input 
                  type="text" 
                  name="city" 
                  id="city"
                  placeholder="Enter city name"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <button 
                  className="search-btn"
                  onClick={getScreensByCity}
                  disabled={loading}
                >
                  <AiOutlineSearch /> Search
                </button>
              </div>
            </div>
          </div>

          <div className="schedule-sections-container">
            <div className="schedule-section">
              <h2>Step 2: Select Screen</h2>
              <div className="items-container">
                {screens.length > 0 ? (
                  screens.map((screen, index) => (
                    <div 
                      className={schedule.screenId === screen._id ? 'item selected' : 'item'} 
                      key={index}
                      onClick={() => setSchedule({ ...schedule, screenId: screen._id })}
                    >
                      <h3>{screen.name}</h3>
                      <p><strong>Location:</strong> {screen.location}</p>
                      <p><strong>City:</strong> {screen.city}</p>
                      <p><strong>Type:</strong> {screen.screenType}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-items-message">No screens available. Please search for a city first.</p>
                )}
              </div>
            </div>

            <div className="schedule-section">
              <h2>Step 3: Select Movie</h2>
              <div className="items-container">
                {movies.length > 0 ? (
                  movies.map((movie, index) => (
                    <div 
                      className={schedule.movieId === movie._id ? 'item selected' : 'item'} 
                      key={index}
                      onClick={() => setSchedule({ ...schedule, movieId: movie._id })}
                    >
                      <h3>{movie.title}</h3>
                      <p className="movie-desc">{movie.description.substring(0, 100)}...</p>
                      <div className="movie-meta">
                        <span><strong>Rating:</strong> {movie.rating}</span>
                        <span><strong>Duration:</strong> {movie.duration} min</span>
                      </div>
                      <p><strong>Genre:</strong> {movie.genre.join(', ')}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-items-message">No movies available.</p>
                )}
              </div>
            </div>
          </div>

          <div className="schedule-datetime-section">
            <h2>Step 4: Schedule Date & Time</h2>
            <div className="datetime-container">
              <div className="input-group">
                <label htmlFor="showTime">
                  <AiOutlineFieldTime /> Show Time
                </label>
                <input 
                  type="time" 
                  name="showTime" 
                  id="showTime"
                  value={schedule.showTime}
                  onChange={(e) => setSchedule({ ...schedule, showTime: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="showDate">
                  <AiOutlineCalendar /> Show Date
                </label>
                <input 
                  type="date" 
                  name="showDate" 
                  id="showDate"
                  value={schedule.showDate}
                  onChange={(e) => setSchedule({ ...schedule, showDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="schedule-submit-section">
            <button
              className="schedule-submit-btn"
              onClick={createSchedule}
              disabled={loading || !schedule.screenId || !schedule.movieId || !schedule.showTime || !schedule.showDate}
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchedulePage;