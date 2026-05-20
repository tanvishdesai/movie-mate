"use client"
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { 
  AiOutlineVideoCamera, 
  AiOutlineClockCircle,
  AiOutlineStar,
  AiOutlineEye,
  AiOutlineFileText,
  AiOutlineArrowLeft,
  AiOutlineEdit,
  AiOutlineCalendar
} from 'react-icons/ai';
import Link from "next/link";

interface Movie {
  _id?: string;
  title: string;
  description: string;
  portraitImgUrl: string;
  landscapeImgUrl: string;
  rating: number;
  genre: string[];
  duration: number;
  createdAt?: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

const ViewMoviePage = ({ params }: PageProps) => {
  const router = useRouter();
  const movieId = params.id;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication when component mounts
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('Checking authentication...');
        
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(error => {
          console.error('Auth check failed:', error.message);
          return null;
        });
        
        if (response && (response.success || response.status === 'success' || (response.admin && response.admin.name))) {
          console.log('Authentication successful');
          setIsAuthenticated(true);
          fetchMovieDetails(); // Fetch movie details after authentication
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
  }, [router, movieId]);

  // Fetch movie details
  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching movie details for ID: ${movieId}`);
      
      // Use the getAllMovies endpoint to get all movies
      const response = await apiRequest(endpoints.getAllMovies, {
        method: 'GET'
      });
      
      console.log('Movies API response:', response);
      
      let movies = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        movies = response;
      } else if (response.data && Array.isArray(response.data)) {
        movies = response.data;
      } else if (response.movies && Array.isArray(response.movies)) {
        movies = response.movies;
      } else {
        throw new Error('Unexpected API response format');
      }
      
      // Find the movie with the matching ID
      const movieData = movies.find((m: any) => m._id === movieId);
      
      if (movieData) {
        console.log('Found movie data:', movieData);
        
        // Set movie state with the fetched data
        setMovie({
          _id: movieData._id,
          title: movieData.title || '',
          description: movieData.description || '',
          portraitImgUrl: movieData.portraitImgUrl || '',
          landscapeImgUrl: movieData.landscapeImgUrl || '',
          rating: movieData.rating || 0,
          genre: movieData.genre || [],
          duration: movieData.duration || 0,
          createdAt: movieData.createdAt
        });
      } else {
        console.error(`Movie with ID ${movieId} not found`);
        toast.error('Movie not found', {
          position: toast.POSITION.TOP_CENTER,
        });
        router.push('/pages/movie/managemovies');
      }
    } catch (error: any) {
      console.error('Error fetching movie details:', error.message);
      toast.error(`Failed to fetch movie details: ${error.message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Display loading indicator while checking authentication
  if (checkingAuth) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Display loading indicator while fetching movie
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Movie not found</h2>
        <p>The requested movie could not be found.</p>
        <Link href="/pages/movie/managemovies">
          <button className="btn btn-primary mt-20">
            Back to Movies
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <ToastContainer />
      
      <div className="admin-card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="admin-card-title">
          <Link href="/pages/movie/managemovies" className="back-button" style={{ marginRight: '15px' }}>
            <AiOutlineArrowLeft />
          </Link>
          <AiOutlineEye style={{ marginRight: '10px' }} /> {movie.title}
        </h1>
        <Link href={`/pages/movie/edit/${movieId}`}>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AiOutlineEdit /> Edit Movie
          </button>
        </Link>
      </div>
      
      {/* Movie Details Card */}
      <div className="admin-card" style={{ marginBottom: '30px', padding: '0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        {/* Banner Image */}
        {movie.landscapeImgUrl && (
          <div className="movie-banner" style={{ width: '100%', height: '300px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${movie.landscapeImgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(2px)' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)' }}></div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100%', padding: '30px' }}>
              {movie.portraitImgUrl && (
                <div className="movie-poster" style={{ width: '180px', height: '270px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
                  <img src={movie.portraitImgUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ marginLeft: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '15px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{movie.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AiOutlineStar style={{ color: '#FFD700' }} /> {movie.rating}/10 Rating
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AiOutlineClockCircle /> {movie.duration} minutes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AiOutlineCalendar /> Added: {formatDate(movie.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {movie.genre.map((genre, index) => (
                    <span key={index} style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      padding: '5px 12px', 
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}>
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Movie Information Section */}
        <div style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AiOutlineFileText /> Description
          </h2>
          <p style={{ lineHeight: '1.7', fontSize: '16px', whiteSpace: 'pre-line' }}>
            {movie.description}
          </p>
        </div>
      </div>
      
      {/* Actions Section */}
      <div className="admin-card" style={{ padding: '20px', textAlign: 'center', marginBottom: '30px', display: 'flex', justifyContent: 'space-around' }}>
        <Link href="/pages/movie/managemovies">
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AiOutlineArrowLeft /> Back to Movies
          </button>
        </Link>
        <Link href={`/pages/movie/edit/${movieId}`}>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AiOutlineEdit /> Edit Movie
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ViewMoviePage; 