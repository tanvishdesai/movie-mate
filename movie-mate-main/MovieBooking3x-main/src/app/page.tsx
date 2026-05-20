"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BsFillStarFill, BsCalendarCheck, BsClock } from 'react-icons/bs'
import { MdLocalMovies, MdLocationOn } from 'react-icons/md'
import { FaPlay } from 'react-icons/fa'
import HomeSlider from '@/components/HomeSlider/HomeSlider'
import MovieCarousel from '@/components/moviecarousel/MovieCarousel'
import './HomePage.css'
import { useRouter } from 'next/navigation'

interface Movie {
  _id: string;
  title: string;
  description: string;
  portraitImgUrl: string;
  landscapeImgUrl: string;
  rating: number;
  genre: string[];
  duration: number;
}

interface User {
  _id: string;
  name: string;
  city: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const checkLogin = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/checklogin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!data.ok) {
        window.location.href = "/auth/signin"
      }
    } catch (error) {
      console.error("Authentication error:", error)
      window.location.href = "/auth/signin"
    }
  }

  const getUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/getuser`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.ok) {
        setUser(data.data)
      } else {
        window.location.href = "/auth/signin"
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      window.location.href = "/auth/signin"
    }
  }

  const getFeaturedMovies = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/movies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.ok) {
        // Get top 3 rated movies for featured section
        const sortedMovies = [...data.data].sort((a, b) => b.rating - a.rating).slice(0, 3)
        setFeaturedMovies(sortedMovies)
      } else {
        setError('Failed to load movies')
      }
    } catch (error) {
      console.error("Error fetching movies:", error)
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkLogin()
    getUser()
    getFeaturedMovies()
  }, [])

  if (loading && !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading movies...</p>
      </div>
    )
  }

  return (
    <main className="home-page">
      {/* Banner Slider Section */}
      <section className="banner-section">
        <HomeSlider />
      </section>

      {/* Featured Movies Section */}
      {featuredMovies.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Featured Movies</h2>
              <p className="section-subtitle">Top rated films now playing in theaters</p>
            </div>

            <div className="featured-movies">
              {featuredMovies.map((movie) => (
                <div 
                  key={movie._id} 
                  className="featured-movie-card"
                  onClick={() => user && router.push(`/${user.city}/movies/${movie._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="featured-movie-backdrop" 
                    style={{ backgroundImage: `url(${movie.landscapeImgUrl})` }}
                  >
                    <div className="featured-movie-overlay">
                      <div className="featured-movie-content">
                        <div className="featured-movie-poster" style={{ backgroundImage: `url(${movie.portraitImgUrl})` }}>
                          <button className="play-trailer-btn" onClick={(e) => e.stopPropagation()}>
                            <FaPlay />
                          </button>
                        </div>
                        
                        <div className="featured-movie-details">
                          <h3 className="featured-movie-title">{movie.title}</h3>
                          
                          <div className="featured-movie-meta">
                            <span className="featured-movie-rating">
                              <BsFillStarFill className="star-icon" />
                              {movie.rating}/10
                            </span>
                            <span className="meta-divider">•</span>
                            <span className="featured-movie-duration">
                              <BsClock />
                              {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                            </span>
                            <span className="meta-divider">•</span>
                            <span className="featured-movie-genres">
                              <MdLocalMovies />
                              {movie.genre.join(', ')}
                            </span>
                          </div>
                          
                          <p className="featured-movie-description">
                            {movie.description.length > 150 
                              ? `${movie.description.substring(0, 150)}...` 
                              : movie.description}
                          </p>
                          
                          {user && (
                            <Link 
                              href={`/${user.city}/movies/${movie._id}/buytickets`} 
                              className="featured-movie-btn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <BsCalendarCheck /> Book Tickets
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* City Location Section */}
      {user && (
        <section className="location-section">
          <div className="container">
            <div className="location-indicator">
              <MdLocationOn className="location-icon" />
              <span>Showing movies in <strong>{user.city.charAt(0).toUpperCase() + user.city.slice(1)}</strong></span>
            </div>
          </div>
        </section>
      )}
      
      {/* Now Playing Section */}
      <section className="now-playing-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Now Playing</h2>
            <p className="section-subtitle">Book your tickets for these movies</p>
          </div>
          
          <div className="movie-carousel-container">
            {user && <MovieCarousel />}
          </div>
        </div>
      </section>
      
      {/* Coming Soon Section (Placeholder) */}
      <section className="coming-soon-section">
        <div className="container">
          <div className="section-divider">
            <div className="divider-line"></div>
            <h2 className="divider-text">Coming Soon</h2>
            <div className="divider-line"></div>
          </div>
          
          <div className="coming-soon-placeholder">
            <div className="coming-soon-icon">
              <FaPlay />
            </div>
            <p>New releases are on the way! Check back soon for upcoming movies.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
