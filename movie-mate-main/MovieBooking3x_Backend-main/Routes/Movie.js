const express = require('express');
const router = express.Router();


const User = require('../Models/UserSchema')
const Movie = require('../Models/MovieSchema')
const Booking = require('../Models/BookingSchema')
const Screen = require('../Models/ScreenSchema')
const PrivateScreening = require('../Models/PrivateScreeningSchema')
const Payment = require('../Models/PaymentSchema')


const errorHandler = require('../Middlewares/errorMiddleware');
const authTokenHandler = require('../Middlewares/checkAuthToken');
const adminTokenHandler = require('../Middlewares/checkAdminToken');


function createResponse(ok, message, data) {
    return {
        ok,
        message,
        data,
    };
}

router.get('/test', async (req, res) => {
    res.json({
        message: "Movie api is working"
    })
})


// admin access
router.post('/createmovie', adminTokenHandler, async (req, res, next) => {
    try {
        const { title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration } = req.body;

        const newMovie = new Movie({ title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration })
        await newMovie.save();
        res.status(201).json({
            ok: true,
            message: "Movie added successfully"
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/addcelebtomovie', adminTokenHandler, async (req, res, next) => {
    try {
        const { movieId, celebType, celebName, celebRole, celebImage } = req.body;
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }
        const newCeleb = {
            celebType,
            celebName,
            celebRole,
            celebImage
        };
        if (celebType === "cast") {
            movie.cast.push(newCeleb);
        } else {
            movie.crew.push(newCeleb);
        }
        await movie.save();

        res.status(201).json({
            ok: true,
            message: "Celeb added successfully"
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/createscreen', adminTokenHandler, async (req, res, next) => {
    try {
        const { name, location, seats, city, screenType } = req.body;
        const newScreen = new Screen({
            name,
            location,
            seats,
            city: city.toLowerCase(),
            screenType,
            movieSchedules: []
        });

        await newScreen.save();


        res.status(201).json({
            ok: true,
            message: "Screen added successfully"
        });
    }
    catch (err) {
        console.log(err);
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/addmoviescheduletoscreen', adminTokenHandler, async (req, res, next) => {
    console.log("Inside addmoviescheduletoscreen")
    try {
        const { screenId, movieId, showTime, showDate } = req.body;
        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Screen not found"
            });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }

        screen.movieSchedules.push({
            movieId,
            showTime,
            notavailableseats: [],
            showDate
        });

        await screen.save();

        res.status(201).json({
            ok: true,
            message: "Movie schedule added successfully"
        });

    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})


// user access
router.post('/bookticket', authTokenHandler, async (req, res, next) => {
    try {
        console.log("Book ticket request:", req.body);
        const { showTime, showDate, movieId, screenId, seats, totalPrice, paymentId, upiTransactionId } = req.body;
        
        // Validate required fields
        if (!showTime || !showDate || !movieId || !screenId || !seats || !totalPrice || !paymentId) {
            return res.status(400).json({
                ok: false,
                message: "Missing required booking information"
            });
        }

        // Check if the payment exists and is completed
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }

        // Verify the payment belongs to the user making the request
        if (payment.userId.toString() !== req.userId) {
            console.log(`User mismatch: ${payment.userId} vs ${req.userId}`);
            return res.status(403).json({
                ok: false,
                message: "You are not authorized to use this payment"
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                ok: false,
                message: "Payment not completed"
            });
        }

        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Theatre not found"
            });
        }

        const movieSchedule = screen.movieSchedules.find(schedule => {
            let showDate1 = new Date(schedule.showDate);
            let showDate2 = new Date(showDate);
            if (showDate1.getDay() === showDate2.getDay() &&
                showDate1.getMonth() === showDate2.getMonth() &&
                showDate1.getFullYear() === showDate2.getFullYear() &&
                schedule.showTime === showTime &&
                schedule.movieId == movieId) {
                return true;
            }
            return false;
        });

        if (!movieSchedule) {
            return res.status(404).json({
                ok: false,
                message: "Movie schedule not found"
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found"
            });
        }
        
        console.log('Creating new booking...');
        const newBooking = new Booking({ 
            userId: req.userId, 
            showTime, 
            showDate, 
            movieId, 
            screenId, 
            seats, 
            totalPrice, 
            paymentId: payment._id, 
            paymentType: 'UPI' 
        });
        await newBooking.save();
        console.log(`Booking created: ${newBooking._id}`);

        // Update payment with booking ID
        payment.bookingId = newBooking._id;
        await payment.save();
        console.log(`Payment updated with booking ID: ${newBooking._id}`);

        // Check for seat conflicts
        const conflictingSeats = [];
        for (const seat of seats) {
            const seatExists = movieSchedule.notAvailableSeats.some(
                unavailableSeat => unavailableSeat.seat_id === (seat.original_seat_id || seat.seat_id)
            );
            
            if (seatExists) {
                conflictingSeats.push(seat.seat_id);
            }
        }
        
        if (conflictingSeats.length > 0) {
            // If there are conflicts, rollback the booking and return error
            await Booking.findByIdAndDelete(newBooking._id);
            payment.bookingId = null;
            await payment.save();
            
            return res.status(409).json({
                ok: false,
                message: `The following seats are no longer available: ${conflictingSeats.join(', ')}. Please try booking again.`
            });
        }

        // Update seat availability
        movieSchedule.notAvailableSeats.push(...seats);
        await screen.save();
        console.log('Screen updated with unavailable seats');

        // Update user's bookings
        user.bookings.push(newBooking._id);
        await user.save();
        console.log('User updated with new booking');
        
        res.status(201).json({
            ok: true,
            message: "Booking successful",
            data: {
                bookingId: newBooking._id
            }
        });
    }
    catch (err) {
        console.error('Error creating booking:', err);
        next(err); // Pass any errors to the error handling middleware
    }
});


router.get('/movies', async (req, res, next) => {
    try {
        const movies = await Movie.find();

        // Return the list of movies as JSON response
        res.status(200).json({
            ok: true,
            data: movies,
            message: 'Movies retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})

// Add endpoint to get all screens
router.get('/screens', async (req, res, next) => {
    try {
        const screens = await Screen.find();
        
        res.status(200).json({
            ok: true,
            data: screens,
            message: 'All screens retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})

// Add endpoint to get all schedules
router.get('/schedules', async (req, res, next) => {
    try {
        const screens = await Screen.find();
        let allSchedules = [];
        
        // Extract all schedules from all screens
        screens.forEach(screen => {
            if (screen.movieSchedules && Array.isArray(screen.movieSchedules)) {
                const screenSchedules = screen.movieSchedules.map(schedule => ({
                    ...schedule.toObject(),
                    screenId: screen._id,
                    screenName: screen.name,
                    screenLocation: screen.location,
                    screenCity: screen.city
                }));
                
                allSchedules.push(...screenSchedules);
            }
        });
        
        res.status(200).json({
            ok: true,
            data: allSchedules,
            message: 'All schedules retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})

router.get('/movies/:id', async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const movie = await Movie.findById(movieId);
        if (!movie) {
            // If the movie is not found, return a 404 Not Found response
            return res.status(404).json({
                ok: false,
                message: 'Movie not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: movie,
            message: 'Movie retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.get('/screensbycity/:city', async (req, res, next) => {
    const city = req.params.city.toLowerCase();

    try {
        const screens = await Screen.find({ city });
        if (!screens || screens.length === 0) {
            return res.status(404).json(createResponse(false, 'No screens found in the specified city', null));
        }

        res.status(200).json(createResponse(true, 'Screens retrieved successfully', screens));
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});
router.get('/screensbymovieschedule/:city/:date/:movieid', async (req, res, next) => {
    try {
        const city = req.params.city.toLowerCase();
        const date = req.params.date;
        const movieId = req.params.movieid;

        // Retrieve screens for the specified city
        const screens = await Screen.find({ city });

        // Check if screens were found
        if (!screens || screens.length === 0) {
            return res.status(404).json(createResponse(false, 'No screens found in the specified city', null));
        }

        // Filter screens based on the movieId
        // const filteredScreens = screens.filter(screen =>
        //     screen.movieSchedules.some(schedule => schedule.movieId == movieId)
        // );


        let temp = []
        // Filter screens based on the showDate
        const filteredScreens = screens.forEach(screen => {
            // screen 

            screen.movieSchedules.forEach(schedule => {
                let showDate = new Date(schedule.showDate);
                let bodyDate = new Date(date);
                // console.log(showDate , bodyDate);
                if (showDate.getDay() === bodyDate.getDay() &&
                    showDate.getMonth() === bodyDate.getMonth() &&
                    showDate.getFullYear() === bodyDate.getFullYear() &&
                    schedule.movieId == movieId) {
                    temp.push(
                        screen
                    );
                }
            })
        }
        );

        console.log(temp);

        res.status(200).json(createResponse(true, 'Screens retrieved successfully', temp));

    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});

router.get('/schedulebymovie/:screenid/:date/:movieid', async (req, res, next) => {
    const screenId = req.params.screenid;
    const date = req.params.date;
    const movieId = req.params.movieid;

    const screen = await Screen.findById(screenId);

    if (!screen) {
        return res.status(404).json(createResponse(false, 'Screen not found', null));
    }

    const movieSchedules = screen.movieSchedules.filter(schedule => {
        let showDate = new Date(schedule.showDate);
        let bodyDate = new Date(date);
        if (showDate.getDay() === bodyDate.getDay() &&
            showDate.getMonth() === bodyDate.getMonth() &&
            showDate.getFullYear() === bodyDate.getFullYear() &&
            schedule.movieId == movieId) {
            return true;
        }
        return false;
    });
    console.log(movieSchedules)

    if (!movieSchedules) {
        return res.status(404).json(createResponse(false, 'Movie schedule not found', null));
    }

    res.status(200).json(createResponse(true, 'Movie schedule retrieved successfully', {
        screen,
        movieSchedulesforDate: movieSchedules
    }));

});


router.get('/getuserbookings' , authTokenHandler , async (req , res , next) => {
    try {
        const user = await User.findById(req.userId).populate('bookings');
        if(!user){
            return res.status(404).json(createResponse(false, 'User not found', null));
        }

        let bookings = [];
        
        for(let i = 0; i < user.bookings.length; i++){
            try {
                let bookingobj = await Booking.findById(user.bookings[i]._id)
                    .populate('screenId')
                    .populate('movieId');
                
                if (bookingobj) {
                    // Get payment details including upiTransactionId
                    try {
                        const payment = await Payment.findOne({ bookingId: bookingobj._id });
                        if (payment && payment.upiTransactionId) {
                            bookingobj = bookingobj.toObject();
                            bookingobj.upiTransactionId = payment.upiTransactionId;
                        }
                    } catch (paymentErr) {
                        console.error('Error fetching payment:', paymentErr);
                        // Continue even if payment fetch fails
                    }
                    
                    bookings.push(bookingobj);
                }
            } catch (bookingErr) {
                console.error('Error fetching booking:', bookingErr);
                // Continue with other bookings even if one fails
            }
        }

        res.status(200).json(createResponse(true, 'User bookings retrieved successfully', bookings));
    } catch (err) {
        console.error('Error in getuserbookings:', err);
        next(err); // Pass any errors to the error handling middleware
    }
})

router.get('/getuserbookings/:id' , authTokenHandler , async (req , res , next) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json(createResponse(false, 'Booking not found', null));
        }

        res.status(200).json(createResponse(true, 'Booking retrieved successfully', booking));
    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})

// Add update movie endpoint
router.put('/movies/:id', adminTokenHandler, async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const { title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration } = req.body;
        
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }
        
        // Update movie properties
        movie.title = title || movie.title;
        movie.description = description || movie.description;
        movie.portraitImgUrl = portraitImgUrl || movie.portraitImgUrl;
        movie.landscapeImgUrl = landscapeImgUrl || movie.landscapeImgUrl;
        movie.rating = rating !== undefined ? rating : movie.rating;
        movie.genre = genre || movie.genre;
        movie.duration = duration !== undefined ? duration : movie.duration;
        
        // Save the updated movie
        await movie.save();
        
        res.status(200).json({
            ok: true,
            message: "Movie updated successfully",
            data: movie
        });
    } catch (err) {
        console.error('Error updating movie:', err);
        next(err); // Pass any errors to the error handling middleware
    }
});

// Add delete movie endpoint
router.delete('/deletemovie/:id', adminTokenHandler, async (req, res, next) => {
    try {
        const movieId = req.params.id;
        
        // Find the movie
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }
        
        // Delete the movie
        await Movie.findByIdAndDelete(movieId);
        
        res.status(200).json({
            ok: true,
            message: "Movie deleted successfully"
        });
    } catch (err) {
        console.error('Error deleting movie:', err);
        next(err); // Pass any errors to the error handling middleware
    }
});

// Personalized movie recommendations based on user history
router.get('/recommendations', authTokenHandler, async (req, res, next) => {
    try {
        // Get user's booking history
        const bookings = await Booking.find({ userId: req.userId }).populate('movieId');
        
        if (bookings.length === 0) {
            // If user has no booking history, return popular movies instead
            const popularMovies = await Movie.find().sort({ rating: -1 }).limit(6);
            return res.json(createResponse(true, "Popular movies (no booking history found)", popularMovies));
        }
        
        // Extract genres from user's booking history
        const genrePreferences = {};
        bookings.forEach(booking => {
            if (booking.movieId && booking.movieId.genre) {
                const genres = booking.movieId.genre.split(',').map(g => g.trim());
                genres.forEach(genre => {
                    if (genrePreferences[genre]) {
                        genrePreferences[genre]++;
                    } else {
                        genrePreferences[genre] = 1;
                    }
                });
            }
        });
        
        // Sort genres by frequency
        const sortedGenres = Object.entries(genrePreferences)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        // Get top 3 genres if available
        const topGenres = sortedGenres.slice(0, 3);
        
        // Find movies matching user's preferred genres (excluding movies they've already booked)
        const bookedMovieIds = bookings.map(booking => booking.movieId._id.toString());
        
        // Create a regex pattern for genres
        const genrePattern = topGenres.map(genre => new RegExp(genre, 'i'));
        
        // Find recommendations based on user's genre preferences
        const recommendations = await Movie.find({
            _id: { $nin: bookedMovieIds },
            genre: { $regex: new RegExp(topGenres.join('|'), 'i') }
        }).limit(6);
        
        // Additional section with similarity metrics could be added here
        
        return res.json(createResponse(true, "Personalized movie recommendations", {
            recommendations,
            preferredGenres: topGenres
        }));
    } catch (err) {
        next(err);
    }
});

// Private screening request endpoints
router.post('/privatescreening/request', authTokenHandler, async (req, res, next) => {
    try {
        const { movieId, requestedDate, requestedTime, numberOfGuests, specialRequests } = req.body;
        
        // Validate the movie exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json(createResponse(false, "Movie not found", null));
        }
        
        // Create new private screening request
        const newRequest = new PrivateScreening({
            userId: req.userId,
            movieId,
            requestedDate,
            requestedTime,
            numberOfGuests,
            specialRequests
        });
        
        await newRequest.save();
        
        return res.status(201).json(createResponse(
            true, 
            "Private screening request submitted successfully", 
            newRequest
        ));
    } catch (err) {
        next(err);
    }
});

router.get('/privatescreening/user', authTokenHandler, async (req, res, next) => {
    try {
        const requests = await PrivateScreening.find({ userId: req.userId })
            .populate('movieId')
            .populate('screenId')
            .sort({ createdAt: -1 });
            
        return res.status(200).json(createResponse(
            true, 
            "User's private screening requests retrieved successfully", 
            requests
        ));
    } catch (err) {
        next(err);
    }
});

// Admin endpoints for private screenings
router.get('/privatescreening/all', adminTokenHandler, async (req, res, next) => {
    try {
        const requests = await PrivateScreening.find()
            .populate('userId', 'name email')
            .populate('movieId')
            .populate('screenId')
            .sort({ createdAt: -1 });
            
        return res.status(200).json(createResponse(
            true, 
            "All private screening requests retrieved successfully", 
            requests
        ));
    } catch (err) {
        next(err);
    }
});

router.put('/privatescreening/:requestId', adminTokenHandler, async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { status, screenId, price, adminMessage } = req.body;
        
        const request = await PrivateScreening.findById(requestId);
        if (!request) {
            return res.status(404).json(createResponse(false, "Private screening request not found", null));
        }
        
        // Update request
        if (status) request.status = status;
        if (screenId) request.screenId = screenId;
        if (price) request.price = price;
        if (adminMessage) request.adminMessage = adminMessage;
        
        await request.save();
        
        return res.status(200).json(createResponse(
            true, 
            "Private screening request updated successfully", 
            request
        ));
    } catch (err) {
        next(err);
    }
});

// Payment endpoint for approved private screenings
router.post('/privatescreening/:requestId/payment', authTokenHandler, async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { paymentId, paymentType } = req.body;
        
        const request = await PrivateScreening.findById(requestId);
        if (!request) {
            return res.status(404).json(createResponse(false, "Private screening request not found", null));
        }
        
        if (request.userId.toString() !== req.userId) {
            return res.status(403).json(createResponse(false, "Not authorized to make payment for this request", null));
        }
        
        if (request.status !== 'approved') {
            return res.status(400).json(createResponse(false, "Cannot process payment for unapproved request", null));
        }
        
        // Update payment information
        request.paymentStatus = 'paid';
        request.paymentId = paymentId;
        
        await request.save();
        
        return res.status(200).json(createResponse(
            true, 
            "Payment processed successfully", 
            request
        ));
    } catch (err) {
        next(err);
    }
});

// Payment-related endpoints
router.post('/create-payment', authTokenHandler, async (req, res, next) => {
    try {
        console.log("Create payment request:", req.body);
        const { bookingId, amount } = req.body;
        
        // Create a new payment record
        // Note: bookingId may be undefined at this stage - it will be attached later when booking is finalized
        const newPayment = new Payment({
            bookingId: bookingId || null, // Allow null/undefined bookingId initially
            userId: req.userId,
            amount,
            status: 'pending',
            paymentMethod: 'UPI',
            paymentDetails: {
                upiId: 'tanvishdesai.05@oksbi'
            }
        });
        
        await newPayment.save();
        
        console.log(`Payment initialized: ${newPayment._id} for user ${req.userId}`);
        
        res.status(201).json({
            ok: true,
            message: "Payment initiated",
            data: {
                paymentId: newPayment._id,
                upiId: 'tanvishdesai.05@oksbi'
            }
        });
    } catch (err) {
        console.error('Error creating payment:', err);
        next(err);
    }
});

router.post('/verify-payment', authTokenHandler, async (req, res, next) => {
    try {
        console.log("Verify payment request:", req.body);
        const { paymentId, upiTransactionId } = req.body;
        
        if (!paymentId || !upiTransactionId) {
            return res.status(400).json({
                ok: false,
                message: "Payment ID and UPI Transaction ID are required"
            });
        }
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }
        
        // Verify the payment belongs to the user making the request
        if (payment.userId.toString() !== req.userId) {
            console.log(`User mismatch: ${payment.userId} vs ${req.userId}`);
            return res.status(403).json({
                ok: false,
                message: "You are not authorized to verify this payment"
            });
        }
        
        // Update payment status
        payment.status = 'completed';
        payment.upiTransactionId = upiTransactionId;
        payment.updatedAt = Date.now();
        await payment.save();
        
        console.log(`Payment verified: ${paymentId} with transaction ${upiTransactionId}`);
        
        res.status(200).json({
            ok: true,
            message: "Payment verified successfully",
            data: payment
        });
    } catch (err) {
        console.error('Error verifying payment:', err);
        next(err);
    }
});

router.get('/payment/:paymentId', authTokenHandler, async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }
        
        res.status(200).json({
            ok: true,
            message: "Payment details retrieved",
            data: payment
        });
    } catch (err) {
        next(err);
    }
});

// Admin endpoints for payment management
router.get('/admin/payments', adminTokenHandler, async (req, res, next) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'name email')
            .populate('bookingId');
        
        res.status(200).json({
            ok: true,
            message: "All payments retrieved",
            data: payments
        });
    } catch (err) {
        next(err);
    }
});

router.put('/admin/update-payment-status', adminTokenHandler, async (req, res, next) => {
    try {
        const { paymentId, status } = req.body;
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }
        
        // Update payment status
        payment.status = status;
        payment.updatedAt = Date.now();
        await payment.save();
        
        res.status(200).json({
            ok: true,
            message: "Payment status updated successfully",
            data: payment
        });
    } catch (err) {
        next(err);
    }
});

// Payment-related endpoints - Public version that doesn't require auth token
router.post('/public/create-payment', async (req, res, next) => {
    try {
        console.log("Public payment request:", req.body);
        const { amount, userId } = req.body;
        
        if (!amount || !userId) {
            return res.status(400).json({
                ok: false,
                message: "Amount and userId are required"
            });
        }
        
        // Create a new payment record
        const newPayment = new Payment({
            bookingId: null, // Will be attached later
            userId: userId,
            amount,
            status: 'pending',
            paymentMethod: 'UPI',
            paymentDetails: {
                upiId: 'tanvishdesai.05@oksbi'
            }
        });
        
        await newPayment.save();
        
        console.log(`Public payment initialized: ${newPayment._id} for user ${userId}`);
        
        res.status(201).json({
            ok: true,
            message: "Payment initiated",
            data: {
                paymentId: newPayment._id,
                upiId: 'tanvishdesai.05@oksbi'
            }
        });
    } catch (err) {
        console.error('Error creating public payment:', err);
        next(err);
    }
});

// Public endpoint for verifying payments
router.post('/public/verify-payment', async (req, res, next) => {
    try {
        console.log("Public verify payment request:", req.body);
        const { paymentId, upiTransactionId, userId } = req.body;
        
        if (!paymentId || !upiTransactionId || !userId) {
            return res.status(400).json({
                ok: false,
                message: "Payment ID, UPI Transaction ID, and userId are required"
            });
        }
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }
        
        // Verify the payment belongs to the user in the request
        if (payment.userId.toString() !== userId) {
            console.log(`User mismatch: ${payment.userId} vs ${userId}`);
            return res.status(403).json({
                ok: false,
                message: "You are not authorized to verify this payment"
            });
        }
        
        // Update payment status
        payment.status = 'completed';
        payment.upiTransactionId = upiTransactionId;
        payment.updatedAt = Date.now();
        await payment.save();
        
        console.log(`Public payment verified: ${paymentId} with transaction ${upiTransactionId}`);
        
        res.status(200).json({
            ok: true,
            message: "Payment verified successfully",
            data: payment
        });
    } catch (err) {
        console.error('Error verifying public payment:', err);
        next(err);
    }
});

// Public booking endpoint that doesn't require authentication
router.post('/public/bookticket', async (req, res, next) => {
    try {
        console.log("Public book ticket request:", req.body);
        const { 
            showTime, 
            showDate, 
            movieId, 
            screenId, 
            seats, 
            totalPrice, 
            paymentId, 
            upiTransactionId,
            userId  // Get userId from request body instead of auth token
        } = req.body;
        
        // Validate required fields
        if (!showTime || !showDate || !movieId || !screenId || !seats || !totalPrice || !paymentId || !userId) {
            return res.status(400).json({
                ok: false,
                message: "Missing required booking information"
            });
        }

        // Check if the payment exists and is completed
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }

        // Verify the payment belongs to the user specified in the request
        if (payment.userId.toString() !== userId) {
            console.log(`User mismatch: ${payment.userId} vs ${userId}`);
            return res.status(403).json({
                ok: false,
                message: "You are not authorized to use this payment"
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                ok: false,
                message: "Payment not completed"
            });
        }

        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Theatre not found"
            });
        }

        const movieSchedule = screen.movieSchedules.find(schedule => {
            let showDate1 = new Date(schedule.showDate);
            let showDate2 = new Date(showDate);
            if (showDate1.getDay() === showDate2.getDay() &&
                showDate1.getMonth() === showDate2.getMonth() &&
                showDate1.getFullYear() === showDate2.getFullYear() &&
                schedule.showTime === showTime &&
                schedule.movieId == movieId) {
                return true;
            }
            return false;
        });

        if (!movieSchedule) {
            return res.status(404).json({
                ok: false,
                message: "Movie schedule not found"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found"
            });
        }
        
        console.log('Creating new booking via public endpoint...');
        const newBooking = new Booking({ 
            userId, 
            showTime, 
            showDate, 
            movieId, 
            screenId, 
            seats, 
            totalPrice, 
            paymentId: payment._id, 
            paymentType: 'UPI' 
        });
        await newBooking.save();
        console.log(`Public booking created: ${newBooking._id}`);

        // Update payment with booking ID
        payment.bookingId = newBooking._id;
        await payment.save();
        console.log(`Payment updated with booking ID: ${newBooking._id}`);

        // Check for seat conflicts
        const conflictingSeats = [];
        for (const seat of seats) {
            const seatExists = movieSchedule.notAvailableSeats.some(
                unavailableSeat => unavailableSeat.seat_id === (seat.original_seat_id || seat.seat_id)
            );
            
            if (seatExists) {
                conflictingSeats.push(seat.seat_id);
            }
        }
        
        if (conflictingSeats.length > 0) {
            // If there are conflicts, rollback the booking and return error
            await Booking.findByIdAndDelete(newBooking._id);
            payment.bookingId = null;
            await payment.save();
            
            return res.status(409).json({
                ok: false,
                message: `The following seats are no longer available: ${conflictingSeats.join(', ')}. Please try booking again.`
            });
        }

        // Update seat availability
        movieSchedule.notAvailableSeats.push(...seats);
        await screen.save();
        console.log('Screen updated with unavailable seats');

        // Update user's bookings
        user.bookings.push(newBooking._id);
        await user.save();
        console.log('User updated with new booking');
        
        res.status(201).json({
            ok: true,
            message: "Booking successful",
            data: {
                bookingId: newBooking._id
            }
        });
    }
    catch (err) {
        console.error('Error creating public booking:', err);
        next(err); // Pass any errors to the error handling middleware
    }
});

// Public endpoint for admin to get all payments (no authentication required)
router.post('/public/admin/payments', async (req, res, next) => {
    try {
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log("Public admin payments request from admin:", adminId);
        
        // In a production environment, you would verify this admin ID against your database
        // For now, we'll just use it for logging
        
        const payments = await Payment.find()
            .populate('userId', 'name email')
            .populate('bookingId');
        
        console.log(`Retrieved ${payments.length} payments for admin ${adminId}`);
        
        res.status(200).json({
            ok: true,
            message: "All payments retrieved",
            data: payments
        });
    } catch (err) {
        console.error('Error retrieving payments for admin:', err);
        next(err);
    }
});

// Public endpoint for admin to update payment status
router.post('/public/admin/update-payment-status', async (req, res, next) => {
    try {
        const { adminId, paymentId, status } = req.body;
        
        if (!adminId || !paymentId || !status) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID, Payment ID, and status are required"
            });
        }
        
        console.log(`Public admin payment status update request: Admin ${adminId}, Payment ${paymentId}, Status ${status}`);
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                ok: false,
                message: "Payment not found"
            });
        }
        
        // Update payment status
        payment.status = status;
        payment.updatedAt = Date.now();
        await payment.save();
        
        console.log(`Payment ${paymentId} status updated to ${status} by admin ${adminId}`);
        
        res.status(200).json({
            ok: true,
            message: "Payment status updated successfully",
            data: payment
        });
    } catch (err) {
        console.error('Error updating payment status by admin:', err);
        next(err);
    }
});

// Public admin endpoints for movie management
router.post('/public/admin/movies', async (req, res, next) => {
    try {
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin movies request from admin: ${adminId}`);
        
        const movies = await Movie.find();
        
        res.status(200).json({
            ok: true,
            data: movies,
            message: 'Movies retrieved successfully'
        });
    } catch (err) {
        console.error('Error retrieving movies for admin:', err);
        next(err);
    }
});

router.post('/public/admin/createmovie', async (req, res, next) => {
    try {
        const { adminId, title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin create movie request from admin: ${adminId}`);
        
        const newMovie = new Movie({ title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration });
        await newMovie.save();
        
        res.status(201).json({
            ok: true,
            message: "Movie added successfully"
        });
    } catch (err) {
        console.error('Error creating movie for admin:', err);
        next(err);
    }
});

router.post('/public/admin/deletemovie/:id', async (req, res, next) => {
    try {
        const { adminId } = req.body;
        const movieId = req.params.id;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin delete movie request from admin: ${adminId} for movie: ${movieId}`);
        
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }
        
        await Movie.findByIdAndDelete(movieId);
        
        res.status(200).json({
            ok: true,
            message: "Movie deleted successfully"
        });
    } catch (err) {
        console.error('Error deleting movie for admin:', err);
        next(err);
    }
});

// Public admin endpoints for screen management
router.post('/public/admin/screens', async (req, res, next) => {
    try {
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin screens request from admin: ${adminId}`);
        
        const screens = await Screen.find();
        
        res.status(200).json({
            ok: true,
            data: screens,
            message: 'Screens retrieved successfully'
        });
    } catch (err) {
        console.error('Error retrieving screens for admin:', err);
        next(err);
    }
});

router.post('/public/admin/createscreen', async (req, res, next) => {
    try {
        const { adminId, name, city, totalSeats, seatLayout } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin create screen request from admin: ${adminId}`);
        
        const newScreen = new Screen({ name, city, totalSeats, seatLayout });
        await newScreen.save();
        
        res.status(201).json({
            ok: true,
            message: "Screen added successfully"
        });
    } catch (err) {
        console.error('Error creating screen for admin:', err);
        next(err);
    }
});

// Public admin endpoints for schedule management
router.post('/public/admin/schedules', async (req, res, next) => {
    try {
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin schedules request from admin: ${adminId}`);
        
        const screens = await Screen.find().populate('movieSchedules.movieId');
        
        res.status(200).json({
            ok: true,
            data: screens,
            message: 'Schedules retrieved successfully'
        });
    } catch (err) {
        console.error('Error retrieving schedules for admin:', err);
        next(err);
    }
});

router.post('/public/admin/createschedule', async (req, res, next) => {
    try {
        const { adminId, screenId, movieId, showDate, showTime } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                ok: false,
                message: "Admin ID is required"
            });
        }
        
        console.log(`Public admin create schedule request from admin: ${adminId}`);
        
        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Screen not found"
            });
        }
        
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }
        
        // Add the schedule to the screen
        screen.movieSchedules.push({
            movieId,
            showDate,
            showTime,
            notAvailableSeats: []
        });
        
        await screen.save();
        
        res.status(201).json({
            ok: true,
            message: "Schedule added successfully"
        });
    } catch (err) {
        console.error('Error creating schedule for admin:', err);
        next(err);
    }
});

router.use(errorHandler)

module.exports = router;
