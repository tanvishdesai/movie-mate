"use client"
import React, { useEffect, useState } from 'react'
import './ProfilePage.css'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'

const ProfilePage = () => {
    const [bookings, setBookings] = useState<any>(null)
    const [privateScreenings, setPrivateScreenings] = useState<any>(null) 
    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState('bookings')
    const searchParams = useSearchParams()

    const getBookings = async () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/getuserbookings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    setBookings(data.data)
                }
                else {
                    console.log(data)
                }
            })
    }

    const getPrivateScreenings = async () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/privatescreening/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    setPrivateScreenings(data.data)
                }
                else {
                    console.log(data)
                }
            })
            .catch((err) => {
                console.log(err)
            })
    }

    const getUserData = async () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/getuser`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    setUser(data.data)
                }
                else {
                    console.log(data)
                }
            })
            .catch((err) => {
                console.log(err)
            })
    }

    const handlePayment = (requestId: string) => {
        // In a real application, you would integrate with a payment gateway here
        // For this demo, we'll simulate a payment
        const paymentId = `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/privatescreening/${requestId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                paymentId,
                paymentType: 'online'
            })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    toast.success('Payment successful');
                    getPrivateScreenings(); // Refresh the list
                } else {
                    toast.error(data.message || 'Payment failed');
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error('Something went wrong');
            });
    };

    useEffect(() => {
        getBookings()
        getPrivateScreenings()
        getUserData()

        // Check if we should set active tab based on URL params
        const section = searchParams.get('section')
        if (section === 'private-screenings') {
            setActiveTab('privateScreenings')
        } else if (section === 'bookings') {
            setActiveTab('bookings')
        }
    }, [searchParams])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#f0ad4e'; // Orange
            case 'approved':
                return '#5cb85c'; // Green
            case 'rejected':
                return '#d9534f'; // Red
            case 'cancelled':
                return '#777777'; // Gray
            case 'completed':
                return '#0275d8'; // Blue
            default:
                return '#777777';
        }
    };

    return (
        <div className='profile'>
            <section className='user-section'>
                <h1 className='head'>Profile</h1>
                <div className='user'>
                    <h2>User Details</h2>
                    <div className='details'>
                        <div className='detail'>
                            <h3>Name</h3>
                            <p>{user?.name}</p>
                        </div>
                        <div className='detail'>
                            <h3>Email</h3>
                            <p>{user?.email}</p>
                        </div>
                        <div className='detail'>
                            <h3>City</h3>
                            <p>{user?.city}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="profile-tabs">
                <button 
                    className={activeTab === 'bookings' ? 'active' : ''} 
                    onClick={() => setActiveTab('bookings')}
                >
                    Regular Bookings
                </button>
                <button 
                    className={activeTab === 'privateScreenings' ? 'active' : ''} 
                    onClick={() => setActiveTab('privateScreenings')}
                >
                    Private Screenings
                </button>
            </div>

            {activeTab === 'bookings' && (
                <section id="bookings-section" className='bookings'>
                    <h2>Your Bookings</h2>
                    <div className='details'>
                        {bookings && bookings.length > 0 ? (
                            bookings.map((booking: any) => (
                                booking && (
                                    <div className='booking' key={booking._id}>
                                        <div className='booking-header'>
                                            <h3>{booking && booking.movieId ? booking.movieId.title : 'Movie information unavailable'}</h3>
                                            <span className="booking-date">
                                                {booking.showDate ? new Date(booking.showDate).toLocaleDateString() : 'Date unavailable'} at {booking.showTime || 'Time unavailable'}
                                            </span>
                                        </div>
                                        <div className='booking-details'>
                                            <div className='detail'>
                                                <h4>Screen</h4>
                                                <p>{booking.screenId && booking.screenId.name ? booking.screenId.name : (booking.screenName || 'Screen information unavailable')}</p>
                                            </div>
                                            <div className='detail'>
                                                <h4>Seats</h4>
                                                <p>
                                                    {booking.seats && booking.seats.length > 0 ? booking.seats.map((seat: any, index: number) => (
                                                        <span key={seat._id || index}>
                                                            {seat.seat_id}{index < booking.seats.length - 1 ? ', ' : ''}
                                                        </span>
                                                    )) : 'Seat information unavailable'}
                                                </p>
                                            </div>
                                            <div className='detail'>
                                                <h4>Total Price</h4>
                                                <p>₹{booking.totalPrice || 'Price unavailable'}</p>
                                            </div>
                                            <div className='detail'>
                                                <h4>Payment Info</h4>
                                                <p>{booking.paymentType || 'Payment type unavailable'} - {booking.upiTransactionId || booking.paymentId || 'Payment ID unavailable'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div className="no-bookings">
                                <p>No bookings found. Book your first movie now!</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'privateScreenings' && (
                <section id="private-screenings-section" className='private-screenings'>
                    <h2>Your Private Screening Requests</h2>
                    <div className='details'>
                        {privateScreenings && privateScreenings.length > 0 ? (
                            privateScreenings.map((screening: any) => (
                                screening && (
                                    <div className='private-screening' key={screening._id}>
                                        <div className='screening-header'>
                                            <h3>{screening && screening.movieId ? screening.movieId.title : 'Movie information unavailable'}</h3>
                                            <span 
                                                className="screening-status"
                                                style={{ backgroundColor: getStatusColor(screening.status || 'pending') }}
                                            >
                                                {(screening.status || 'PENDING').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className='screening-details'>
                                            <div className='detail'>
                                                <h4>Requested Date & Time</h4>
                                                <p>{screening.requestedDate ? new Date(screening.requestedDate).toLocaleDateString() : 'Date unavailable'} at {screening.requestedTime || 'Time unavailable'}</p>
                                            </div>
                                            <div className='detail'>
                                                <h4>Number of Guests</h4>
                                                <p>{screening.numberOfGuests || 'Guest count unavailable'}</p>
                                            </div>
                                            {screening.specialRequests && (
                                                <div className='detail'>
                                                    <h4>Special Requests</h4>
                                                    <p>{screening.specialRequests}</p>
                                                </div>
                                            )}
                                            {screening.screenId && screening.screenId.name && (
                                                <div className='detail'>
                                                    <h4>Assigned Screen</h4>
                                                    <p>{screening.screenId.name}</p>
                                                </div>
                                            )}
                                            {screening.price && (
                                                <div className='detail'>
                                                    <h4>Price</h4>
                                                    <p>₹{screening.price}</p>
                                                </div>
                                            )}
                                            {screening.adminMessage && (
                                                <div className='detail admin-message'>
                                                    <h4>Message from Admin</h4>
                                                    <p>{screening.adminMessage}</p>
                                                </div>
                                            )}
                                            {screening.status === 'approved' && screening.paymentStatus === 'pending' && (
                                                <div className='detail payment-action'>
                                                    <button 
                                                        className="pay-now-btn"
                                                        onClick={() => handlePayment(screening._id)}
                                                    >
                                                        Pay Now - ₹{screening.price || 0}
                                                    </button>
                                                </div>
                                            )}
                                            {screening.paymentStatus === 'paid' && (
                                                <div className='detail'>
                                                    <h4>Payment Info</h4>
                                                    <p>Paid - {screening.paymentId || 'Payment ID unavailable'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div className="no-screenings">
                                <p>No private screening requests found. Request your first private screening now!</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}

export default ProfilePage 