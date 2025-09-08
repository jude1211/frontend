# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with Google Sign-in for the BookNView application.

## Prerequisites

- A Google account
- Node.js and npm installed
- The BookNView frontend project

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "booknview-auth")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Click on "Google" in the providers list
5. Toggle the "Enable" switch
6. Enter your project's public-facing name
7. Choose a support email
8. Click "Save"

## Step 3: Register Your Web App

1. In the Firebase project overview, click the web icon (`</>`) to add a web app
2. Enter an app nickname (e.g., "BookNView Web")
3. Check "Also set up Firebase Hosting" if you plan to deploy (optional)
4. Click "Register app"
5. Copy the Firebase configuration object - you'll need this for the next step

## Step 4: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_actual_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
   ```

## Step 5: Configure Authorized Domains

1. In Firebase Console, go to Authentication > Settings > Authorized domains
2. Add your development domain (usually `localhost`)
3. If deploying, add your production domain as well

## Step 6: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Click on the login button
4. Try signing in with Google - it should open a Google sign-in popup
5. After successful authentication, you should be logged in to the application

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Make sure your domain is added to the authorized domains list in Firebase Console

2. **"Firebase: Error (auth/api-key-not-valid)"**
   - Check that your API key is correct in the `.env.local` file

3. **"Firebase: Error (auth/project-not-found)"**
   - Verify that your project ID is correct

4. **Google sign-in popup blocked**
   - Make sure your browser allows popups for the application domain

### Environment Variables Not Loading:

- Make sure your `.env.local` file is in the root of the frontend directory
- Restart the development server after changing environment variables
- Ensure all environment variables start with `VITE_` prefix

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file is already included in `.gitignore`
- Your Firebase API key is safe to expose in client-side code as it's designed for public use
- Firebase security is handled through Firebase Security Rules, not by hiding the API key

## Additional Features

The authentication system includes:

- Email/password authentication
- Google OAuth sign-in
- Automatic session persistence
- Error handling for common authentication issues
- Loading states during authentication

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure all required Firebase services are enabled
4. Check the Firebase Console for any error logs
