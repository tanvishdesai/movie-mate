import React from 'react'
import { MovieCardType } from '@/types/types';
import { useRouter } from 'next/navigation';
import { BsFillStarFill, BsCalendarCheck } from 'react-icons/bs';
import { FaPlay } from 'react-icons/fa';
import Link from 'next/link';
import './MovieCard.css'

interface MovieCardProps {
  Movie: MovieCardType;
  user: {
    city: string;
    name: string;
    _id: string;
  }
}

const MovieCard: React.FC<MovieCardProps> = ({ Movie, user }) => {
    const router = useRouter();
    const { _id, title, genre, rating, portraitImgUrl } = Movie;
    const { city } = user;
    
    const handleCardClick = () => {
      router.push(`/${city}/movies/${_id}`);
    };

    return (
        <div className="movie-card" onClick={handleCardClick}>
            <div className="movie-card-poster" style={{ backgroundImage: `url(${portraitImgUrl})` }}>
                <div className="movie-card-overlay">
                    <span className="movie-card-rating">
                        <BsFillStarFill className="star-icon" />
                        <span>{rating}/10</span>
                    </span>
                    
                    <div className="movie-card-actions">
                        <button className="trailer-button">
                            <FaPlay />
                        </button>
                        
                        <Link href={`/${city}/movies/${_id}/buytickets`} className="book-now-button" onClick={(e) => e.stopPropagation()}>
                            <BsCalendarCheck />
                            <span>Book</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            <div className="movie-card-details">
                <h3 className="movie-card-title">{title}</h3>
                <p className="movie-card-genre">{genre.join(", ")}</p>
            </div>
        </div>
    )
}

export default MovieCard