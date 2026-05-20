"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Navbar.css';
import logo from './logo.png';
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { 
  AiOutlineHome, 
  AiOutlineVideoCamera, 
  AiOutlineCalendar, 
  AiOutlineLogin, 
  AiOutlineUserAdd, 
  AiOutlineMenu,
  AiOutlineAppstore,
  AiOutlineLogout,
  AiOutlineDollar
} from 'react-icons/ai';

const Navbar = () => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [adminName, setAdminName] = useState('Admin');
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    // Check if we're on an auth page (signin or signup)
    const isAuthPage = pathname?.includes('/pages/auth/signin') || pathname?.includes('/pages/auth/signup');
    
    const checkAdminAuthentication = async () => {
        setIsLoading(true);
        try {
            // Use the apiRequest utility for consistent error handling
            const response = await apiRequest(endpoints.checkLogin, {
                method: 'GET'
            });
            
            console.log('Auth check response:', response);
            
            // Check for various success response formats
            if (response && (response.success || response.status === 'success' || (response.admin && response.admin.name))) {
                console.log('Authentication verified in Navbar');
                setIsAdminAuthenticated(true);
                if (response.admin && response.admin.name) {
                    setAdminName(response.admin.name);
                }
            } else {
                console.log('Not authenticated, should redirect from Navbar');
                setIsAdminAuthenticated(false);
                
                // If not authenticated and not already on an auth page, redirect to login
                if (!isAuthPage) {
                    console.log('Redirecting to login from Navbar...');
                    // Use window.location for a more reliable redirect
                    window.location.href = '/pages/auth/signin';
                }
            }
        }
        catch (error) {
            console.error('An error occurred during admin authentication check', error);
            setIsAdminAuthenticated(false);
            
            // If not authenticated and not already on an auth page, redirect to login
            if (!isAuthPage) {
                console.log('Redirecting to login from Navbar after error...');
                window.location.href = '/pages/auth/signin';
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleLogout = async () => {
        try {
            console.log('Starting logout process...');
            
            // First mark as unauthenticated to prevent flash of authenticated UI
            setIsAdminAuthenticated(false);
            
            // Add cache control headers to prevent caching of auth responses
            const response = await apiRequest(endpoints.logout, {
                method: 'POST',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                credentials: 'include'
            });
            
            console.log('Logout API response:', response);
            
            // Create a small delay to ensure server processes the logout
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Clear any localStorage items that might contain auth data
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminToken');
            localStorage.clear(); // Clear all localStorage items
            
            // Clear cookies by setting expired date
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // Force clear any cached credentials by making a request with omit credentials
            try {
                // Make a dummy request to reset credentials
                fetch(`${API_BASE_URL}/admin/checklogin`, {
                    method: 'GET',
                    credentials: 'omit' as RequestCredentials
                }).catch(() => {
                    console.log('Made a request with cleared credentials');
                });
            } catch (e) {
                console.log('Error during credential clearing attempt', e);
            }
            
            console.log('All auth data cleared, redirecting to login...');
            
            // Use a complete page reload instead of navigation
            // This ensures a fresh page load with no cached state
            window.location.replace('/pages/auth/signin?loggedout=true');
        }
        catch (error) {
            console.error('An error occurred during logout', error);
            // Even on error, force a hard redirect
            window.location.replace('/pages/auth/signin?loggedout=true&error=true');
        }
    }

    const toggleMobileMenu = () => {
        setIsMobileOpen(!isMobileOpen);
    }

    useEffect(() => {
        // Only check authentication if we're not on an auth page
        if (!isAuthPage) {
            checkAdminAuthentication();
        }
    }, [pathname, isAuthPage]);

    // Display loading state while checking authentication on non-auth pages
    if (isLoading && !isAuthPage) {
        return <div className="loading-container">Loading...</div>;
    }

    // If we're on an auth page, don't render the navbar at all
    if (isAuthPage) {
        return null;
    }

    return (
        <>
            <button className="mobile-toggle" onClick={toggleMobileMenu}>
                <AiOutlineMenu />
            </button>
            
            <div className={`navbar ${isMobileOpen ? 'open' : ''}`}>
                <div className="navbar-header">
                    <Image src={logo} alt="MovieMate Admin" className="logo" width={100} height={50} />
                </div>
                
                <div className="navbar-links">
                    {isAdminAuthenticated ? (
                        <>
                            <div className="nav-section">
                                <div className="section-title">Dashboard</div>
                                <Link href="/" className={pathname === '/' ? 'active' : ''}>
                                    <span className="nav-icon"><AiOutlineHome /></span>
                                    Home
                                </Link>
                            </div>
                            
                            <div className="nav-section">
                                <div className="section-title">Content Management</div>
                                <Link href="/pages/movie/createmovie" className={pathname === '/pages/movie/createmovie' ? 'active' : ''}>
                                    <span className="nav-icon"><AiOutlineVideoCamera /></span>
                                    Add Movie
                                </Link>
                                <Link href="/pages/movie/managemovies" className={pathname === '/pages/movie/managemovies' ? 'active' : ''}>
                                    <span className="nav-icon"><AiOutlineAppstore /></span>
                                    Manage Movies
                                </Link>
                            </div>
                            
                            <div className="nav-section">
                                <div className="section-title">Theater Management</div>
                                <Link href="/pages/screen" className={pathname === '/pages/screen' ? 'active' : ''}>
                                    <span className="nav-icon"><AiOutlineVideoCamera /></span>
                                    Add Screen
                                </Link>
                                <Link href="/pages/schedule" className={pathname === '/pages/schedule' ? 'active' : ''}>
                                    <span className="nav-icon"><AiOutlineCalendar /></span>
                                    Add Schedule
                                </Link>
                            </div>
                            
                            <div className="nav-section">
                                <div className="section-title">Payments</div>
                                <Link href="/pages/payments" className={pathname === '/pages/payments' ? 'active' : ''}>
                                    <span className="nav-icon"><AiOutlineDollar /></span>
                                    Manage Payments
                                </Link>
                            </div>
                            
                            <div className="nav-section">
                                <div className="section-title">Account</div>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                    <span className="nav-icon"><AiOutlineLogout /></span>
                                    Logout
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="nav-section">
                            <div className="section-title">Account</div>
                            <Link href='/pages/auth/signin' className={pathname === '/pages/auth/signin' ? 'active' : ''}>
                                <span className="nav-icon"><AiOutlineLogin /></span>
                                Login
                            </Link>
                            <Link href='/pages/auth/signup' className={pathname === '/pages/auth/signup' ? 'active' : ''}>
                                <span className="nav-icon"><AiOutlineUserAdd /></span>
                                Signup
                            </Link>
                        </div>
                    )}
                </div>
                
                <div className="navbar-footer">
                    <div className="version-tag">MovieMate Admin v1.0</div>
                </div>
            </div>
        </>
    )
}

export default Navbar;