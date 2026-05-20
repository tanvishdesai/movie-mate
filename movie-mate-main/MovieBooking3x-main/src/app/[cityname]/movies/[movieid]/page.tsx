"use client"
import React, { useState, useEffect } from 'react'
import { BsShare, BsInfoCircle, BsCalendarCheck, BsClock, BsFillStarFill, BsTicket, BsPerson } from 'react-icons/bs'
import { FaPlay, FaTheaterMasks, FaLanguage, FaUserFriends } from 'react-icons/fa'
import { MdLocalMovies, MdOutlineRateReview, MdMovie } from 'react-icons/md'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import './MoviePage.css'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'

// Components
import MovieCarousel from '@/components/moviecarousel/MovieCarousel'
import CelebCard from '@/components/CelebCard/CelebCard'
import ShareModal from '@/components/ShareModal/ShareModal'
import Toast from '@/components/Toast/Toast'

// Dynamically import the PrivateScreeningForm to avoid SSR issues
const PrivateScreeningForm = dynamic(
  () => import('@/components/privateScreening/PrivateScreeningForm'),
  { ssr: false }
);

// Utils
import { shareContent } from '@/utils/shareUtils'

// Swiper
import 'swiper/css'
import 'swiper/css/pagination'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'

// Define proper types
interface Theatre {
  _id: string;
  name: string;
  location: string;
}

const MoviePage = () => {
    const pathname = usePathname()
    const { movieid, cityname } = useParams()
    
    const [movie, setMovie] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('about')
    const [theatres, setTheatres] = useState<Theatre[]>([])
    const [loadingTheatres, setLoadingTheatres] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showPrivateScreeningModal, setShowPrivateScreeningModal] = useState(false)
    const [toast, setToast] = useState({
      visible: false,
      message: '',
      type: 'success' as 'success' | 'error' | 'info'
    })

    // Get today's date in yyyy-MM-dd format
    const todayFormatted = format(new Date(), 'yyyy-MM-dd')

    const getMovie = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/movies/${movieid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.ok) {
                setMovie(data.data)
            } else {
                setError('Failed to load movie details')
            }
        } catch (err) {
            console.error(err)
            setError('Something went wrong. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    // Fetch available theatres/showtimes for today
    const getTheatres = async () => {
        setLoadingTheatres(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_API}/movie/screensbymovieschedule/${cityname}/${todayFormatted}/${movieid}`, 
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                }
            )
            const data = await response.json()
            if (data.ok) {
                setTheatres(data.data.slice(0, 5)) // Show only first 5 theatres for preview
            } else {
                setTheatres([])
            }
        } catch (err) {
            console.error("Error fetching theatres:", err)
            setTheatres([])
        } finally {
            setLoadingTheatres(false)
        }
    }

    useEffect(() => {
        getMovie()
        getTheatres()
    }, [movieid, cityname])

    // Show toast message
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({
            visible: true,
            message,
            type
        });
    };

    const handleCloseToast = () => {
        setToast({
            ...toast,
            visible: false
        });
    };

    // Handle sharing
    const handleShareClick = async () => {
        if (!movie) return;
        
        // Prepare sharing data
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        const shareTitle = `${movie.title} - MovieMate`;
        const shareText = `Check out ${movie.title} (${movie.rating}/10) on MovieMate! ${movie.genre.join(', ')} • ${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`;
        
        // Try to use Web Share API first, fallback to custom modal
        const shared = await shareContent(
            shareTitle,
            shareText,
            shareUrl,
            () => setShowShareModal(true)
        );

        if (shared) {
            showToast('Movie shared successfully!');
        }
    }

    const handleCloseShareModal = () => {
        setShowShareModal(false)
    }

    const handleOpenPrivateScreeningModal = () => {
        // Check if user is logged in first
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/getuser`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                setShowPrivateScreeningModal(true);
            } else {
                showToast('Please log in to request a private screening', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Please log in to request a private screening', 'error');
        });
    };

    const handleClosePrivateScreeningModal = () => {
        setShowPrivateScreeningModal(false);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading movie details...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-container">
                <BsInfoCircle size={50} />
                <h2>Oops! {error}</h2>
                <button onClick={getMovie} className="retry-btn">Try Again</button>
            </div>
        )
    }

    if (!movie) return null
    
    // Prepare current URL for sharing
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    return (
        <div className="movie-page">
            {/* Hero Section with Backdrop */}
            <div 
                className="movie-hero" 
                style={{
                    backgroundImage: `url(${movie.landscapeImgUrl})`
                }}
            >
                <div className="movie-hero-overlay">
                    <div className="movie-hero-content container">
                        <div className="movie-poster-wrapper">
                            <div 
                                className="movie-poster"
                                style={{
                                    backgroundImage: `url(${movie.portraitImgUrl})`
                                }}
                            >
                                <div className="in-cinemas-badge">In Cinemas</div>
                                <button className="trailer-btn">
                                    <FaPlay />
                                    <span>Watch Trailer</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="movie-details">
                            <h1 className="movie-title">{movie.title}</h1>
                            
                            <div className="movie-meta">
                                <div className="rating">
                                    <BsFillStarFill className="star-icon" />
                                    <span>{movie.rating}/10</span>
                                </div>
                                
                                <div className="meta-divider"></div>
                                
                                <div className="duration">
                                    <BsClock />
                                    <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                                </div>
                                
                                <div className="meta-divider"></div>
                                
                                <div className="genres">
                                    {movie.genre.join(', ')}
                                </div>
                            </div>
                            
                            <p className="movie-description">
                                {movie.description}
                            </p>
                            
                            <div className="action-buttons">
                                <Link href={`/${cityname}/movies/${movieid}/buytickets`} className="book-btn">
                                    <BsCalendarCheck /> Book Tickets
                                </Link>
                                
                                <button className="share-btn" onClick={handleShareClick} aria-label="Share this movie">
                                    <BsShare /> Share
                                </button>
                                
                                <button className="private-screening-btn" onClick={handleOpenPrivateScreeningModal} aria-label="Request a private screening">
                                    <FaUserFriends /> Private Screening
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Movie Key Highlights Section */}
            <div className="movie-highlights">
                <div className="container">
                    <div className="highlights-grid">
                        <div className="highlight-card">
                            <div className="highlight-icon">
                                <MdLocalMovies />
                            </div>
                            <div className="highlight-content">
                                <h3>Genres</h3>
                                <p>{movie.genre.join(', ')}</p>
                            </div>
                        </div>
                        
                        <div className="highlight-card">
                            <div className="highlight-icon">
                                <BsClock />
                            </div>
                            <div className="highlight-content">
                                <h3>Duration</h3>
                                <p>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</p>
                            </div>
                        </div>
                        
                        <div className="highlight-card">
                            <div className="highlight-icon">
                                <BsFillStarFill />
                            </div>
                            <div className="highlight-content">
                                <h3>Rating</h3>
                                <p>{movie.rating}/10 User Score</p>
                            </div>
                        </div>
                        
                        <div className="highlight-card">
                            <div className="highlight-icon">
                                <FaTheaterMasks />
                            </div>
                            <div className="highlight-content">
                                <h3>Cast</h3>
                                <p>{movie.cast && movie.cast.length > 0 ? `${movie.cast.length} Featured Artists` : 'Cast details unavailable'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Showtimes Preview Section */}
            <div className="showtimes-preview">
                <div className="container">
                    <div className="showtimes-header">
                        <h2>Today's Showtimes</h2>
                        <Link href={`/${cityname}/movies/${movieid}/buytickets`} className="view-all-btn">
                            View All Showtimes
                        </Link>
                    </div>
                    
                    <div className="showtimes-container">
                        {loadingTheatres ? (
                            <div className="theatres-loading">
                                <div className="loading-spinner small"></div>
                                <p>Loading showtimes...</p>
                            </div>
                        ) : theatres.length > 0 ? (
                            theatres.map((theatre, index) => (
                                <div key={index} className="showtime-item">
                                    <span className="showtime-theatre-name">{theatre.name}</span>
                                    <span className="showtime-theater">{theatre.location}</span>
                                    <Link 
                                        href={`/${cityname}/movies/${movieid}/buytickets/${theatre._id}?date=${todayFormatted}`}
                                        className="showtime-book-btn"
                                    >
                                        Select Seats
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="no-showtimes">
                                <p>No showtimes available for today</p>
                                <Link href={`/${cityname}/movies/${movieid}/buytickets`} className="check-other-dates-btn">
                                    Check Other Dates
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Movie Content Tabs Section */}
            <div className="movie-content-tabs">
                <div className="container">
                    <div className="tabs-navigation">
                        <button 
                            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                            onClick={() => setActiveTab('about')}
                        >
                            <BsInfoCircle /> About
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'cast' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cast')}
                        >
                            <FaTheaterMasks /> Cast & Crew
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            <MdOutlineRateReview /> Reviews
                        </button>
                    </div>
                    
                    <div className="tab-content">
                        {activeTab === 'about' && (
                            <div className="about-tab">
                                <h3>About the Movie</h3>
                                <p>{movie.description}</p>
                                <div className="movie-details-grid">
                                    <div className="detail-item">
                                        <h4>Genre</h4>
                                        <p>{movie.genre.join(', ')}</p>
                                    </div>
                                    <div className="detail-item">
                                        <h4>Duration</h4>
                                        <p>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</p>
                                    </div>
                                    <div className="detail-item">
                                        <h4>Rating</h4>
                                        <p>{movie.rating}/10</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'cast' && (
                            <div className="cast-tab">
                                {movie.cast && movie.cast.length > 0 ? (
                                    <>
                                        <h3>Cast</h3>
                                        <div className="cast-grid">
                                            {movie.cast.map((actor: any, index: number) => (
                                                <CelebCard key={index} {...actor} />
                                            ))}
                                        </div>
                                        
                                        {movie.crew && movie.crew.length > 0 && (
                                            <>
                                                <h3>Crew</h3>
                                                <div className="crew-grid">
                                                    {movie.crew.map((member: any, index: number) => (
                                                        <CelebCard key={index} {...member} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="no-data">
                                        <MdMovie size={50} />
                                        <p>Cast information will be updated soon!</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'reviews' && (
                            <div className="reviews-tab">
                                <div className="no-data">
                                    <MdOutlineRateReview size={50} />
                                    <p>The reviews feature is coming soon!</p>
                                    <div className="feature-coming-soon">
                                        <p>This feature is currently in development and will be available in a future update.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Recommendations Section with Divider */}
            <div className="section-divider">
                <div className="container">
                    <div className="divider-line"></div>
                    <h2 className="divider-text">You Might Also Like</h2>
                    <div className="divider-line"></div>
                </div>
            </div>
            
            <div className="movie-content container">
                {/* You Might Also Like Section */}
                <section className="recommendations-section">
                    <div className="section-content">
                        <MovieCarousel />
                    </div>
                </section>
            </div>
            
            {/* Modals */}
            {showShareModal && (
                <ShareModal 
                    isOpen={showShareModal}
                    onClose={handleCloseShareModal}
                    title={movie.title}
                    url={shareUrl}
                    image={movie.portraitImgUrl}
                />
            )}
            
            {showPrivateScreeningModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <PrivateScreeningForm 
                            movieId={movieid as string}
                            movieTitle={movie.title}
                            onClose={handleClosePrivateScreeningModal}
                        />
                    </div>
                </div>
            )}
            
            {/* Toast notification */}
            {toast.visible && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={handleCloseToast}
                    isVisible={toast.visible}
                />
            )}
        </div>
    )
}

export default MoviePage