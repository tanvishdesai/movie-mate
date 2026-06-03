# Movie Mate

A comprehensive movie booking and discovery platform. Movie Mate features a full-stack architecture designed to handle movie listings, user bookings, and administrative management.

## Project Structure

- **MovieBooking3x-main**: The main frontend application for end-users to browse movies, select seats, and book tickets.
- **MovieBooking3x_Admin-main**: An administrative dashboard for managing movie catalogs, theaters, and user bookings.
- **MovieBooking3x_Backend-main / api-server**: The robust backend API handling database transactions, user authentication, and business logic.
- **Database Tools**: Scripts like `database-populator-huggingface.js` for seeding the database with realistic movie data utilizing HuggingFace models.

## Setup Instructions

Please refer to the internal `QUICKSTART.md` for detailed instructions on spinning up the individual microservices.

Generally, you will need to:
1. Navigate to the backend directory, install dependencies (`npm install`), configure your `.env`, and start the server.
2. Navigate to the frontend/admin directories, install dependencies, and start the development servers (e.g., `npm start`).
