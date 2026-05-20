"use client";
import Navbar from '@/components/Navbar/Navbar'
import './globals.css'
import { Inter } from 'next/font/google'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

// Metadata must be configured in a different way for client components
// We'll use Head component instead

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  // This prevents flickering during auth redirects
  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return (
      <html lang="en">
        <head>
          <title>MovieMate Admin Panel</title>
          <meta name="description" content="Admin panel for MovieMate booking platform" />
        </head>
        <body className={inter.className}>
          <div className="loading-container">Initializing MovieMate Admin...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>MovieMate Admin Panel</title>
        <meta name="description" content="Admin panel for MovieMate booking platform" />
      </head>
      <body className={inter.className}>
        <div className="admin-layout">
          {/* The Navbar component handles its own visibility based on the current route */}
          <Navbar />
          <main className="admin-content">
            <div className="admin-container">
              {children}
            </div>
          </main>
        </div>
        <ToastContainer 
          position="top-right" 
          autoClose={3000} 
          hideProgressBar={false} 
          newestOnTop 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover 
        />
      </body>
    </html>
  )
}
