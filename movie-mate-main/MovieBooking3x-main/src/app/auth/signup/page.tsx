"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import '../auth.css';
import Link from 'next/link';
import { toast } from 'react-toastify';
import logo from '@/assets/logo.png';

interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    city: string;
    contactNumber: string;
}

export default function Signup() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        city: '',
        contactNumber: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        console.log(formData)
        setErrors({})

        const validationErrors: Record<string, string> = {};
        if (!formData.email) {
            validationErrors.email = 'Email is required';
        }
        if (!formData.password) {
            validationErrors.password = 'Password is required';
        }
        if (formData.password !== formData.confirmPassword) {
            validationErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.city) {
            validationErrors.city = 'City is required';
        }
        if (!formData.contactNumber) {
            validationErrors.contactNumber = 'Contact number is required';
        }
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Dummy function for database integration as schema doesn't account for contact number yet
        const registerUserWithContactNumber = async (userData: FormData) => {
            console.log('Would save contact number to database:', userData.contactNumber);
            
            // For now, we'll still use the original API call but note that contactNumber 
            // might be ignored on the backend until schema is updated
            return fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
                credentials:'include'
            });
        };

        // Use the dummy function
        registerUserWithContactNumber(formData)
            .then((res) => {
                return res.json();
            })
            .then((response) => {
                if (response.ok) {
                    toast(response.message, {
                        type: 'success',
                        position: 'top-right',
                        autoClose: 2000
                    })
                    window.location.href = '/auth/signin'
                    setFormData(
                        {
                            name: '',
                            email: '',
                            password: '',
                            confirmPassword: '',
                            city: '',
                            contactNumber: ''
                        }
                    )
                } else {
                    toast(response.message, {
                        type: 'error',
                        position: 'top-right',
                        autoClose: 2000
                    });
                }
            })
            .catch((error) => {
                toast(error.message, {
                    type: 'error',
                    position: 'top-right',
                    autoClose: 2000
                });
            })
    }
    return (
        <div className='authout'>
            <div className='authin'>
                <div className="left">
                    <Image src={logo} alt="MovieMate Logo" className='img' />
                </div>
                <div className='right'>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join us to start your movie adventure</p>
                    <form
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        onSubmit={handleSubmit}
                    >
                        <div className="forminput_cont">
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="Enter Your Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <span className="formerror">{errors.name}</span>}
                        </div>
                        <div className="forminput_cont">
                            <label>Email</label>
                            <input
                                type="text"
                                placeholder="Enter Your Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && <span className="formerror">{errors.email}</span>}
                        </div>
                        <div className="forminput_cont">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter Your Password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {errors.password && (
                                <span className="formerror">{errors.password}</span>
                            )}
                        </div>
                        <div className="forminput_cont">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm Your Password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {errors.confirmPassword && (
                                <span className="formerror">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <div className="forminput_cont">
                            <label>City</label>
                            <input
                                type="text"
                                placeholder="Enter Your City"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                            />
                            {errors.city && (
                                <span className="formerror">{errors.city}</span>
                            )}
                        </div>

                        <div className="forminput_cont">
                            <label>Contact Number</label>
                            <input
                                type="tel"
                                placeholder="Enter Your Contact Number"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                            />
                            {errors.contactNumber && (
                                <span className="formerror">{errors.contactNumber}</span>
                            )}
                        </div>

                        <button type="submit" className="main_button">Sign Up</button>
                        <p className='authlink'>Already have an account? <Link href="/auth/signin">Sign In</Link></p>
                    </form>
                </div>
            </div>
        </div>
    )
}