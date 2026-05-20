"use client"
import React, { useState } from 'react'
import './SelectSeat.css'
import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

// Import the 3D theater component with dynamic loading to avoid SSR issues with Three.js
const TheaterView3D = dynamic(
  () => import('@/components/3DTheater/TheaterView3D'),
  { ssr: false }
);

const SelectSeatPage  = () => {

    const pathname = usePathname()
    const params = useParams()
    const searchParams = useSearchParams()

    const date = searchParams.get('date')
    const { movieid, cityname, screenid } = params
    console.log(movieid, cityname, screenid)

    const [screen, setScreen] = React.useState<any>(null)
    const [selectedTime, setSelectedTime] = React.useState<any>(null)
    const [allSeats, setAllSeats] = React.useState<any[][]>([])
    const [threedVisible, setThreedVisible] = useState(false);
    const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'

    const getschedules = async () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/schedulebymovie/${screenid}/${date}/${movieid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
            .then(res => res.json())
            .then(response => {
                if (response.ok) {
                    console.log('Raw API Response:', response.data);
                    console.log('Screen seats data:', response.data.screen?.seats);
                    setScreen(response.data)
                    setSelectedTime(response.data.movieSchedulesforDate[0])
                    
                    // Process seats for 3D view with proper consecutive numbering
                    if (response.data.screen && response.data.screen.seats) {
                        const processedSeats: any[][] = [];
                        
                        // Process each seat type (platinum, gold, silver)
                        response.data.screen.seats.forEach((seatType: any) => {
                            console.log('Processing seat type:', seatType);
                            
                            if (!seatType.type || !seatType.price || !Array.isArray(seatType.rows)) {
                                console.error('Invalid seat type data structure:', seatType);
                                return;
                            }
                            
                            // Process each row in the seat type
                            seatType.rows.forEach((row: any) => {
                                if (!row.name || !Array.isArray(row.columns)) {
                                    console.error('Invalid row data structure:', row);
                                    return;
                                }
                                
                                const rowSeats: any[] = [];
                                
                                // Process each column in the row
                                row.columns.forEach((seat: any, colIndex: number) => {
                                    rowSeats.push({
                                        row: row.name,
                                        col: colIndex,
                                        seat_id: `${row.name}${colIndex + 1}`,
                                        price: seatType.price
                                    });
                                });
                                
                                if (rowSeats.length > 0) {
                                    console.log(`Adding processed row ${row.name} with ${rowSeats.length} seats`);
                                    processedSeats.push(rowSeats);
                                }
                            });
                        });
                        
                        console.log('Final processed seats:', processedSeats);
                        setAllSeats(processedSeats);
                    } else {
                        console.error('No seats data found in the response:', response.data);
                    }
                }
                else {
                    console.log(response)
                }
            })
            .catch(err => console.log(err))
    }

    const [movie, setMovie] = React.useState<any>(null)

    const getMovie = async () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/movies/${movieid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    console.log('movie', data.data)
                    setMovie(data.data)
                }
            })
            .catch((err) => {
                console.log(err)
            })
    }

    React.useEffect(() => {
        getschedules()
        getMovie()
    }, [])

    const [selectedSeats, setSelectedSeats] = React.useState<any[]>([])

    const selectdeselectseat = (seat: any) => {
        console.log(seat)
        const isselected = selectedSeats.find((s: any) => (
            s.row === seat.row &&
            s.col === seat.col &&
            s.seat_id === seat.seat_id
        ))

        if (isselected) {
            setSelectedSeats(selectedSeats.filter((s: any) => (
                s.row !== seat.row ||
                s.col !== seat.col ||
                s.seat_id !== seat.seat_id
            )))
        }
        else {
            setSelectedSeats([...selectedSeats, seat])
        }
    }

    const generateSeatLayout = () => {
        if (!screen || !selectedTime) {
            return null;
        }
        
        // Safely access movieSchedulesforDate
        const movieSchedules = screen.movieSchedulesforDate || [];
        const x = movieSchedules.findIndex((t: any) => t.showTime === selectedTime.showTime);
        
        if (x === -1) {
            return (
                <div className="no-seats-message">
                    No schedule found for the selected time. Please try another time.
                </div>
            );
        }
        
        // Safely access notAvailableSeats
        let notavailableseats = movieSchedules[x].notAvailableSeats || [];
        
        // Check if screen and seats exist
        if (!screen.screen || !screen.screen.seats || !Array.isArray(screen.screen.seats) || screen.screen.seats.length === 0) {
            return (
                <div className="no-seats-message">
                    No seat information available for this screen.
                </div>
            );
        }

        return (
            <div className="theater-layout">
                {screen.screen.seats.map((seatType: any, index: number) => {
                    // Get the tier type for styling
                    const tierClass = 
                        seatType.type?.toUpperCase() === 'PLATINUM' ? 'platinum-type' : 
                        seatType.type?.toUpperCase() === 'GOLD' ? 'gold-type' : 
                        seatType.type?.toUpperCase() === 'SILVER' ? 'silver-type' : '';
                    
                    // Check if seatType has rows
                    if (!seatType.rows || !Array.isArray(seatType.rows) || seatType.rows.length === 0) {
                        return (
                            <div className={`seat-type ${tierClass}`} key={index}>
                                <h2>{seatType.type || 'Unknown'} - Rs. {seatType.price || 0}</h2>
                                <div className="no-seats-message">No seats available in this section</div>
                            </div>
                        );
                    }
                    
                    return (
                        <div className={`seat-type ${tierClass}`} key={index}>
                            <h2>{seatType.type || 'Unknown'} - Rs. {seatType.price || 0}</h2>
                            <div className='seat-rows'>
                                {seatType.rows.map((row: any, rowIndex: number) => {
                                    // Check if row has cols
                                    if (!row.name || !Array.isArray(row.columns)) {
                                        return null;
                                    }
                                    
                                    // Calculate total seats in this row for proper layout
                                    let totalSeatsInRow = row.columns.length;
                                    
                                    if (totalSeatsInRow === 0) {
                                        return null;
                                    }
                                    
                                    return (
                                        <div className="seat-row" key={rowIndex}>
                                            <div className="rowname">{row.name}</div>
                                            <div className="seat-cols">
                                                {row.columns.map((col: any, colIndex: number) => {
                                                    const seatNum = colIndex + 1;
                                                    const seatId = `${row.name}${seatNum}`;
                                                    
                                                    const isUnavailable = notavailableseats.find((s: any) => (
                                                        s.row === row.name &&
                                                        s.col === colIndex
                                                    ));
                                                    
                                                    const isSelected = selectedSeats.find((s: any) => (
                                                        s.row === row.name &&
                                                        s.col === colIndex
                                                    ));
                                                    
                                                    const isAisleSeat = (seatNum % 5 === 0 && seatNum < totalSeatsInRow);
                                                    
                                                    return (
                                                        <div key={`${rowIndex}-${seatNum}`} 
                                                             className={`seat-col ${isAisleSeat ? 'aisle-seat' : ''}`}>
                                                            {isUnavailable ? (
                                                                <span className='seat-unavailable'>
                                                                    {seatNum}
                                                                </span>
                                                            ) : (
                                                                <span 
                                                                    className={isSelected ? "seat-selected" : "seat-available"}
                                                                    onClick={() => selectdeselectseat({
                                                                        row: row.name,
                                                                        col: colIndex,
                                                                        seat_id: seatId,
                                                                        price: seatType.price
                                                                    })}
                                                                >
                                                                    {seatNum}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                <div className="screen"></div>
            </div>
        );
    }

    const handleBooking = async () => {
        if (!screen || !selectedTime || selectedSeats.length === 0) {
            toast.error('Please select at least one seat to continue');
            return;
        }

        // Ensure we have all required data
        const movieTitle = screen.movie?.title || movie?.title;
        if (!movieTitle) {
            toast.error('Movie information is missing. Please refresh the page.');
            return;
        }

        // Calculate total price
        const totalPrice = selectedSeats.reduce((acc, seat) => acc + seat.price, 0);

        // Show loading toast
        const loadingToastId = toast.loading('Initializing payment...');

        try {
            // Step 1: Create a payment
            const createPaymentResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    amount: totalPrice
                })
            });

            const paymentData = await createPaymentResponse.json();
            
            if (!paymentData.ok) {
                throw new Error(paymentData.message || 'Failed to initialize payment');
            }

            // Step 2: Show payment modal with UPI details
            toast.dismiss(loadingToastId);
            
            // Create a modal dialog for payment
            const modal = document.createElement('div');
            modal.className = 'payment-modal';
            modal.innerHTML = `
                <div class="payment-modal-content">
                    <h2>Complete Payment</h2>
                    <p>Total Amount: ₹${totalPrice}</p>
                    <p>UPI ID: ${paymentData.data.upiId}</p>
                    <div class="payment-form">
                        <input type="text" id="upiTransactionId" placeholder="Enter UPI Transaction ID" />
                        <button id="verifyPayment">Verify Payment</button>
                        <button id="cancelPayment">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add styles for the modal
            const style = document.createElement('style');
            style.textContent = `
                .payment-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .payment-modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    max-width: 400px;
                    width: 90%;
                }
                .payment-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .payment-form input {
                    padding: 0.5rem;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                .payment-form button {
                    padding: 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #verifyPayment {
                    background: #4CAF50;
                    color: white;
                }
                #cancelPayment {
                    background: #f44336;
                    color: white;
                }
            `;
            document.head.appendChild(style);

            // Handle payment verification
            return new Promise((resolve, reject) => {
                const verifyBtn = document.getElementById('verifyPayment');
                const cancelBtn = document.getElementById('cancelPayment');
                const upiInput = document.getElementById('upiTransactionId');

                verifyBtn?.addEventListener('click', async () => {
                    const upiTransactionId = (upiInput as HTMLInputElement)?.value;
                    if (!upiTransactionId) {
                        toast.error('Please enter UPI Transaction ID');
                        return;
                    }

                    const verifyToastId = toast.loading('Verifying payment...');

                    try {
                        // Step 3: Verify the payment
                        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                paymentId: paymentData.data.paymentId,
                                upiTransactionId
                            })
                        });

                        const verifyResult = await verifyResponse.json();

                        if (!verifyResult.ok) {
                            throw new Error(verifyResult.message || 'Payment verification failed');
                        }

                        // Step 4: Create the booking with verified payment
                        const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/bookticket`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                showTime: selectedTime.showTime,
                                showDate: date,
                                movieId: movieid,
                                screenId: screenid,
                                seats: selectedSeats.map(seat => ({
                                    ...seat,
                                    seat_id: seat.original_seat_id || seat.seat_id
                                })),
                                totalPrice,
                                paymentId: paymentData.data.paymentId
                            })
                        });

                        const bookingResult = await bookingResponse.json();

                        if (!bookingResult.ok) {
                            throw new Error(bookingResult.message || 'Booking failed');
                        }

                        toast.dismiss(verifyToastId);
                        toast.success('Booking successful! Enjoy your movie.');

                        // Clean up modal
                        document.body.removeChild(modal);
                        document.head.removeChild(style);

                        // Redirect to bookings page
                        setTimeout(() => {
                            window.location.href = `/${cityname}/profile?section=bookings`;
                        }, 2000);

                        resolve(true);
                    } catch (error: any) {
                        toast.dismiss(verifyToastId);
                        toast.error(error.message || 'Failed to complete booking');
                        reject(error);
                    }
                });

                cancelBtn?.addEventListener('click', () => {
                    document.body.removeChild(modal);
                    document.head.removeChild(style);
                    toast.error('Booking cancelled');
                    reject(new Error('Booking cancelled'));
                });
            });
        } catch (error: any) {
            toast.dismiss(loadingToastId);
            toast.error(error.message || 'Something went wrong. Please try again.');
            console.error('Booking error:', error);
        }
    };

    return (
        <div className="select-seat-main">
            {screen && selectedTime ? (
                <div className="container">
                    <div className="header">
                        <h1>{screen.movie?.title || movie?.title || "Loading movie..."}</h1>
                        <p className="screen-name">{screen.screen?.name || "Theater"} • {format(new Date(date || ''), 'EEE, d MMM')} • {selectedTime.showTime}</p>
                    </div>

                    <div className="screen-details">
                        <div className="legend">
                            <div className="item">
                                <div className="box available"></div>
                                <p>Available</p>
                            </div>
                            <div className="item">
                                <div className="box selected"></div>
                                <p>Selected</p>
                            </div>
                            <div className="item">
                                <div className="box taken"></div>
                                <p>Taken</p>
                            </div>
                        </div>

                        <div className="theater-view-toggle">
                            <button 
                                className={`toggle-button ${viewMode === '2d' ? 'active' : ''}`}
                                onClick={() => setViewMode('2d')}
                            >
                                2D Seat Map
                            </button>
                            <button 
                                className={`toggle-button ${viewMode === '3d' ? 'active' : ''}`}
                                onClick={() => setViewMode('3d')}
                            >
                                3D Theater View
                            </button>
                        </div>
                        
                        {viewMode === '3d' && (
                            <div className="theater-view-container">
                                <div className="theater-view-wrapper">
                                    <div className="theater-view">
                                        <TheaterView3D 
                                            selectedSeats={selectedSeats}
                                            allSeats={allSeats}
                                            notAvailableSeats={selectedTime ? 
                                                (screen.movieSchedulesforDate.find((t: any) => 
                                                    t.showTime === selectedTime.showTime)?.notAvailableSeats || []) : []}
                                            defaultVisible={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === '2d' && (
                            <div className="seats">
                                {generateSeatLayout()}
                            </div>
                        )}
                    </div>

                    {/* Summary and booking section */}
                    <div className='totalcont'>
                        <div className='selectedseats'>
                            <h3>Selected Seats</h3>
                            <div className='selectedseats-seats'>
                                {selectedSeats.map((seat: any, index: number) => (
                                    <span key={index} className="ss-seat">
                                        {seat.row}-{seat.seat_id}
                                    </span>
                                ))}
                                {selectedSeats.length === 0 && (
                                    <span className="ss-seat no-seat">
                                        No seats selected
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className='totalamt'>
                            <h3>Total Amount</h3>
                            <p>₹{selectedSeats.reduce((acc: number, seat: any) => acc + seat.price, 0)}</p>
                        </div>
                        <button
                            className='bookbtn'
                            onClick={handleBooking}
                            disabled={selectedSeats.length === 0}
                        >
                            Book Seats
                        </button>
                    </div>
                </div>
            ) : (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading theater and seat information...</p>
                </div>
            )}
        </div>
    )
}

export default SelectSeatPage 