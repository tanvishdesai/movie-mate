import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import './Toast.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  isVisible 
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        onClose && onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isVisible, duration, onClose]);
  
  const handleClose = () => {
    setVisible(false);
    onClose && onClose();
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="toast-icon success" />;
      case 'error':
        return <FaTimesCircle className="toast-icon error" />;
      default:
        return null;
    }
  };
  
  const toastClass = `toast ${type} ${visible ? 'visible' : ''}`;
  
  return (
    <div className={toastClass} role="alert">
      <div className="toast-content">
        {getIcon()}
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close notification">
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast; 