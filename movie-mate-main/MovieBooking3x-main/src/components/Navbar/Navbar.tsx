"use client"
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import './Navbar.css'
import { BiUserCircle, BiSearch, BiMenu } from 'react-icons/bi'
import { RiArrowDropDownFill } from 'react-icons/ri'
import { FaTicketAlt } from 'react-icons/fa'
import { MdLocationOn, MdLocalMovies, MdClose } from 'react-icons/md'
import logo from '@/assets/logo.png'
import Image from 'next/image'
import LocationPopup from '@/popups/location/LocationPopup'

const Navbar = () => {
    const [showLocationPopup, setShowLocationPopup] = useState<boolean>(false)
    const [user, setUser] = useState<any>(null)
    const [loggedIn, setLoggedIn] = useState<boolean>(false)
    const [searchFocused, setSearchFocused] = useState<boolean>(false)
    const [scrolled, setScrolled] = useState<boolean>(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

    const getuser = async () => {
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
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    const handleLogout = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/logout`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            const response = await res.json();
            if (response.ok) {
                window.location.href = "/auth/signin";
            }
        } catch (error) {
            console.error('Error during logout:', error);
            window.location.href = "/auth/signin";
        }
    }

    const checkLogin = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/checklogin`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            const response = await res.json();
            setLoggedIn(response.ok);
        } catch (error) {
            console.error('Error checking login status:', error);
            setLoggedIn(false);
        }
    }

    useEffect(() => {
        checkLogin();
        getuser();

        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        
        // Close mobile menu when resizing to desktop
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setMobileMenuOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <header className={`navbar-container ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-content">
                <div className="navbar-left">
                    <div className="navbar-top-row">
                        <Link href="/" className="navbar-logo">
                            <Image src={logo} alt="MovieMate" width={120} height={30} priority className="logo-image" />
                        </Link>
                        
                        {/* Mobile menu toggle button */}
                        <button 
                            className="mobile-menu-toggle"
                            onClick={toggleMobileMenu}
                            aria-label="Toggle mobile menu"
                        >
                            {mobileMenuOpen ? <MdClose size={24} /> : <BiMenu size={24} />}
                        </button>
                    </div>
                    
                    <div className={`navbar-search ${searchFocused ? 'focused' : ''}`}>
                        <BiSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search for movies, events, plays, sports and more" 
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                    </div>
                </div>

                <div className={`navbar-right ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <button 
                        className="location-button"
                        onClick={() => setShowLocationPopup(true)}
                    >
                        <MdLocationOn className="location-icon" />
                        <span className="location-text">{user?.city || "Select City"}</span>
                        <RiArrowDropDownFill className="dropdown-icon" />
                    </button>

                    <Link href="/movies" className="nav-link">
                        <MdLocalMovies className="nav-icon" />
                        <span>Movies</span>
                    </Link>

                    {loggedIn && (
                        <Link href="/profile?section=bookings" className="nav-link" title="View your bookings">
                            <FaTicketAlt className="nav-icon" />
                            <span>Tickets</span>
                        </Link>
                    )}

                    <div className="auth-section">
                        {loggedIn ? (
                            <>
                                <Link href="/profile" className="user-profile">
                                    <BiUserCircle className="user-icon" />
                                    <span className="username">{user?.name?.split(' ')[0] || 'Profile'}</span>
                                </Link>
                                <button className="auth-button logout" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link href="/auth/signin" className="auth-button login">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {showLocationPopup && (
                <LocationPopup setShowLocationPopup={setShowLocationPopup} />
            )}
        </header>
    )
}

export default Navbar