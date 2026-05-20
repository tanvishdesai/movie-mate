"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './PrivateScreeningForm.css';
import { toast } from 'react-toastify';

interface PrivateScreeningFormProps {
  movieId: string;
  movieTitle: string;
  onClose: () => void;
}

const PrivateScreeningForm: React.FC<PrivateScreeningFormProps> = ({
  movieId,
  movieTitle,
  onClose,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requestedDate: '',
    requestedTime: '',
    numberOfGuests: 20,
    specialRequests: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'numberOfGuests' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/privatescreening/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          movieId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success('Private screening request submitted successfully!');
        // Redirect to profile page with the private screenings section highlighted
        router.push('/profile?section=private-screenings');
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting private screening request:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  // Generate time options (9 AM to 11 PM)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 23; hour++) {
      const time = hour < 12 
        ? `${hour}:00 AM` 
        : `${hour === 12 ? 12 : hour - 12}:00 PM`;
      options.push(<option key={hour} value={time}>{time}</option>);
    }
    return options;
  };

  // Calculate min date (tomorrow)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate max date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="private-screening-form-container">
      <div className="private-screening-form-header">
        <h2>Request a Private Screening</h2>
        <h3>{movieTitle}</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="private-screening-form">
        <div className="form-group">
          <label htmlFor="requestedDate">Preferred Date</label>
          <input
            type="date"
            id="requestedDate"
            name="requestedDate"
            min={getTomorrowDate()}
            max={getMaxDate()}
            value={formData.requestedDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="requestedTime">Preferred Time</label>
          <select
            id="requestedTime"
            name="requestedTime"
            value={formData.requestedTime}
            onChange={handleChange}
            required
          >
            <option value="">Select a time</option>
            {generateTimeOptions()}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="numberOfGuests">Number of Guests</label>
          <input
            type="number"
            id="numberOfGuests"
            name="numberOfGuests"
            min="10"
            max="100"
            value={formData.numberOfGuests}
            onChange={handleChange}
            required
          />
          <small>Minimum 10 guests required for private screenings</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="specialRequests">Special Requests</label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            rows={4}
            placeholder="Any special arrangements or requests (optional)"
            value={formData.specialRequests}
            onChange={handleChange}
          />
        </div>
        
        <div className="private-screening-notes">
          <h4>Please Note:</h4>
          <ul>
            <li>Private screening requests are subject to availability and approval</li>
            <li>Our team will review your request and contact you within 24-48 hours</li>
            <li>Pricing will be provided after review and depends on the number of guests</li>
            <li>Payment is required only after your request is approved</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrivateScreeningForm; 