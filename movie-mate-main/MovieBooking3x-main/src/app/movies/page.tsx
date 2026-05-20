"use client"
import React, { useState, useEffect } from 'react'
import { BsInfoCircle } from 'react-icons/bs'
import MovieCard from '@/components/moviecarousel/MovieCard'
import { MovieCardType } from '@/types/types'
import './MoviesPage.css'
import LocationPopup from '@/popups/location/LocationPopup'

const MoviesPage = () => {
    const [movies, setMovies] = useState<MovieCardType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [user, setUser] = useState<any>(null)
    const [showLocationPopup, setShowLocationPopup] = useState(false)

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
                if (!data.data.city) {
                    setShowLocationPopup(true)
                }
            }
        } catch (error) {
            console.error('Error fetching user:', error)
        }
    }

    const getMovies = async () => {
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
                setMovies(data.data)
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
        getUser()
        getMovies()
    }, [])

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading movies...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-container">
                <BsInfoCircle size={50} />
                <h2>Oops! {error}</h2>
                <button onClick={getMovies} className="retry-btn">Try Again</button>
            </div>
        )
    }

    if (!user?.city) {
        return (
            <div className="location-prompt-container">
                <div className="location-prompt">
                    <h2>Select Your City</h2>
                    <p>Please select your city to browse movies in your area</p>
                    <button onClick={() => setShowLocationPopup(true)} className="select-city-btn">
                        Select City
                    </button>
                </div>
                {showLocationPopup && (
                    <LocationPopup setShowLocationPopup={setShowLocationPopup} />
                )}
            </div>
        )
    }

    return (
        <div className="movies-page">
            <div className="movies-header">
                <h1>Movies in {user.city}</h1>
                <p>Browse through our collection of movies</p>
            </div>
            <div className="movies-grid">
                {movies.map((movie) => (
                    <MovieCard key={movie._id} Movie={movie} user={user} />
                ))}
            </div>
            {showLocationPopup && (
                <LocationPopup setShowLocationPopup={setShowLocationPopup} />
            )}
        </div>
    )
}

export default MoviesPage 