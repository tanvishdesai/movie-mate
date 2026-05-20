const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const bodyParser = require('body-parser');
const PORT = 8000;

const authRoutes = require('./Routes/Auth');
const adminRoutes = require('./Routes/Admin');
const movieRoutes = require('./Routes/Movie');
const imageuploadRoutes = require('./Routes/imageUploadRoutes');

require('dotenv').config();
require('./db')

// Configure CORS with more permissive settings
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            process.env.FRONTEND_URL,
            process.env.ADMIN_FRONTEND_URL
        ].filter(Boolean);
        
        // Check if the origin is allowed
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log(`Origin ${origin} not allowed by CORS`);
            return callback(null, true); // Allow all origins in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'Origin', 
        'Access-Control-Allow-Headers', 
        'Access-Control-Allow-Origin', 
        'Access-Control-Request-Method', 
        'Access-Control-Request-Headers',
        'Cache-Control',
        'Content-Length',
        'Pragma',
        'Expires',
        'X-Api-Key'
    ],
    exposedHeaders: ['Set-Cookie']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Configure middleware
app.use(express.json());
app.use(cookieParser());

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/movie', movieRoutes);
app.use('/image', imageuploadRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'The API is working' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

