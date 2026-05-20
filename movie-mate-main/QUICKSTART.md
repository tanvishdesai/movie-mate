# Quick Start Guide

## No API Key Required (Recommended)

If you're experiencing OpenAI API quota issues, use this method:

1. Copy `.env.example` to `.env`
2. Edit `.env` and add ONLY your admin credentials:
   ```
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-admin-password
   ```

3. Run the offline script:
   ```
   npm run start:offline
   ```

That's it! This will populate your database with 15 predefined movies, screens in multiple cities, and schedules.

## Using Hugging Face (Free Alternative)

1. Get a free API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Copy `.env.example` to `.env`
3. Edit `.env` and add your admin credentials and Hugging Face key:
   ```
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-admin-password
   HUGGINGFACE_API_KEY=your-huggingface-key
   ```

4. Run the Hugging Face script:
   ```
   npm run start:huggingface
   ```

## Using OpenAI (If You Have Quota)

1. Copy `.env.example` to `.env`
2. Edit `.env` and add your admin credentials and OpenAI key:
   ```
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-admin-password
   OPENAI_API_KEY=your-openai-key
   ```

3. Run the standard script:
   ```
   npm start
   ``` 