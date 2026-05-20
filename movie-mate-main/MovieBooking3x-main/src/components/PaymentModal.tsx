"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import './PaymentModal.css';

interface PaymentModalProps {
    totalAmount: number;
    onClose: () => void;
    onPaymentComplete: (paymentId: string, transactionId: string) => void;
}

const PaymentModal = ({ totalAmount, onClose, onPaymentComplete }: PaymentModalProps) => {
    const [paymentId, setPaymentId] = useState<string>('');
    const [upiTransactionId, setUpiTransactionId] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userId, setUserId] = useState<string | null>(null);
    const upiId = 'tanvishdesai.05@oksbi';

    // Get user ID from localStorage or fetch from API if not available
    useEffect(() => {
        const fetchUserId = async () => {
            // Try to get from localStorage first
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
                setUserId(storedUserId);
                setIsLoading(false);
                return;
            }

            // If not in localStorage, try to get from API
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/checklogin`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                const data = await response.json();
                if (data.ok && data.userId) {
                    localStorage.setItem('userId', data.userId);
                    setUserId(data.userId);
                } else {
                    toast.error('User authentication failed. Please log in again.');
                    onClose();
                }
            } catch (error) {
                console.error('Error fetching user ID:', error);
                toast.error('Failed to authenticate. Please log in again.');
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserId();
    }, [onClose]);

    useEffect(() => {
        // Create a payment record when the component mounts and userId is available
        if (userId && !isLoading) {
            createPayment();
        }
    }, [userId, isLoading]);

    // Create payment record
    const createPayment = async () => {
        try {
            if (!userId) {
                toast.error('User ID not found. Please log in again.');
                onClose();
                return;
            }

            console.log("Making payment request with user ID:", userId);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/public/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: totalAmount,
                    userId: userId
                }),
            });

            if (!response.ok) {
                console.error("Payment creation failed:", response.status, response.statusText);
                toast.error(`Failed to create payment: ${response.statusText}`);
                return;
            }

            const data = await response.json();
            if (data.ok) {
                setPaymentId(data.data.paymentId);
            } else {
                toast.error(data.message || 'Failed to initialize payment');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
            console.error("Payment error:", error);
        }
    };

    const handleVerifyPayment = async () => {
        if (!upiTransactionId) {
            toast.error('Please enter your UPI Transaction ID');
            return;
        }

        if (!userId) {
            toast.error('User ID not found. Please log in again.');
            onClose();
            return;
        }

        setIsVerifying(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/public/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    upiTransactionId,
                    userId
                }),
            });

            if (!response.ok) {
                console.error("Payment verification failed:", response.status, response.statusText);
                toast.error(`Failed to verify payment: ${response.statusText}`);
                setIsVerifying(false);
                return;
            }

            const data = await response.json();
            if (data.ok) {
                toast.success('Payment verified successfully!');
                onPaymentComplete(paymentId, upiTransactionId);
            } else {
                toast.error(data.message || 'Failed to verify payment');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
            console.error("Verification error:", error);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal">
                <div className="payment-modal-header">
                    <h2>Complete Your Payment</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                
                <div className="payment-details">
                    <div className="amount-section">
                        <h3>Amount to Pay:</h3>
                        <p className="amount">₹{totalAmount.toFixed(2)}</p>
                    </div>

                    <div className="payment-methods">
                        <div className="upi-section">
                            <h3>Pay using UPI</h3>
                            <div className="upi-info">
                                <div className="qr-code">
                                    <Image 
                                        src="/QR.jpg" 
                                        alt="UPI QR Code" 
                                        width={200} 
                                        height={200}
                                    />
                                </div>
                                <div className="upi-id-section">
                                    <p>UPI ID:</p>
                                    <div className="upi-id-box">
                                        <span className="upi-id">{upiId}</span>
                                        <button 
                                            className="copy-button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(upiId);
                                                toast.info('UPI ID copied!');
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="verify-section">
                            <h3>Verify Payment</h3>
                            <p>After making the payment, enter your UPI Transaction ID below:</p>
                            <input 
                                type="text" 
                                placeholder="Enter UPI Transaction ID" 
                                value={upiTransactionId}
                                onChange={(e) => setUpiTransactionId(e.target.value)}
                                className="transaction-input"
                            />
                            <button 
                                className="verify-button"
                                onClick={handleVerifyPayment}
                                disabled={isVerifying || !paymentId}
                            >
                                {isVerifying ? 'Verifying...' : 'Verify Payment'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="payment-footer">
                    <p>Note: Please do not close this window until your payment is verified.</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal; 