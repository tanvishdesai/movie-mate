"use client"
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { 
  AiOutlineSave, 
  AiOutlineUpload, 
  AiOutlineVideoCamera, 
  AiOutlineClockCircle,
  AiOutlineStar,
  AiOutlineFileText,
  AiOutlineArrowLeft,
  AiOutlineEdit
} from 'react-icons/ai';
import Link from "next/link";

interface Movie {
  _id?: string;
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

interface PageProps {
  params: {
    id: string;
  };
}

const EditMoviePage = ({ params }: PageProps) => {
  const router = useRouter();
  const movieId = params.id;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [movie, setMovie] = useState<Movie>({
    title: "",
    description: "",
    portraitImgUrl: "",
    portraitImg: null,
    landscapeImgUrl: "",
    landscapeImg: null,
    rating: 0,
    genre: [],
    duration: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingMovie, setFetchingMovie] = useState(true);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [landscapePreview, setLandscapePreview] = useState<string | null>(null);

  const genres = [
    "Action",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Science Fiction",
    "Thriller",
    "Other",
  ];

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
      setFetchingMovie(true);
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
          portraitImg: null,
          landscapeImgUrl: movieData.landscapeImgUrl || '',
          landscapeImg: null,
          rating: movieData.rating || 0,
          genre: movieData.genre || [],
          duration: movieData.duration || 0,
        });
        
        // Set image previews
        if (movieData.portraitImgUrl) {
          setPortraitPreview(movieData.portraitImgUrl);
        }
        
        if (movieData.landscapeImgUrl) {
          setLandscapePreview(movieData.landscapeImgUrl);
        }
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
      setFetchingMovie(false);
    }
  };

  const handleGenreChange = (genre: string) => {
    if (movie.genre.includes(genre)) {
      setMovie({
        ...movie,
        genre: movie.genre.filter((selectedGenre) => selectedGenre !== genre),
      });
    } else {
      setMovie({ ...movie, genre: [...movie.genre, genre] });
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setMovie({ ...movie, [name]: value });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'portrait' | 'landscape') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (type === 'portrait') {
          setPortraitPreview(e.target?.result as string);
          setMovie({ ...movie, portraitImg: file });
        } else {
          setLandscapePreview(e.target?.result as string);
          setMovie({ ...movie, landscapeImg: file });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (image: File) => {
    try {
      const formData = new FormData();
      formData.append('image', image);
      
      const response = await fetch(`${API_BASE_URL}${endpoints.uploadImage}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Image upload failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.imageUrl) {
        return data.imageUrl;
      } else if (data.url) {
        return data.url;
      } else {
        throw new Error('Image URL not found in response');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleUpdateMovie = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!movie.title || !movie.description || movie.duration <= 0 || movie.genre.length === 0) {
        toast.error('Please fill all required fields', {
          position: toast.POSITION.TOP_CENTER,
        });
        setLoading(false);
        return;
      }
      
      // Upload images if new ones were selected
      let portraitUrl = movie.portraitImgUrl;
      let landscapeUrl = movie.landscapeImgUrl;
      
      if (movie.portraitImg) {
        try {
          portraitUrl = await uploadImage(movie.portraitImg);
          console.log('Portrait image uploaded successfully:', portraitUrl);
        } catch (error: any) {
          console.error('Portrait image upload failed:', error);
          toast.error(`Portrait image upload failed: ${error.message}`);
          setLoading(false);
          return;
        }
      }
      
      if (movie.landscapeImg) {
        try {
          landscapeUrl = await uploadImage(movie.landscapeImg);
          console.log('Landscape image uploaded successfully:', landscapeUrl);
        } catch (error: any) {
          console.error('Landscape image upload failed:', error);
          toast.error(`Landscape image upload failed: ${error.message}`);
          setLoading(false);
          return;
        }
      }
      
      // Prepare movie data for update
      const movieData = {
        title: movie.title,
        description: movie.description,
        portraitImgUrl: portraitUrl,
        landscapeImgUrl: landscapeUrl,
        rating: Number(movie.rating),
        genre: movie.genre,
        duration: Number(movie.duration),
      };
      
      console.log('Updating movie with data:', movieData);
      console.log('Update endpoint:', endpoints.updateMovie(movieId));
      
      try {
        // Direct fetch approach to debug issues
        const url = `${API_BASE_URL}${endpoints.updateMovie(movieId)}`;
        console.log('Full update URL:', url);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(movieData),
          credentials: 'include'
        });
        
        console.log('Update response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Update response data:', data);
          
          toast.success('Movie updated successfully', {
            position: toast.POSITION.TOP_CENTER,
          });
          
          // Redirect after a short delay to ensure toast is visible
          setTimeout(() => {
            router.push('/pages/movie/managemovies');
          }, 1500);
        } else {
          let errorMessage = 'Unknown error';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Failed to update movie: ${response.statusText}`;
            console.error('API error response:', errorData);
          } catch (e) {
            console.error('Could not parse error response:', e);
            errorMessage = `Failed to update movie: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      } catch (apiError: any) {
        console.error('API request failed:', apiError);
        throw apiError;
      }
    } catch (error: any) {
      console.error('Error updating movie:', error);
      toast.error(`Failed to update movie: ${error.message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoading(false);
    }
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
  if (fetchingMovie) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <ToastContainer />
      
      <div className="admin-card-header" style={{ marginBottom: '20px' }}>
        <h1 className="admin-card-title">
          <Link href="/pages/movie/managemovies" className="back-button" style={{ marginRight: '15px' }}>
            <AiOutlineArrowLeft />
          </Link>
          <AiOutlineEdit style={{ marginRight: '10px' }} /> Edit Movie
        </h1>
      </div>
      
      <div className="admin-card" style={{ padding: '30px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div className="form-section" style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Basic Information</h2>
          <div className="form-row">
            <div className="form-group" style={{ flex: '1' }}>
              <label htmlFor="title">
                <AiOutlineVideoCamera /> Movie Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={movie.title}
                onChange={handleInputChange}
                placeholder="Enter movie title"
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="form-group" style={{ flex: '1' }}>
              <label htmlFor="duration">
                <AiOutlineClockCircle /> Duration (minutes)*
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={movie.duration}
                onChange={handleInputChange}
                placeholder="Enter duration in minutes"
                min="1"
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">
              <AiOutlineFileText /> Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={movie.description}
              onChange={handleInputChange}
              placeholder="Enter movie description"
              rows={4}
              required
              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: '1' }}>
              <label htmlFor="rating">
                <AiOutlineStar /> Rating (0-10)*
              </label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={movie.rating}
                onChange={handleInputChange}
                placeholder="Enter rating (0-10)"
                min="0"
                max="10"
                step="0.1"
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section" style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Genre Selection</h2>
          <div className="form-group">
            <label>Select Genres* (at least one)</label>
            <div className="genre-checkboxes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '10px' }}>
              {genres.map((genre) => (
                <div key={genre} className="genre-checkbox" style={{ padding: '8px', border: '1px solid #eee', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id={genre}
                    checked={movie.genre.includes(genre)}
                    onChange={() => handleGenreChange(genre)}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor={genre} style={{ margin: 0, cursor: 'pointer' }}>{genre}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="form-section" style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Movie Images</h2>
          <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '300px' }}>
              <label htmlFor="portraitImg">
                <AiOutlineUpload /> Portrait Image
              </label>
              <div className="image-upload-container" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {portraitPreview && (
                  <div className="image-preview" style={{ marginBottom: '15px', border: '1px solid #e1e1e1', borderRadius: '6px', padding: '5px', width: '200px', height: '300px' }}>
                    <img src={portraitPreview} alt="Portrait Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  </div>
                )}
                <input
                  type="file"
                  id="portraitImg"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'portrait')}
                  style={{ width: '100%' }}
                />
                <p className="image-help-text" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Portrait image for movie posters (recommended: 2:3 ratio)
                </p>
              </div>
            </div>
            
            <div className="form-group" style={{ flex: '1', minWidth: '300px' }}>
              <label htmlFor="landscapeImg">
                <AiOutlineUpload /> Landscape Image
              </label>
              <div className="image-upload-container" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {landscapePreview && (
                  <div className="image-preview" style={{ marginBottom: '15px', border: '1px solid #e1e1e1', borderRadius: '6px', padding: '5px', width: '300px', height: '169px' }}>
                    <img src={landscapePreview} alt="Landscape Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  </div>
                )}
                <input
                  type="file"
                  id="landscapeImg"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'landscape')}
                  style={{ width: '100%' }}
                />
                <p className="image-help-text" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Landscape image for banners (recommended: 16:9 ratio)
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid #eee' }}>
          <Link href="/pages/movie/managemovies">
            <button className="btn btn-secondary">Cancel</button>
          </Link>
          
          <button
            className="btn btn-primary"
            onClick={handleUpdateMovie}
            disabled={loading}
            style={{ minWidth: '200px' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner-small"></div> Updating...
              </>
            ) : (
              <>
                <AiOutlineSave style={{ marginRight: '8px' }} /> Update Movie
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMoviePage; 