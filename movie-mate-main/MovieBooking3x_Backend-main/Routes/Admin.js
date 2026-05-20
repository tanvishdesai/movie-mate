// adminRoutes.js

const express = require('express');
const router = express.Router();
const Admin = require('../Models/AdminSchema'); // Import the Admin model
const bcrypt = require('bcrypt');
const errorHandler = require('../Middlewares/errorMiddleware');
const adminTokenHandler = require('../Middlewares/checkAdminToken');

const jwt = require('jsonwebtoken');

function createResponse(ok, message, data) {
    return {
        ok,
        message,
        data,
    };
}

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if the admin with the same email already exists
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json(createResponse(false, 'Admin with this email already exists'));
        }

        // Hash the admin's password before saving it to the database


        const newAdmin = new Admin({
            name,
            email,
            password
        });

        await newAdmin.save(); // Await the save operation

        res.status(201).json(createResponse(true, 'Admin registered successfully'));
    } catch (err) {
        // Pass the error to the error middleware
        next(err);
    }
});


router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json(createResponse(false, 'Invalid admin credentials'));
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json(createResponse(false, 'Invalid admin credentials'));
        }

        // Generate an authentication token for the admin
        const adminAuthToken = jwt.sign({ adminId: admin._id }, process.env.JWT_ADMIN_SECRET_KEY, { expiresIn: '10m' });

        res.cookie('adminAuthToken', adminAuthToken, { httpOnly: true });
        res.status(200).json(createResponse(true, 'Admin login successful', { adminAuthToken }));
    } catch (err) {
        next(err);
    }
});



router.get('/checklogin', adminTokenHandler, async (req, res) => {
    res.json({
        adminId: req.adminId,
        ok: true,
        message: 'Admin authenticated successfully'
    })
})

// Add logout route for admin
router.post('/logout', async (req, res) => {
    try {
        // Clear the admin auth token cookie
        res.clearCookie('adminAuthToken');
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Admin logged out successfully'
        });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
});

// Public admin login endpoint (no authentication required)
router.post('/public/login', async (req, res, next) => {
    try {
        console.log('Public login endpoint called');
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('Missing email or password in request');
            return res.status(400).json(createResponse(false, 'Email and password are required'));
        }
        
        console.log('Public admin login attempt for:', email);
        
        // Check if the admin with this email exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('Admin not found with email:', email);
            return res.status(400).json(createResponse(false, 'Invalid credentials'));
        }

        console.log('Admin found, comparing passwords');
        
        // Validate password using bcrypt
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for admin:', email);
            return res.status(400).json(createResponse(false, 'Invalid credentials'));
        }

        // Generate tokens
        const adminAuthToken = jwt.sign({ adminId: admin._id }, process.env.JWT_ADMIN_SECRET_KEY, { expiresIn: '24h' });
        
        console.log('Admin login successful for:', email);
        
        // Note: we're not setting cookies here as it might cause CORS issues
        // The client should store the token and admin ID
        res.status(200).json(createResponse(true, 'Login successful', {
            adminAuthToken,
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            }
        }));
    } catch (err) {
        console.error('Admin login error:', err);
        next(err);
    }
});

// Public version of checklogin that doesn't require authentication
router.post('/public/checklogin', async (req, res, next) => {
    try {
        const { adminId } = req.body;
        
        console.log('Public checklogin request with adminId:', adminId);
        
        if (!adminId) {
            return res.status(400).json(createResponse(false, 'Admin ID is required'));
        }
        
        // Check if the admin exists
        const admin = await Admin.findById(adminId);
        if (!admin) {
            console.log('Admin not found with ID:', adminId);
            return res.status(404).json(createResponse(false, 'Admin not found'));
        }
        
        console.log('Admin found:', admin.email);
        
        // Return success response with admin info
        res.status(200).json(createResponse(true, 'Admin authenticated successfully', {
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            }
        }));
    } catch (err) {
        console.error('Public checklogin error:', err);
        next(err);
    }
});

router.use(errorHandler)

module.exports = router;