const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Constants and configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const NUM_MOVIES = parseInt(process.env.NUM_MOVIES || '10', 10);
const NUM_SCREENS_PER_CITY = parseInt(process.env.NUM_SCREENS_PER_CITY || '3', 10);
const NUM_SCHEDULES_PER_MOVIE = parseInt(process.env.NUM_SCHEDULES_PER_MOVIE || '3', 10);

// Cities to create screens in
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

// Available screen types
const SCREEN_TYPES = ['2D', '3D', '4D', 'IMAX'];

// Set up axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Global variables
let adminId = null;

// Set auth token for API requests
const setAuthToken = (token) => {
  if (token) {
    // Make sure we're using the right format for JWT tokens
    if (token.startsWith('Bearer ')) {
      api.defaults.headers.common['Authorization'] = token;
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    console.log('Auth token set for future requests');
    console.log('Authorization header:', api.defaults.headers.common['Authorization']);
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('Auth token removed');
  }
};

// Login to admin dashboard
async function adminLogin() {
  try {
    console.log('Attempting admin login...');
    
    const loginData = {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'adminpassword'
    };
    
    console.log(`Logging in with email: ${loginData.email}`);
    
    // Try different endpoint formats
    let response;
    try {
      response = await axios.post(`${API_BASE_URL}/admin/login`, loginData, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (loginError) {
      console.log('First login attempt failed, trying alternative endpoint...');
      response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Login response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success || response.data.ok) {
      console.log('Admin login successful, extracting token and admin ID...');
      
      // Extract token - check all possible locations
      let token = null;
      if (response.data.token) {
        token = response.data.token;
      } else if (response.data.data?.token) {
        token = response.data.data.token;
      } else if (response.data.adminAuthToken) {
        token = response.data.adminAuthToken;
      } else if (response.data.data?.adminAuthToken) {
        token = response.data.data.adminAuthToken;
      }
      
      if (!token) {
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('No token found in response. Check response structure above.');
      }
      
      // Extract admin ID by decoding JWT token
      // JWT token is in the format header.payload.signature
      // The payload contains the admin ID and is base64 encoded
      try {
        console.log('Attempting to extract admin ID from JWT token...');
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          // Decode the payload (middle part)
          const payloadBase64 = tokenParts[1];
          const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const payload = JSON.parse(decodedPayload);
          
          console.log('Token payload:', JSON.stringify(payload, null, 2));
          
          // Look for admin ID in different possible keys
          adminId = payload.adminId || payload.admin_id || payload.id || payload.sub;
          
          if (adminId) {
            console.log(`Successfully extracted admin ID from token: ${adminId}`);
          } else {
            console.error('Could not find admin ID in token payload');
          }
        }
      } catch (decodeError) {
        console.error('Error decoding JWT token:', decodeError.message);
      }
      
      // If we couldn't extract from token, try to find in response
      if (!adminId) {
        // Try to find admin ID in response as before
        if (response.data.data?.admin?._id) {
          adminId = response.data.data.admin._id;
        } else if (response.data.admin?._id) {
          adminId = response.data.admin._id;
        } else if (response.data.data?._id) {
          adminId = response.data.data._id;
        } else if (response.data._id) {
          adminId = response.data._id;
        } else if (response.data.data?.adminId) {
          adminId = response.data.data.adminId;
        } else if (response.data.adminId) {
          adminId = response.data.adminId;
        } else if (response.data.data?.user?._id) {
          adminId = response.data.data.user._id;
        } else if (response.data.user?._id) {
          adminId = response.data.user._id;
        }
      }
      
      if (!adminId) {
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('No admin ID found in response or token. Check response structure above.');
      }
      
      console.log(`Admin ID: ${adminId}`);
      console.log(`Token: ${token.substring(0, 15)}...`);
      
      // Set token for future requests
      setAuthToken(token);
      return token;
    } else {
      throw new Error(`Login failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Admin login error:', error.message);
    console.error('Full error:', error.response?.data || error);
    process.exit(1);
  }
}

// Generate movie data using Hugging Face API
async function generateMovieData(count) {
  try {
    console.log(`Generating data for ${count} movies using Hugging Face...`);
    
    // Create the prompt for the language model
    const prompt = `Generate ${count} unique movie entries in JSON format. Each movie should have: 
      title, description, rating (1-10), genre (array of strings), duration (in minutes).
      Make sure the movies are diverse in terms of genres, ratings, and durations.
      Return ONLY the JSON array with no additional text.`;
    
    // Call Hugging Face Inference API
    const hfResponse = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the generated text
    const generatedContent = hfResponse.data[0]?.generated_text || '';
    console.log('Hugging Face generated raw content:', generatedContent);
    
    // Parse the JSON from the response
    let movieData;
    try {
      // Try to extract JSON by finding opening and closing brackets
      const jsonMatch = generatedContent.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        movieData = JSON.parse(jsonMatch[0]);
        console.log(`Successfully extracted and parsed ${movieData.length} movies from text`);
        return movieData;
      }
      
      // If no JSON array found, try to parse the entire response
      movieData = JSON.parse(generatedContent);
      console.log(`Successfully parsed ${movieData.length} movies from Hugging Face response`);
      return movieData;
    } catch (parseError) {
      console.error('Error parsing Hugging Face response as JSON:', parseError);
      
      // If parsing fails, generate a fallback array of movies
      console.log('Generating fallback movie data...');
      return generateFallbackMovieData(count);
    }
  } catch (error) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    
    // Generate fallback data if the API call fails
    console.log('Generating fallback movie data due to API error...');
    return generateFallbackMovieData(count);
  }
}

// Generate fallback movie data if the API fails
function generateFallbackMovieData(count) {
  const genres = [
    ['Action', 'Adventure'], 
    ['Comedy'], 
    ['Drama'], 
    ['Science Fiction', 'Fantasy'], 
    ['Horror', 'Thriller'], 
    ['Romance'], 
    ['Animation', 'Family'], 
    ['Documentary'], 
    ['Crime']
  ];
  
  const movieTitles = [
    'The Last Horizon', 'Midnight Serenade', 'Eternal Echo', 'Whispers in the Dark',
    'Beyond the Stars', 'Shadow Realm', 'City of Dreams', 'Silent Guardian',
    'Forgotten Memories', 'The Hidden Truth', 'Parallel Lives', 'Tomorrow\'s Promise',
    'Echoes of Time', 'Shattered Reality', 'The Endless Journey', 'Fragments of Hope',
    'Veiled Destiny', 'Prism of Shadows', 'Legacy of Heroes', 'The Final Chapter'
  ];

  // Default image URLs for movies
  const defaultPortraitImages = [
    'https://images.unsplash.com/photo-1616530940355-351fabd9524b',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0',
    'https://images.unsplash.com/photo-1535016120720-40c646be5580'
  ];

  const defaultLandscapeImages = [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0',
    'https://images.unsplash.com/photo-1512070679279-8988d32161be',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26'
  ];
  
  return Array(count).fill().map((_, i) => {
    const randomGenreSet = genres[Math.floor(Math.random() * genres.length)];
    const randomPortraitImg = defaultPortraitImages[Math.floor(Math.random() * defaultPortraitImages.length)];
    const randomLandscapeImg = defaultLandscapeImages[Math.floor(Math.random() * defaultLandscapeImages.length)];

    return {
      title: i < movieTitles.length ? movieTitles[i] : `Untitled Project ${i+1}`,
      description: `A captivating story that will take you on an unforgettable journey through unexpected twists and emotional revelations.`,
      rating: Math.floor(Math.random() * 5) + 5, // 5-10 rating
      genre: randomGenreSet,
      duration: (Math.floor(Math.random() * 60) + 90), // 90-150 minutes
      portraitImgUrl: randomPortraitImg,
      landscapeImgUrl: randomLandscapeImg
    };
  });
}

// Generate placeholder image URLs
function getPlaceholderImages() {
  // Array of movie poster URLs (portrait orientation)
  const posterOptions = [
    'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&h=800&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=800&fit=crop',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=500&h=800&fit=crop',
    'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&h=800&fit=crop'
  ];
  
  // Array of banner URLs (landscape orientation)
  const bannerOptions = [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512070679279-8988d32161be?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=600&fit=crop'
  ];
  
  // Return a random poster and banner URL
  return {
    posterUrl: posterOptions[Math.floor(Math.random() * posterOptions.length)],
    bannerUrl: bannerOptions[Math.floor(Math.random() * bannerOptions.length)]
  };
}

// Create a movie in the database
async function createMovie(movieData) {
  try {
    console.log(`Creating movie: ${movieData.title}`);
    
    // Ensure required fields are present
    const movieToCreate = {
      title: movieData.title,
      description: movieData.description,
      portraitImgUrl: movieData.portraitImgUrl,
      landscapeImgUrl: movieData.landscapeImgUrl,
      rating: movieData.rating,
      genre: movieData.genre,
      duration: movieData.duration,
      adminId
    };
    
    console.log('Movie data:', JSON.stringify(movieToCreate, null, 2));
    
    // Try different endpoint formats based on common Express API structures
    let response;
    try {
      // Try the most common endpoint structure
      response = await api.post('/api/movie/admin/createmovie', movieToCreate);
    } catch (firstError) {
      console.log('First endpoint attempt failed, trying alternative endpoint...');
      try {
        // Try with movie/public prefix
        response = await api.post('/api/movie/public/admin/createmovie', movieToCreate);
      } catch (secondError) {
        console.log('Second endpoint attempt failed, trying one more alternative...');
        try {
          // Try without /api prefix
          response = await api.post('/movie/admin/createmovie', movieToCreate);
        } catch (thirdError) {
          console.log('Third endpoint attempt failed, trying final endpoint...');
          try {
            // Try the simplest version
            response = await api.post('/movie/createmovie', movieToCreate);
          } catch (finalError) {
            // If all attempts fail but we got a response with data, we'll try to use it
            if (finalError.response && finalError.response.data) {
              response = finalError.response;
            } else {
              throw finalError;
            }
          }
        }
      }
    }

    // Log the full response for debugging
    console.log('Full response:', JSON.stringify(response?.data, null, 2));

    // Check if we have a movie ID in the response (various possible response formats)
    const movieId = response?.data?.data?._id || 
                   response?.data?.movie?._id || 
                   response?.data?._id ||
                   (typeof response?.data === 'object' && response?.data?.id);

    if (movieId) {
      console.log(`Successfully created movie: ${movieData.title} with ID: ${movieId}`);
      return {
        ...movieData,
        _id: movieId
      };
    } else if (response?.data) {
      // If we have response data but no ID, try to parse it
      console.log('Response data received but no ID found. Full response:', JSON.stringify(response.data, null, 2));
      // Return the movie data if we got a success response
      if (response.data.success || response.data.ok) {
        return {
          ...movieData,
          _id: 'temporary-id-' + Date.now() // Fallback ID if none provided
        };
      }
    }

    console.error(`Failed to create movie: ${movieData.title}. No valid response data received.`);
    return null;
  } catch (error) {
    console.error(`Error creating movie ${movieData.title}:`, error.response?.data || error.message);
    // If we got any kind of response, log it for debugging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
}

// Create screens in the database
async function createScreen(screenData) {
  try {
    console.log(`Creating screen: ${screenData.name} in ${screenData.city}`);
    console.log('Screen data before API call:', JSON.stringify(screenData, null, 2));
    
    // Make sure city name is lowercase as required by backend
    const screenToCreate = {
      name: screenData.name,
      city: screenData.city.toLowerCase(),
      screenType: screenData.screenType,
      location: screenData.location,
      seats: screenData.seats,
      adminId
    };
    
    console.log('Final payload to API:', JSON.stringify(screenToCreate, null, 2));
    
    // Try different endpoint formats based on common Express API structures
    let response;
    try {
      // Try the most common endpoint structure
      response = await api.post('/api/movie/admin/createscreen', screenToCreate);
    } catch (firstError) {
      console.log('First endpoint attempt failed, trying alternative endpoint...');
      try {
        // Try with movie/public prefix
        response = await api.post('/api/movie/public/admin/createscreen', screenToCreate);
      } catch (secondError) {
        console.log('Second endpoint attempt failed, trying one more alternative...');
        try {
          // Try without /api prefix
          response = await api.post('/movie/admin/createscreen', screenToCreate);
        } catch (thirdError) {
          console.log('Third endpoint attempt failed, trying final endpoint...');
          try {
            // Try the simplest version
            response = await api.post('/movie/createscreen', screenToCreate);
          } catch (finalError) {
            // If all attempts fail but we got a response with data, we'll try to use it
            if (finalError.response && finalError.response.data) {
              response = finalError.response;
            } else {
              throw finalError;
            }
          }
        }
      }
    }
    
    console.log('Screen creation response:', JSON.stringify(response?.data, null, 2));
    
    // Check if we have a screen ID in the response (various possible response formats)
    const screenId = response?.data?.data?._id || 
                    response?.data?.screen?._id || 
                    response?.data?._id ||
                    (typeof response?.data === 'object' && response?.data?.id);

    if (response?.data?.success || response?.data?.ok) {
      console.log(`Successfully created screen ${screenData.name}`);
      // If we have a success response but no ID, create a temporary one
      const screenResponse = {
        ...screenData,
        _id: screenId || 'screen-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      };
      console.log('Created screen with data:', JSON.stringify(screenResponse, null, 2));
      return screenResponse;
    } else {
      console.error(`Failed to create screen ${screenData.name}:`, response?.data);
      return null;
    }
  } catch (error) {
    console.error(`Error creating screen ${screenData.name}:`, error.response?.data || error.message);
    return null;
  }
}

// Create a schedule linking a movie to a screen
async function createSchedule(movieId, screenId, adminId) {
  try {
    const showDate = generateRandomShowDate();
    const showTime = generateRandomShowTime();
    
    console.log(`Creating schedule for movie ${movieId} on screen ${screenId}`);
    console.log(`Date: ${showDate}, Time: ${showTime}`);

    const scheduleData = {
      movieId,
      screenId,
      adminId,
      showDate,
      showTime,
      // Include default price for each category
      platinumPrice: 500,
      goldPrice: 300,
      silverPrice: 150
    };

    console.log('Schedule data:', JSON.stringify(scheduleData, null, 2));

    // Try different endpoint formats based on common Express API structures
    let response;
    try {
      // Try the most common endpoint structure
      response = await api.post('/api/movie/admin/createschedule', scheduleData);
    } catch (firstError) {
      console.log('First endpoint attempt failed, trying alternative endpoint...');
      try {
        // Try with movie/public prefix
        response = await api.post('/api/movie/public/admin/createschedule', scheduleData);
      } catch (secondError) {
        console.log('Second endpoint attempt failed, trying one more alternative...');
        try {
          // Try without /api prefix
          response = await api.post('/movie/admin/createschedule', scheduleData);
        } catch (thirdError) {
          console.log('Third endpoint attempt failed, trying final endpoint...');
          try {
            // Try the simplest version
            response = await api.post('/movie/createschedule', scheduleData);
          } catch (finalError) {
            if (finalError.response && finalError.response.data) {
              response = finalError.response;
            } else {
              throw finalError;
            }
          }
        }
      }
    }

    console.log('Schedule creation response:', JSON.stringify(response?.data, null, 2));

    if (response?.data?.success || response?.data?.ok) {
      console.log('Schedule created successfully');
      const scheduleResponse = {
        ...scheduleData,
        _id: response?.data?.data?._id || 
             response?.data?.schedule?._id || 
             response?.data?._id ||
             'schedule-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      };
      console.log('Created schedule with data:', JSON.stringify(scheduleResponse, null, 2));
      return scheduleResponse;
    } else {
      console.error('Failed to create schedule:', response?.data?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error creating schedule:', error.response?.data || error.message);
    return null;
  }
}

// Generate random showtime
function generateRandomShowTime() {
  // Indian cinema usually shows movies at certain fixed times
  const commonShowtimes = [
    '09:00 AM',
    '12:30 PM',
    '03:45 PM',
    '07:00 PM',
    '10:15 PM'
  ];
  
  return commonShowtimes[Math.floor(Math.random() * commonShowtimes.length)];
}

// Generate show date between now and next 30 days
function generateRandomShowDate() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30));
  
  // Format as YYYY-MM-DD for the database
  const year = futureDate.getFullYear();
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const day = String(futureDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Generate seats layout based on standard format in the app
function generateSeatsLayout() {
  // Create a layout with Platinum, Gold and Silver sections
  const layout = [
    {
      type: "Platinum",
      price: 500,
      rows: [
        {
          name: "H",
          columns: Array.from({ length: 10 }, (_, i) => ({ seat_id: `H${i + 1}` }))
        },
        {
          name: "G", 
          columns: Array.from({ length: 10 }, (_, i) => ({ seat_id: `G${i + 1}` }))
        },
        {
          name: "F",
          columns: Array.from({ length: 10 }, (_, i) => ({ seat_id: `F${i + 1}` }))
        }
      ]
    },
    {
      type: "Gold",
      price: 300,
      rows: [
        {
          name: "E",
          columns: Array.from({ length: 12 }, (_, i) => ({ seat_id: `E${i + 1}` }))
        },
        {
          name: "D",
          columns: Array.from({ length: 12 }, (_, i) => ({ seat_id: `D${i + 1}` }))
        },
        {
          name: "C",
          columns: Array.from({ length: 12 }, (_, i) => ({ seat_id: `C${i + 1}` }))
        }
      ]
    },
    {
      type: "Silver",
      price: 150,
      rows: [
        {
          name: "B",
          columns: Array.from({ length: 14 }, (_, i) => ({ seat_id: `B${i + 1}` }))
        },
        {
          name: "A",
          columns: Array.from({ length: 14 }, (_, i) => ({ seat_id: `A${i + 1}` }))
        }
      ]
    }
  ];

  return layout;
}

// Create a helper function for creating multiple schedules
async function createSchedulesForMovie(movieId, screenId, adminId) {
  const createdSchedules = [];
  
  console.log(`Creating ${NUM_SCHEDULES_PER_MOVIE} schedules for movie ${movieId} on screen ${screenId}`);
  
  try {
    // Create NUM_SCHEDULES_PER_MOVIE schedules (default is 3)
    for (let i = 0; i < NUM_SCHEDULES_PER_MOVIE; i++) {
      console.log(`Attempting to create schedule ${i+1}/${NUM_SCHEDULES_PER_MOVIE}`);
      
      try {
        const schedule = await createSchedule(movieId, screenId, adminId);
        if (schedule) {
          createdSchedules.push(schedule);
          console.log(`Successfully created schedule ${i+1}/${NUM_SCHEDULES_PER_MOVIE} for movie ${movieId}`);
        } else {
          console.error(`Failed to create schedule ${i+1}/${NUM_SCHEDULES_PER_MOVIE} for movie ${movieId}`);
        }
      } catch (scheduleError) {
        console.error(`Error during schedule creation: ${scheduleError.message}`);
      }
      
      // Add a small delay between schedule creations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Created ${createdSchedules.length}/${NUM_SCHEDULES_PER_MOVIE} schedules for movie ${movieId}`);
    return createdSchedules;
  } catch (error) {
    console.error(`Error in createSchedulesForMovie: ${error.message}`);
    return createdSchedules; // Return whatever schedules we managed to create
  }
}

// Main function to run the population process
async function populateDatabase() {
  try {
    console.log('Starting database population process...');
    
    // Login as admin
    await adminLogin();
    
    if (!adminId) {
      console.error('Admin ID is not set after login. Aborting.');
      return;
    }
    
    console.log(`Logged in successfully as admin (ID: ${adminId})`);
    
    // Step 1: Generate movie data
    let movieData;
    try {
      movieData = await generateMovieData(NUM_MOVIES);
      console.log(`Generated data for ${movieData.length} movies`);
    } catch (error) {
      console.warn('Error generating movie data with Hugging Face, using fallback data instead.');
      movieData = generateFallbackMovieData(NUM_MOVIES);
      console.log(`Generated fallback data for ${movieData.length} movies`);
    }
    
    // Step 2: Create movies in database
    console.log('Creating movies in database...');
    const createdMovies = [];
    for (const movie of movieData) {
      const createdMovie = await createMovie(movie);
      if (createdMovie) {
        createdMovies.push(createdMovie);
        console.log(`Successfully created movie: ${movie.title} (${createdMovies.length}/${movieData.length})`);
      } else {
        console.error(`Failed to create movie: ${movie.title}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Created ${createdMovies.length} out of ${movieData.length} movies`);
    
    // Continue with screen creation even if not all movies were created successfully
    if (createdMovies.length > 0) {
      // Create screens for each city
      console.log('Starting to create screens...');
      const createdScreens = [];
      for (const city of CITIES) {
        for (let i = 0; i < NUM_SCREENS_PER_CITY; i++) {
          let screenName;
          if (i === 0) {
            screenName = `${city} Cineplex`;
          } else if (i === 1) {
            screenName = `${city} INOX`;
          } else {
            screenName = `${city} PVR Cinema ${i}`;
          }
          
          // Generate screen type from available options
          const screenType = SCREEN_TYPES[Math.floor(Math.random() * SCREEN_TYPES.length)];
          
          // Create detailed screen data
          const screenData = {
            name: screenName,
            city: city,
            screenType: screenType,  // Explicitly set screenType
            location: `${screenName} Mall, ${city} Central`, // Explicit location
            seats: generateSeatsLayout() // Generate seat layout
          };
          
          console.log(`Attempting to create screen: ${screenName} (${screenType}) in ${city}`);
          const screen = await createScreen(screenData);
          
          if (screen) {
            createdScreens.push(screen);
            console.log(`Successfully created screen: ${screenName}`);
          } else {
            console.error(`Failed to create screen: ${screenName}`);
          }
          
          // Add a delay between screen creation attempts to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      console.log(`Created ${createdScreens.length} out of ${CITIES.length * NUM_SCREENS_PER_CITY} screens`);
      
      // Create schedules linking movies to screens
      console.log('Creating schedules...');
      const createdSchedules = [];

      // Take a subset of movies if there are many (to avoid too many schedules)
      const moviesToSchedule = createdMovies.slice(0, Math.min(createdMovies.length, 5));
      console.log(`Scheduling ${moviesToSchedule.length} movies across ${createdScreens.length} screens`);

      // Create schedules for each movie on each screen
      for (const screen of createdScreens) {
        for (const movie of moviesToSchedule) {
          console.log(`Creating schedules for movie ${movie.title} on screen ${screen.name}`);
          const schedules = await createSchedulesForMovie(movie._id, screen._id, adminId);
          createdSchedules.push(...schedules);
        }
      }

      console.log(`Created ${createdSchedules.length} schedules`);
      
      console.log('Database population completed!');
      console.log(`Created: ${createdMovies.length} movies, ${createdScreens.length} screens, ${createdSchedules.length} schedules`);
    } else {
      console.error('No movies were created successfully. Aborting screen and schedule creation.');
      return;
    }
  } catch (error) {
    console.error('Error during database population:', error);
    process.exit(1);
  }
}

// Run the script
populateDatabase().catch(error => {
  console.error('Unhandled error:', error);
}); 