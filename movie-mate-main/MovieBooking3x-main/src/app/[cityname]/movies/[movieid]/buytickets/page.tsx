"use client"
import React, { useState, useEffect } from 'react'
import DatePicker from "react-horizontal-datepicker";
import './BuyTicketsPage.css'
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation'
import { format, addDays } from 'date-fns';

// Define proper types
interface Movie {
  _id: string;
  title: string;
  description: string;
  portraitImgUrl: string;
  landscapeImgUrl: string;
  rating: number;
  genre: string[];
  language: string;
  duration: number;
}

interface Theatre {
  _id: string;
  name: string;
  location: string;
}

const BuyTicketsPage = () => {
    const pathname = usePathname()
    const params = useParams()
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [formattedDate, setFormattedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const { movieid, cityname } = params
    const [movie, setMovie] = useState<Movie | null>(null)
    const [theatres, setTheatres] = useState<Theatre[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const getMovie = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/movies/${movieid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();
            if (data.ok) {
                setMovie(data.data);
            }
        } catch (err) {
            console.error("Error fetching movie:", err);
        } finally {
            setLoading(false);
        }
    }

    const getTheatres = async (date: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_API}/movie/screensbymovieschedule/${cityname}/${date}/${movieid}`, 
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                }
            );
            const data = await response.json();
            if (data.ok) {
                setTheatres(data.data);
            } else {
                setTheatres([]);
            }
        } catch (err) {
            console.error("Error fetching theatres:", err);
            setTheatres([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getMovie();
    }, []);

    useEffect(() => {
        // Update formatted date when selectedDate changes
        const formatted = format(selectedDate, 'yyyy-MM-dd');
        setFormattedDate(formatted);
        getTheatres(formatted);
    }, [selectedDate]);

    // Custom date selector component that displays 7 days 
    const renderCustomDateSelector = () => {
        const dates = Array.from({length: 7}, (_, i) => addDays(new Date(), i));
        
        return (
            <div className="custom-date-selector">
                {dates.map((date, index) => (
                    <div 
                        key={index}
                        className={`date-option ${selectedDate.toDateString() === date.toDateString() ? 'active' : ''}`}
                        onClick={() => setSelectedDate(date)}
                    >
                        <div className="day-name">{format(date, 'EEE')}</div>
                        <div className="date-number">{format(date, 'd')}</div>
                        <div className="month-name">{format(date, 'MMM')}</div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading && !movie) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading movie details...</p>
            </div>
        );
    }

    return (
        <>
            {movie && (
                <div className='buytickets-container'>
                    <div className='movie-header'>
                        <div className='movie-info'>
                            <h1>{movie.title} {movie.language && `- ${movie.language}`}</h1>
                            {movie.genre && movie.genre.length > 0 && (
                                <div className="genre-tags">
                                    {movie.genre.map((genre, index) => (
                                        <span key={index} className="genre-tag">{genre}</span>
                                    ))}
                                </div>
                            )}
                            {movie.duration && (
                                <div className="duration">
                                    <i className="far fa-clock"></i> {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='date-selection-section'>
                        <h2>Select Date</h2>
                        {renderCustomDateSelector()}
                    </div>

                    <div className='theatres-section'>
                        <h2>Available Theatres</h2>
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Finding theatres...</p>
                            </div>
                        ) : theatres.length > 0 ? (
                            <div className='theatres-list'>
                                {theatres.map((theatre: Theatre, index: number) => (
                                    <div className='theatre-card' key={index}>
                                        <div className='theatre-info'>
                                            <h3>{theatre.name}</h3>
                                            <p>{theatre.location}</p>
                                            <div className="amenities">
                                                <span className="amenity">Food & Beverages</span>
                                                <span className="amenity">Wheelchair Access</span>
                                            </div>
                                        </div>
                                        <Link 
                                            href={`${pathname}/${theatre._id}?date=${formattedDate}`} 
                                            className='select-btn'
                                        >
                                            Select Seats
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-theatres">
                                <i className="fas fa-exclamation-circle"></i>
                                <p>No theatres available for this date. Please select another date.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default BuyTicketsPage 