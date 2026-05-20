"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { 
  AiOutlineUserAdd, 
  AiOutlineMail, 
  AiOutlineLock,
  AiOutlineUser,
  AiOutlineLogin
} from 'react-icons/ai';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(() => null);

        if (response && response.success) {
          // Already logged in, redirect to home
          console.log("User already logged in, redirecting to home...");
          router.replace('/');
        }
      } catch (error) {
        // Error checking auth - that's fine, stay on signup page
        console.log("No existing session detected");
      }
    };

    checkExistingSession();
  }, [router]);

  const handleSignup = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields', {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long', {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }
    
    // Prevent multiple submission attempts
    if (loading || registrationSuccess) return;

    try {
      setLoading(true);
      
      console.log('Attempting registration with:', { name, email });
      console.log('API URL:', API_BASE_URL);
      console.log('Register endpoint:', endpoints.register);
      
      const response = await apiRequest(endpoints.register, {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      console.log('Registration response:', response);
      
      if (response && response.success) {
        console.log('Registration successful:', response);
        
        // Mark registration as successful to prevent duplicate submissions
        setRegistrationSuccess(true);
        
        toast.success('Registration successful! Redirecting to login...', {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 2000
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/pages/auth/signin');
        }, 2000);
      } else {
        console.error('Registration failed:', response);
        toast.error(response?.message || 'Registration failed. Please try again.', {
          position: toast.POSITION.TOP_CENTER,
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error during registration:', error);
      toast.error(`Registration failed: ${error.message || 'Please try again later'}`, {
        position: toast.POSITION.TOP_CENTER,
      });
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignup();
    }
  };

  return (
    <div className="auth-container">
      <ToastContainer />
      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-card-title">
            <AiOutlineUserAdd style={{ marginRight: '8px' }} /> Create Admin Account
          </h1>
        </div>
        
        <div className="auth-card-body">
          <div style={{ marginBottom: '20px' }}>
            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray-text)' }}>
              API URL: {API_BASE_URL}{endpoints.register}
            </p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Name</label>
            <div style={{ position: 'relative' }}>
              <AiOutlineUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ paddingLeft: '40px' }}
                disabled={loading || registrationSuccess}
              />
            </div>
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
                disabled={loading || registrationSuccess}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <AiOutlineLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ paddingLeft: '40px' }}
                disabled={loading || registrationSuccess}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <AiOutlineLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ paddingLeft: '40px' }}
                disabled={loading || registrationSuccess}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSignup}
              disabled={loading || registrationSuccess}
              style={{ width: '100%' }}
            >
              {loading ? (
                <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: '0' }}></div>
              ) : registrationSuccess ? (
                "Redirecting to Login..."
              ) : (
                <>
                  <AiOutlineUserAdd /> Create Account
                </>
              )}
            </button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Already have an account?</p>
            <Link href="/pages/auth/signin">
              <button className="btn btn-outline" style={{ marginTop: '10px' }} disabled={loading || registrationSuccess}>
                <AiOutlineLogin /> Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;