"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { 
  AiOutlineLogin, 
  AiOutlineMail, 
  AiOutlineLock,
  AiOutlineUserAdd
} from 'react-icons/ai';

const SigninPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();

  // Check if the user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check if we have a loggedout parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const loggedOut = urlParams.get('loggedout');
        
        if (loggedOut) {
          console.log("User has been logged out");
          // Clear any remaining auth data
          localStorage.clear();
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          // Don't check for existing session if we just logged out
          return;
        }
        
        // Check if we have an adminId in localStorage
        const adminId = localStorage.getItem('adminId');
        if (!adminId) {
          console.log("No adminId found in localStorage, user needs to log in");
          return; // No need to check session if we don't have an adminId
        }
        
        console.log("Checking for existing session with adminId:", adminId);
        
        // Try direct fetch first to avoid CORS issues
        try {
          const directResponse = await fetch(`${API_BASE_URL}/admin/public/checklogin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ adminId }),
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log("Direct fetch session check response:", data);
            
            if (data.ok || data.success) {
              // Already logged in, redirect to home
              console.log("User already logged in, redirecting to home...");
              router.replace('/');
              return;
            }
          }
        } catch (directError) {
          console.error("Direct fetch session check failed:", directError);
          // Continue to try the API utility method
        }
        
        // Fall back to API utility if direct fetch fails
        console.log("Falling back to API utility for session check...");
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(() => null);

        if (response && response.success) {
          // Already logged in, redirect to home
          console.log("User already logged in, redirecting to home...");
          router.replace('/');
        }
      } catch (error) {
        // Error checking auth - that's fine, stay on login page
        console.log("No existing session detected or error checking session:", error);
      }
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields', {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    // Prevent multiple login attempts
    if (loading || loginSuccess) return;

    try {
      setLoading(true);
      
      console.log('Attempting login with:', { email });
      console.log('API URL:', API_BASE_URL);
      
      // Try direct fetch first to avoid any issues with the API utility
      try {
        console.log('Trying direct fetch login...');
        setLoading(true);
        
        const directResponse = await fetch(`${API_BASE_URL}/admin/public/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password 
          }),
          mode: 'cors',
          credentials: 'omit'
        });
        
        console.log('Direct fetch response status:', directResponse.status);
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log('Direct fetch login successful:', data);
          
          if (data.ok || data.success) {
            // Store admin token and ID in localStorage
            if (data.data) {
              // Store admin ID
              if (data.data.admin && data.data.admin._id) {
                localStorage.setItem('adminId', data.data.admin._id);
                console.log('Admin ID stored in localStorage:', data.data.admin._id);
              }
              
              // Store admin token
              if (data.data.adminAuthToken) {
                localStorage.setItem('adminAuthToken', data.data.adminAuthToken);
                console.log('Admin auth token stored in localStorage');
              }
            }
            
            setLoginSuccess(true);
            toast.success('Login successful! Redirecting...', {
              position: toast.POSITION.TOP_CENTER,
              autoClose: 1000
            });
            
            // Redirect
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
            
            return; // Exit early if direct fetch succeeds
          }
        } else {
          // If the response is not OK, try to get error details
          try {
            const errorData = await directResponse.json();
            console.error('Login failed:', errorData);
            toast.error(errorData.message || 'Login failed. Please check your credentials.', {
              position: toast.POSITION.TOP_CENTER
            });
            setLoading(false);
            return; // Exit early to prevent the API utility attempt
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            // Continue to API utility method
          }
        }
      } catch (directError) {
        console.error('Direct fetch login failed:', directError);
        // Continue to try the API utility method
      }
      
      // Fall back to API utility if direct fetch fails
      console.log('Falling back to API utility login...');
      console.log('Login endpoint:', endpoints.login);
      
      const response = await apiRequest(endpoints.login, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }).catch(error => {
        console.error('Login API call failed:', error);
        throw error;
      });

      console.log('Login response:', response); // Log the full response for debugging

      if (response && (response.success || response.status === 'success')) {
        console.log('Login successful, redirecting now...');
        
        // Mark login as successful to prevent duplicate attempts
        setLoginSuccess(true);
        
        // Store admin token and ID in localStorage
        if (response.data) {
          // Store admin ID
          if (response.data.admin && response.data.admin._id) {
            localStorage.setItem('adminId', response.data.admin._id);
            console.log('Admin ID stored in localStorage:', response.data.admin._id);
          }
          
          // Store admin token
          if (response.data.adminAuthToken) {
            localStorage.setItem('adminAuthToken', response.data.adminAuthToken);
            console.log('Admin auth token stored in localStorage');
          }
        }
        
        toast.success('Login successful! Redirecting...', {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 1000
        });
        
        // Use immediate redirection with window.location for more reliability
        setTimeout(() => {
          // Force a hard redirect which is more reliable than router.push
          window.location.href = '/';
          
          // Fallback to router.push only if window.location doesn't trigger
          setTimeout(() => {
            if (window.location.pathname.includes('/pages/auth/signin')) {
              router.push('/');
            }
          }, 500);
        }, 500);
      } else {
        console.log('Login response unsuccessful:', response);
        toast.error(response?.message || 'Login failed. Please check your credentials.', {
          position: toast.POSITION.TOP_CENTER,
        });
        // Reset loading state to allow retry
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      toast.error(`Login failed: ${error.message || 'Please try again later'}`, {
        position: toast.POSITION.TOP_CENTER,
      });
      // Reset loading state to allow retry
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };
  
  return (
    <div className="auth-container">
      <ToastContainer />
      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">
            <AiOutlineLogin style={{ marginRight: '8px' }} /> Admin Login
          </h1>
        </div>
        
        <div className="auth-card-body">
          <div style={{ marginBottom: '20px' }}>
            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray-text)' }}>
              API URL: {API_BASE_URL}
            </p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <AiOutlineMail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ paddingLeft: '40px' }}
                disabled={loading || loginSuccess}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <AiOutlineLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ paddingLeft: '40px' }}
                disabled={loading || loginSuccess}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleLogin}
              disabled={loading || loginSuccess}
              style={{ width: '100%' }}
            >
              {loading ? (
                <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: '0' }}></div>
              ) : loginSuccess ? (
                "Redirecting..."
              ) : (
                <>
                  <AiOutlineLogin /> Sign In
                </>
              )}
            </button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Don't have an account?</p>
            <Link href="/pages/auth/signup">
              <button className="btn btn-outline" style={{ marginTop: '10px' }} disabled={loading || loginSuccess}>
                <AiOutlineUserAdd /> Create Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;