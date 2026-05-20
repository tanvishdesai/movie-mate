"use client";
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from 'next/navigation';
import { apiRequest, endpoints, API_BASE_URL } from '@/utils/api';
import { 
  AiOutlineSave, 
  AiOutlineDesktop, 
  AiOutlineEnvironment,
  AiOutlineApartment,
  AiOutlineVideoCamera 
} from 'react-icons/ai';

interface Screen {
  name: string;
  location: string;
  seats: any[]; // Change the type to an array of numbers
  city: string;
  screenType: string;
}


const CreateScreenPage: React.FC = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check authentication when component mounts
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('Checking authentication...');
        console.log('API URL:', API_BASE_URL);
        
        const response = await apiRequest(endpoints.checkLogin, {
          method: 'GET'
        }).catch(error => {
          console.error('Auth check failed:', error.message);
          return null;
        });
        
        if (response && (response.success || response.ok)) {
          setIsAuthenticated(true);
        } else {
          toast.error('Please login to access this page', {
            position: toast.POSITION.TOP_CENTER,
          });
          router.push('/pages/auth/signin');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        toast.error('Authentication error. Please try logging in again.', {
          position: toast.POSITION.TOP_CENTER,
        });
        router.push('/pages/auth/signin');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const tempseatlayout = [
    {
      // platinum
      type: 'platinum',
      rows: [
        {
          // row 2
          rowname: 'H',
          cols: [
            // col 1
            {
              seats: [
                {
                  seat_id: '1'
                },
                {
                  seat_id: '2'
                },

                {
                  seat_id: '3'
                },
                {
                  seat_id: '4'
                },
                {
                  seat_id: '5'
                },
                {
                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        },
        {
          rowname: 'G',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        },
        {
          // row 2
          rowname: 'F',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        }
      ],
      price: 500
    },
    {
      // gold
      type: 'gold',
      rows: [
        {
          // row 2
          rowname: 'E',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        },
        {
          rowname: 'D',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        },
        {
          // row 2
          rowname: 'C',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        }
      ],
      price: 300
    },
    {
      // silver - 20 objects
      type: 'silver',
      rows: [
        {
          rowname: 'B',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        },
        {
          // row 2
          rowname: 'A',
          cols: [
            // col 1
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
            // col 2
            {
              seats: [
                {


                  seat_id: '1'
                },
                {


                  seat_id: '2'
                },

                {


                  seat_id: '3'
                },
                {


                  seat_id: '4'
                },
                {


                  seat_id: '5'
                },
                {

                  seat_id: '6'
                },
                {


                  seat_id: '7'
                },
                {


                  seat_id: '8'
                },
                {


                  seat_id: '9'
                },
                {


                  seat_id: '10'
                }
              ]
            },
          ]
        }
      ],
      price: 150
    }
  ]

  const [screen, setScreen] = useState<Screen>({
    name: '',
    location: '',
    seats: tempseatlayout,
    city: '',
    screenType: '',
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setScreen({ ...screen, [name]: value });
  };
  const handleScreenTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setScreen({ ...screen, screenType: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        screen.name === '' ||
        screen.location === '' ||
        screen.seats.length == 0 ||
        screen.city === '' ||
        screen.screenType === ''
      ) {
        toast.error('Please fill all the fields', {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/movie/createscreen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(screen),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Screen creation successful', data);

        toast.success('Screen Created Successfully', {
          position: toast.POSITION.TOP_CENTER,
        });
        
        // Reset form
        setScreen({
          name: '',
          location: '',
          seats: tempseatlayout,
          city: '',
          screenType: '',
        });
      } else {
        console.error('Screen creation failed', response.statusText);
        toast.error('Screen Creation Failed', {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    }
    catch (error) {
      console.log(error);
      toast.error('An error occurred while creating the screen', {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoading(false);
    }
  }

  // Show loading spinner while checking authentication
  if (checkingAuth) {
    return <div className="loading-spinner"></div>;
  }

  // Only render the content if authenticated
  if (!isAuthenticated) {
    return null; // This prevents the form from flashing before redirect happens
  }

  return (
    <div>
      <ToastContainer />
      <div className="admin-card">
        <div className="admin-card-header">
          <h1 className="admin-card-title">
            <AiOutlineDesktop style={{ marginRight: '8px' }} /> Add New Screen
          </h1>
        </div>

        <div className="form-group">
          <label className="form-label">Screen Name</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AiOutlineVideoCamera style={{ position: 'absolute', marginLeft: '10px', color: 'var(--gray-text)' }} />
            <input
              type="text"
              name="name"
              placeholder="Enter screen name"
              value={screen.name}
              onChange={handleInputChange}
              style={{ paddingLeft: '32px' }}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-col">
            <div className="form-group">
              <label className="form-label">Location</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineEnvironment style={{ position: 'absolute', marginLeft: '10px', color: 'var(--gray-text)' }} />
                <input
                  type="text"
                  name="location"
                  placeholder="Enter location"
                  value={screen.location}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>
          </div>
          <div className="form-col">
            <div className="form-group">
              <label className="form-label">City</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineApartment style={{ position: 'absolute', marginLeft: '10px', color: 'var(--gray-text)' }} />
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={screen.city}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Screen Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            <div
              onClick={() => setScreen({ ...screen, screenType: '3D' })}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: screen.screenType === '3D'
                  ? 'var(--primary-color)'
                  : 'transparent',
                color: screen.screenType === '3D'
                  ? 'white'
                  : 'var(--text-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              3D
            </div>
            <div
              onClick={() => setScreen({ ...screen, screenType: '2D' })}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: screen.screenType === '2D'
                  ? 'var(--primary-color)'
                  : 'transparent',
                color: screen.screenType === '2D'
                  ? 'white'
                  : 'var(--text-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              2D
            </div>
            <div
              onClick={() => setScreen({ ...screen, screenType: '4D' })}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: screen.screenType === '4D'
                  ? 'var(--primary-color)'
                  : 'transparent',
                color: screen.screenType === '4D'
                  ? 'white'
                  : 'var(--text-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              4D
            </div>
            <div
              onClick={() => setScreen({ ...screen, screenType: 'IMAX' })}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: screen.screenType === 'IMAX'
                  ? 'var(--primary-color)'
                  : 'transparent',
                color: screen.screenType === 'IMAX'
                  ? 'white'
                  : 'var(--text-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              IMAX
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: '0' }}></div>
            ) : (
              <>
                <AiOutlineSave /> Create Screen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateScreenPage