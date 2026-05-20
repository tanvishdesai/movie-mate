"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from 'next/navigation';
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { 
  AiOutlineVideoCamera, 
  AiOutlineEdit, 
  AiOutlineDelete, 
  AiOutlinePlus,
  AiOutlineSearch,
  AiOutlineEye
} from 'react-icons/ai';

interface Movie {
  _id: string;
  title: string;
  description: string;
  portraitImgUrl: string;
  landscapeImgUrl: string;
  rating: number;
  genre: string[];
  duration: number;
  createdAt: string;
}

const ManageMoviesPage = () => {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('Checking authentication...');
        console.log('API URL:', API_BASE_URL);
        
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(error => {
          console.error('Auth check failed:', error.message);
          return null;
        });
        
        if (response) {
          console.log('Authentication successful');
          setIsAuthenticated(true);
          fetchMovies(); // Only fetch movies if authenticated
        } else {
          console.log('Authentication failed, redirecting to login');
          toast.error('Please login to access this page', {
            position: toast.POSITION.TOP_CENTER,
          });
          router.push('/pages/auth/signin');
        }
      } catch (error: any) {
        console.error('Authentication check failed:', error.message);
        toast.error('Authentication error. Please try logging in again.', {
          position: toast.POSITION.TOP_CENTER,
        });
        router.push('/pages/auth/signin');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      console.log('Fetching movies...');
      
      // Use the correct endpoint and simplify the fetch logic
      const response = await apiRequest(endpoints.getAllMovies, {
        method: 'GET'
      });
      
      console.log('Movie API response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        console.log(`Fetched ${response.length} movies (array format)`);
        setMovies(response);
      } else if (response.data && Array.isArray(response.data)) {
        console.log(`Fetched ${response.data.length} movies (data property format)`);
        setMovies(response.data);
      } else if (response.movies && Array.isArray(response.movies)) {
        console.log(`Fetched ${response.movies.length} movies (movies property format)`);
        setMovies(response.movies);
      } else if (response.ok === false) {
        console.error('API returned error:', response.message || 'Unknown error');
        toast.error(response.message || 'Failed to fetch movies', {
          position: toast.POSITION.TOP_CENTER,
        });
        setMovies([]);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Received unexpected data format from server', {
          position: toast.POSITION.TOP_CENTER,
        });
        setMovies([]);
      }
    } catch (error: any) {
      console.error('Error fetching movies:', error);
      toast.error(`Error fetching movies: ${error.message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    try {
      console.log('Deleting movie with ID:', movieId);
      
      const response = await apiRequest(endpoints.deleteMovie(movieId), {
        method: 'DELETE'
      });
      
      console.log('Delete response:', response);
      
      if (response && !response.error) {
        toast.success(response.message || 'Movie deleted successfully', {
          position: toast.POSITION.TOP_CENTER,
        });
        
        // Refresh the movies list
        fetchMovies();
      } else {
        throw new Error(response.message || 'Failed to delete movie');
      }
    } catch (error: any) {
      console.error('Error deleting movie:', error);
      toast.error(`Failed to delete movie: ${error.message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading spinner while checking authentication
  if (checkingAuth) {
    return <div className="loading-spinner"></div>;
  }

  // Only render the content if authenticated
  if (!isAuthenticated) {
    return null; // This prevents the content from flashing before redirect happens
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h1 className="admin-card-title">
            <AiOutlineVideoCamera style={{ marginRight: '8px' }} /> Manage Movies
          </h1>
          <div>
            <Link href="/pages/movie/createmovie">
              <button className="btn btn-primary">
                <AiOutlinePlus /> Add New Movie
              </button>
            </Link>
          </div>
        </div>

        <div className="form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <AiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
            <input
              type="text"
              placeholder="Search by title or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : filteredMovies.length === 0 ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
            <AiOutlineVideoCamera style={{ fontSize: '3rem', color: 'var(--gray-text)', marginBottom: '16px' }} />
            <h2>No movies found</h2>
            <p>Try adjusting your search or add a new movie.</p>
            <Link href="/pages/movie/createmovie">
              <button className="btn btn-primary mt-20">
                <AiOutlinePlus /> Add New Movie
              </button>
            </Link>
          </div>
        ) : (
          <div className="admin-table-container" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Title</th>
                  <th>Genres</th>
                  <th>Rating</th>
                  <th>Duration</th>
                  <th>Added Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movie) => (
                  <tr key={movie._id}>
                    <td>
                      {movie.portraitImgUrl && (
                        <img 
                          src={movie.portraitImgUrl} 
                          alt={movie.title} 
                          style={{ width: '30px', height: '45px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }} 
                        />
                      )}
                    </td>
                    <td>{movie.title}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {movie.genre.map((g, index) => (
                          <span 
                            key={index}
                            style={{ 
                              fontSize: '12px', 
                              padding: '2px 8px', 
                              backgroundColor: 'var(--highlight-bg)', 
                              borderRadius: 'var(--border-radius-sm)',
                              color: 'var(--primary-color)'
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{movie.rating}/10</td>
                    <td>{movie.duration} min</td>
                    <td>{formatDate(movie.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/pages/movie/edit/${movie._id}`}>
                          <button className="btn btn-outline" style={{ padding: '6px 12px' }}>
                            <AiOutlineEdit />
                          </button>
                        </Link>
                        <Link href={`/pages/movie/view/${movie._id}`}>
                          <button className="btn btn-outline" style={{ padding: '6px 12px' }}>
                            <AiOutlineEye />
                          </button>
                        </Link>
                        {confirmDelete === movie._id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '6px 12px' }}
                              onClick={() => handleDeleteMovie(movie._id)}
                            >
                              Confirm
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '6px 12px' }}
                              onClick={() => setConfirmDelete(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 12px' }}
                            onClick={() => setConfirmDelete(movie._id)}
                          >
                            <AiOutlineDelete />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMoviesPage; 