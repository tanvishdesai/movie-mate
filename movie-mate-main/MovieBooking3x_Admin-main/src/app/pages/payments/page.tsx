"use client"
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import './PaymentsPage.css';

interface Payment {
    _id: string;
    bookingId: {
        _id: string;
        showTime: string;
        showDate: string;
        movieId: string;
        screenId: string;
        totalPrice: number;
    };
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    upiTransactionId: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
}

const PaymentsPage = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Get admin ID and token from localStorage
            const adminId = localStorage.getItem('adminId');
            const adminAuthToken = localStorage.getItem('adminAuthToken');
            
            if (!adminId) {
                toast.error('Admin ID not found. Please log in again.');
                return;
            }

            console.log("Fetching payments with admin ID:", adminId);
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            // Add authorization header if token is available
            if (adminAuthToken) {
                headers['Authorization'] = `Bearer ${adminAuthToken}`;
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/public/admin/payments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ adminId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.ok) {
                setPayments(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch payments');
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('An error occurred while fetching payments');
        } finally {
            setLoading(false);
        }
    };

    const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
        try {
            // Get admin ID and token from localStorage
            const adminId = localStorage.getItem('adminId');
            const adminAuthToken = localStorage.getItem('adminAuthToken');
            
            if (!adminId) {
                toast.error('Admin ID not found. Please log in again.');
                return;
            }

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            // Add authorization header if token is available
            if (adminAuthToken) {
                headers['Authorization'] = `Bearer ${adminAuthToken}`;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/public/admin/update-payment-status`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    adminId,
                    paymentId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.ok) {
                toast.success('Payment status updated successfully');
                fetchPayments(); // Refresh the payments list
                setSelectedPayment(null); // Close the details panel
            } else {
                toast.error(data.message || 'Failed to update payment status');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('An error occurred while updating payment status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'status-completed';
            case 'pending':
                return 'status-pending';
            case 'failed':
                return 'status-failed';
            case 'refunded':
                return 'status-refunded';
            default:
                return '';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const filteredPayments = payments.filter(payment => {
        // Filter by status
        if (filterStatus !== 'all' && payment.status !== filterStatus) {
            return false;
        }
        
        // Filter by search query (transaction ID, user email, or amount)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                payment.upiTransactionId?.toLowerCase().includes(query) ||
                payment.userId.email.toLowerCase().includes(query) ||
                payment.amount.toString().includes(query) ||
                payment._id.toLowerCase().includes(query)
            );
        }
        
        return true;
    });

    return (
        <div className="payments-page">
            <div className="payments-header">
                <h1>Payment Management</h1>
                <button className="refresh-button" onClick={fetchPayments}>
                    Refresh
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by transaction ID, email, or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="status-filter">
                    <label>Filter by Status:</label>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            <div className="payments-container">
                <div className="payments-list">
                    {loading ? (
                        <div className="loading-message">Loading payments...</div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="no-payments-message">No payments found</div>
                    ) : (
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>User</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => (
                                    <tr key={payment._id} onClick={() => setSelectedPayment(payment)}>
                                        <td>{payment._id.substring(0, 8)}...</td>
                                        <td>{payment.userId.email}</td>
                                        <td>₹{payment.amount.toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td>{formatDate(payment.createdAt)}</td>
                                        <td>
                                            <button 
                                                className="view-details-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPayment(payment);
                                                }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {selectedPayment && (
                    <div className="payment-details-panel">
                        <div className="panel-header">
                            <h2>Payment Details</h2>
                            <button 
                                className="close-panel-button"
                                onClick={() => setSelectedPayment(null)}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div className="panel-content">
                            <div className="detail-group">
                                <h3>Payment Information</h3>
                                <div className="detail-item">
                                    <span className="label">Payment ID:</span>
                                    <span className="value">{selectedPayment._id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Amount:</span>
                                    <span className="value">₹{selectedPayment.amount.toFixed(2)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Status:</span>
                                    <span className={`value status-badge ${getStatusColor(selectedPayment.status)}`}>
                                        {selectedPayment.status}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Payment Method:</span>
                                    <span className="value">{selectedPayment.paymentMethod}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Transaction ID:</span>
                                    <span className="value">{selectedPayment.upiTransactionId || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Created At:</span>
                                    <span className="value">{formatDate(selectedPayment.createdAt)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Last Updated:</span>
                                    <span className="value">{formatDate(selectedPayment.updatedAt)}</span>
                                </div>
                            </div>

                            <div className="detail-group">
                                <h3>User Information</h3>
                                <div className="detail-item">
                                    <span className="label">Name:</span>
                                    <span className="value">{selectedPayment.userId.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Email:</span>
                                    <span className="value">{selectedPayment.userId.email}</span>
                                </div>
                            </div>

                            <div className="detail-group">
                                <h3>Booking Information</h3>
                                <div className="detail-item">
                                    <span className="label">Booking ID:</span>
                                    <span className="value">{selectedPayment.bookingId._id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Show Date:</span>
                                    <span className="value">{new Date(selectedPayment.bookingId.showDate).toLocaleDateString()}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Show Time:</span>
                                    <span className="value">{selectedPayment.bookingId.showTime}</span>
                                </div>
                            </div>

                            <div className="actions-group">
                                <h3>Actions</h3>
                                <div className="status-actions">
                                    {selectedPayment.status === 'pending' && (
                                        <>
                                            <button 
                                                className="action-button complete-button"
                                                onClick={() => updatePaymentStatus(selectedPayment._id, 'completed')}
                                            >
                                                Mark as Completed
                                            </button>
                                            <button 
                                                className="action-button fail-button"
                                                onClick={() => updatePaymentStatus(selectedPayment._id, 'failed')}
                                            >
                                                Mark as Failed
                                            </button>
                                        </>
                                    )}
                                    {selectedPayment.status === 'completed' && (
                                        <button 
                                            className="action-button refund-button"
                                            onClick={() => updatePaymentStatus(selectedPayment._id, 'refunded')}
                                        >
                                            Issue Refund
                                        </button>
                                    )}
                                    {(selectedPayment.status === 'failed' || selectedPayment.status === 'refunded') && (
                                        <button 
                                            className="action-button complete-button"
                                            onClick={() => updatePaymentStatus(selectedPayment._id, 'completed')}
                                        >
                                            Mark as Completed
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentsPage; 