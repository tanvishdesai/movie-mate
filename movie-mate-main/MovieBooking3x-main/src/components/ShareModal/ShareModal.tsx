import React, { useState, useRef, useEffect } from 'react';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaWhatsapp, 
  FaEnvelope, 
  FaLink, 
  FaTimes, 
  FaQrcode,
  FaCheckCircle
} from 'react-icons/fa';
import './ShareModal.css';
import { generateSharingUrls } from '@/utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  image?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  url, 
  image 
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const shareText = `Check out ${title} on MovieMate!`;
  const shareDescription = `${title} - Available now for booking on MovieMate.`;

  // Generate sharing URLs
  const sharingUrls = generateSharingUrls(title, url, shareDescription);

  // Handle clicking outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCopySuccess(false);
      setShareSuccess(null);
      setShowQRCode(false);
    }
  }, [isOpen]);

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Toggle QR code display
  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  // Handle share button click and show success indicator
  const handleShareClick = (platform: string) => {
    setShareSuccess(platform);
    setTimeout(() => setShareSuccess(null), 1500);
  };

  // Sharing options with their respective URLs
  const sharingOptions = [
    {
      name: 'Facebook',
      icon: <FaFacebookF />,
      url: sharingUrls.facebook,
      color: '#1877F2'
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      url: sharingUrls.twitter,
      color: '#1DA1F2'
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      url: sharingUrls.whatsapp,
      color: '#25D366'
    },
    {
      name: 'Email',
      icon: <FaEnvelope />,
      url: sharingUrls.email,
      color: '#D44638'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay">
      <div className="share-modal" ref={modalRef}>
        <div className="share-modal-header">
          <h3>Share this movie</h3>
          <button className="close-button" onClick={onClose} aria-label="Close share modal">
            <FaTimes />
          </button>
        </div>
        
        {image && (
          <div className="share-movie-preview">
            <div className="share-movie-image" style={{ backgroundImage: `url(${image})` }}></div>
            <div className="share-movie-info">
              <h4>{title}</h4>
              <p 
                className="share-url" 
                onClick={copyToClipboard} 
                title="Click to copy URL"
              >
                {url}
              </p>
            </div>
          </div>
        )}
        
        <div className="share-options">
          {sharingOptions.map((option, index) => (
            <a 
              key={index}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`share-option-button ${shareSuccess === option.name ? 'shared' : ''}`}
              style={{ backgroundColor: option.color }}
              aria-label={`Share on ${option.name}`}
              onClick={() => handleShareClick(option.name)}
            >
              <span className="share-icon">
                {shareSuccess === option.name ? <FaCheckCircle /> : option.icon}
              </span>
              <span>{shareSuccess === option.name ? 'Shared!' : option.name}</span>
            </a>
          ))}
          
          <button 
            className={`copy-link-button ${copySuccess ? 'success' : ''}`}
            onClick={copyToClipboard}
            aria-label="Copy link to clipboard"
          >
            <span className="share-icon">
              {copySuccess ? <FaCheckCircle /> : <FaLink />}
            </span>
            <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
          </button>
          
          <button 
            className="qr-code-button"
            onClick={toggleQRCode}
            aria-label="Show QR code"
          >
            <span className="share-icon"><FaQrcode /></span>
            <span>{showQRCode ? 'Hide QR Code' : 'Show QR Code'}</span>
          </button>
        </div>
        
        {showQRCode && (
          <div className="qr-code-container">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`} 
              alt="QR Code" 
              className="qr-code-image"
            />
            <p className="qr-code-caption">Scan to open on mobile device</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal; 