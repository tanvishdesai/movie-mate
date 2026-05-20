import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Link from 'next/link';
import './HomeSlider.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Banner {
  id: number;
  imgUrl: string;
  title: string;
  subtitle: string;
  link: string;
}

const HomeSlider = () => {
  const [banners] = useState<Banner[]>([
    {
      id: 1,
      imgUrl: 'https://assets-in.bmscdn.com/promotions/cms/creatives/1693561351496_motogpsepdesktop.jpg',
      title: 'Experience Racing on the Big Screen',
      subtitle: 'Catch all the MotoGP action in theaters',
      link: '/bangalore/movies'
    },
    {
      id: 2,
      imgUrl: 'https://assets-in.bmscdn.com/promotions/cms/creatives/1693472198837_iccdesktop.jpg',
      title: 'Cricket World Cup 2023',
      subtitle: 'Book your tickets for the biggest cricket event',
      link: '/delhi/movies'
    },
    {
      id: 3,
      imgUrl: 'https://assets-in.bmscdn.com/promotions/cms/creatives/1696512867152_jokerdesktop.jpg',
      title: 'Joker: Folie à Deux',
      subtitle: 'Coming soon to theaters near you',
      link: '/mumbai/movies'
    }
  ]);

  return (
    <div className="home-slider-container">
      <Swiper
        navigation={true}
        pagination={{
          clickable: true,
        }}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        slidesPerView={1}
        modules={[Navigation, Pagination, Autoplay]}
        className="banner-swiper"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="banner-wrapper">
              <div 
                className="banner-slide"
                style={{ backgroundImage: `url(${banner.imgUrl})` }}
              >
                <div className="banner-content">
                  <h2>{banner.title}</h2>
                  <p>{banner.subtitle}</p>
                  <Link href={banner.link} className="banner-button">
                    Explore Now
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HomeSlider;