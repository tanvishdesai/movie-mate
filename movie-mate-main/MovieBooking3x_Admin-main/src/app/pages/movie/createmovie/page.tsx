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
  AiOutlineFileText
} from 'react-icons/ai';

interface Movie {
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

const CreateMoviePage = () => {
  const router = useRouter();
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
        console.log('API URL:', API_BASE_URL);
        
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(error => {
          console.error('Auth check failed:', error.message);
          return null;
        });
        
        if (response && (response.success || response.ok)) {
          setIsAuthenticated(true);
        } else {
          toast.error('Please login to access this page', {
            position: toast.POSITION.TOP_CENTER,
          });
          router.push('/pages/auth/signin');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
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
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'portrait') {
        setMovie({ ...movie, portraitImg: file });
        setPortraitPreview(URL.createObjectURL(file));
      } else {
        setMovie({ ...movie, landscapeImg: file });
        setLandscapePreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadImage = async (image: File) => {
    try {
      const formData = new FormData();
      formData.append("myimage", image);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/image/uploadimage`,
        {
          method: "POST",
          body: formData,
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Image uploaded successfully:", data);
        return data.imageUrl;
      } else {
        console.error("Failed to upload the image.");
        return null;
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const handleCreateMovie = async () => {
    try {
      if (
        movie.title === "" ||
        movie.description === "" ||
        movie.rating === 0 ||
        movie.genre.length === 0 ||
        movie.duration === 0
      ) {
        toast.error("Please fill all the fields", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      setLoading(true);

      let portraitImgUrl = movie.portraitImgUrl;
      let landscapeImgUrl = movie.landscapeImgUrl;

      if (movie.portraitImg) {
        const uploadedPortraitUrl = await uploadImage(movie.portraitImg);
        if (uploadedPortraitUrl) {
          portraitImgUrl = uploadedPortraitUrl;
        }
      }

      if (movie.landscapeImg) {
        const uploadedLandscapeUrl = await uploadImage(movie.landscapeImg);
        if (uploadedLandscapeUrl) {
          landscapeImgUrl = uploadedLandscapeUrl;
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/movie/createmovie`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: movie.title,
            description: movie.description,
            portraitImgUrl: portraitImgUrl,
            landscapeImgUrl: landscapeImgUrl,
            rating: movie.rating,
            genre: movie.genre,
            duration: movie.duration,
          }),
          credentials: 'include'
        }
      );

      const data = await response.json();
      console.log(data);

      if (data.success) {
        toast.success("Movie created successfully", {
          position: toast.POSITION.TOP_CENTER,
        });
        
        // Reset form
        setMovie({
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
        setPortraitPreview(null);
        setLandscapePreview(null);
      } else {
        toast.error(data.message, {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while creating the movie", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (checkingAuth) {
    return <div className="loading-spinner"></div>;
  }

  // Only render the content if authenticated
  if (!isAuthenticated) {
    return null; // This prevents the form from flashing before redirect happens
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h1 className="admin-card-title">
            <AiOutlineVideoCamera style={{ marginRight: '8px' }} /> Add New Movie
          </h1>
        </div>

        <div className="form-group">
          <label className="form-label">Movie Title</label>
          <input
            type="text"
            name="title"
            value={movie.title}
            onChange={handleInputChange}
            placeholder="Enter movie title"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={movie.description}
            onChange={handleInputChange}
            placeholder="Enter movie description"
            rows={5}
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-col">
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineClockCircle style={{ position: 'absolute', marginLeft: '10px', color: 'var(--gray-text)' }} />
                <input
                  type="number"
                  name="duration"
                  value={movie.duration || ''}
                  onChange={handleInputChange}
                  placeholder="Enter duration in minutes"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>
          </div>
          <div className="form-col">
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineStar style={{ position: 'absolute', marginLeft: '10px', color: 'var(--gray-text)' }} />
                <input
                  type="number"
                  name="rating"
                  value={movie.rating || ''}
                  onChange={handleInputChange}
                  placeholder="Enter rating (0-10)"
                  min="0"
                  max="10"
                  step="0.1"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Genres</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {genres.map((genre) => (
              <div
                key={genre}
                onClick={() => handleGenreChange(genre)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: movie.genre.includes(genre)
                    ? 'var(--primary-color)'
                    : 'transparent',
                  color: movie.genre.includes(genre)
                    ? 'white'
                    : 'var(--text-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {genre}
              </div>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-col">
            <div className="form-group">
              <label className="form-label">Portrait Image</label>
              <div style={{ 
                border: '1px dashed var(--border-color)', 
                borderRadius: 'var(--border-radius-sm)',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '10px',
                backgroundColor: 'var(--light-bg)'
              }}>
                {portraitPreview ? (
                  <img 
                    src={portraitPreview} 
                    alt="Portrait Preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                  />
                ) : (
                  <AiOutlineFileText style={{ fontSize: '3rem', color: 'var(--gray-text)' }} />
                )}
                <div style={{ marginTop: '10px' }}>
                  <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <AiOutlineUpload /> Upload Portrait Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'portrait')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
              <input
                type="text"
                name="portraitImgUrl"
                value={movie.portraitImgUrl}
                onChange={handleInputChange}
                placeholder="Or enter portrait image URL"
              />
            </div>
          </div>
          <div className="form-col">
            <div className="form-group">
              <label className="form-label">Landscape Image</label>
              <div style={{ 
                border: '1px dashed var(--border-color)', 
                borderRadius: 'var(--border-radius-sm)',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '10px',
                backgroundColor: 'var(--light-bg)'
              }}>
                {landscapePreview ? (
                  <img 
                    src={landscapePreview} 
                    alt="Landscape Preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                  />
                ) : (
                  <AiOutlineFileText style={{ fontSize: '3rem', color: 'var(--gray-text)' }} />
                )}
                <div style={{ marginTop: '10px' }}>
                  <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    <AiOutlineUpload /> Upload Landscape Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'landscape')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
              <input
                type="text"
                name="landscapeImgUrl"
                value={movie.landscapeImgUrl}
                onChange={handleInputChange}
                placeholder="Or enter landscape image URL"
              />
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleCreateMovie}
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: '0' }}></div>
            ) : (
              <>
                <AiOutlineSave /> Create Movie
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMoviePage;