# Movie-Mate Database Populator

This collection of scripts automatically populates the Movie-Mate database with movies, screens, and schedules using the admin API.

## Prerequisites

- Node.js installed (v14 or higher)
- Admin access to the Movie-Mate application

## Setup

1. Clone this repository:
   ```
   git clone <repository-url>
   cd movie-mate-db-populator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Edit the `.env` file and add your admin credentials:
     ```
     API_BASE_URL=http://localhost:8000  # Change if your backend is hosted elsewhere
     ADMIN_EMAIL=your-admin-email@example.com
     ADMIN_PASSWORD=your-admin-password
     ```

## Available Scripts

This repository includes three different scripts for populating your database:

### 1. OpenAI-based Population (database-populator.js)

Uses the OpenAI API to generate realistic movie data:

```
npm start
```

Requires: OpenAI API key in your `.env` file.

### 2. Hugging Face-based Population (database-populator-huggingface.js)

Uses Hugging Face's free API to generate movie data:

```
node database-populator-huggingface.js
```

Requires: Hugging Face API key in your `.env` file.

### 3. Offline Population (database-populator-offline.js)

Uses predefined movie data (no API keys required):

```
node database-populator-offline.js
```

This is the recommended option if you're experiencing API quota issues.

## Configuration Options

You can customize the following settings in the `.env` file:

- `NUM_MOVIES`: Number of movies to generate (default: 15)
- `NUM_SCREENS_PER_CITY`: Number of screens to create per city (default: 3)

You can also modify the `CITIES` and `SCREEN_TYPES` arrays in the script to change the available cities and screen types.

## Process Overview

Each script will:
1. Log in with your admin credentials
2. Generate/use movie data 
3. Create movies in the database
4. Create screens in different cities
5. Create schedules linking movies to screens

## Debugging

If any issues occur, check the console output for error messages. The scripts include detailed logging to help identify problems.

## Troubleshooting

### API Quota Issues

If you encounter API quota issues with OpenAI:
1. Use the Hugging Face alternative by obtaining a free API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Or use the offline version which requires no API key

### Connection Issues

If you have issues connecting to your backend:
1. Verify the `API_BASE_URL` in the `.env` file
2. Check your backend logs for any errors
3. Make sure CORS is properly configured on your backend

## Customization

To customize the script further:
- Modify the `generateSeatsLayout()` function to change the seating layout
- Edit the predefined movie data in the offline version to match your preferences
- Change the `getPlaceholderImages()` function to use different image URLs 