import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import MovieCard from './MovieCard';
import { MovieCardType } from '@/types/types';

// Import required Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const MovieCarousel = () => {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState<MovieCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/getuser`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const response = await res.json();
      
      if (response.ok) {
        setUser(response.data);
      } else {
        window.location.href = "/auth/signin";
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Failed to authenticate user");
    }
  };

  const getMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/movies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setMovies(data.data);
      } else {
        setError("Failed to fetch movies");
      }
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("An error occurred while fetching movies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getMovies(), getUser()]);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg m-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => { setError(null); getMovies(); }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="carousel-container px-2 sm:px-4 md:px-6 py-8 bg-gradient-to-r from-gray-900 to-black">
      <h2 className="text-3xl font-bold mb-6 text-white text-center">
        <span className="border-b-4 border-red-600 pb-2">Now Showing</span>
      </h2>
      <p className="text-gray-300 text-center mb-8">Book your tickets for these movies</p>
      
      {movies && user ? (
        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={true}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          breakpoints={{
            '640': {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            '768': {
              slidesPerView: 3,
              spaceBetween: 30,
            },
            '1024': {
              slidesPerView: 4,
              spaceBetween: 30,
            },
            '1280': {
              slidesPerView: 5,
              spaceBetween: 30,
            },
          }}
          modules={[Pagination, Navigation, Autoplay]}
          className="mySwiper rounded-xl overflow-hidden"
        >
          {movies.map((movie) => (
            <SwiperSlide key={movie._id} className="p-2 transition-transform duration-300 hover:scale-105">
              <MovieCard Movie={movie} user={user} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-400">No movies available</p>
        </div>
      )}
    </div>
  );
};

export default MovieCarousel;