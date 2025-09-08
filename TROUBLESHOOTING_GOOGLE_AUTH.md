# Troubleshooting Google Authentication

## Quick Fix for "Google sign-in failed" Error

The error you're seeing is most likely due to one of these common issues:

### 1. **Firebase Configuration Not Set Up (Most Common)**

Your `.env.local` file currently has placeholder values. You need to:

1. **Create a Firebase Project** (if you haven't already):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Google Authentication**:
   - In Firebase Console → Authentication → Sign-in method
   - Click on "Google" and enable it
   - Set your support email

3. **Get Your Firebase Config**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click on the web app icon `</>`
   - Copy the config object

4. **Update Your `.env.local` File**:
   Replace the placeholder values with your actual Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyC...your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-actual-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### 2. **Domain Not Authorized**

If you have Firebase configured but still get errors:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `localhost` (for development)
3. If using a different port, add `localhost:5173` or your specific port

### 3. **Browser Issues**

- **Pop-up Blocked**: Make sure your browser allows pop-ups for localhost
- **Third-party Cookies**: Some browsers block third-party cookies which can affect OAuth
- **Incognito Mode**: Try in a regular browser window (not incognito)

### 4. **Development Server Issues**

Make sure to restart your development server after changing environment variables:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Testing Your Configuration

I've added a "Check Firebase Config" button in the bottom-right corner of your app (only visible in development). Click it to verify your configuration is loaded correctly.

## Step-by-Step Debugging

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for any red error messages
   - The improved error handling will show specific error codes

2. **Verify Environment Variables**:
   - Click the "Check Firebase Config" button
   - It will tell you if any values are missing or still using placeholders

3. **Test Firebase Connection**:
   - Try email/password authentication first
   - If that works, the issue is specifically with Google OAuth setup

## Common Error Codes and Solutions

- `auth/unauthorized-domain`: Add your domain to Firebase authorized domains
- `auth/operation-not-allowed`: Enable Google sign-in in Firebase Console
- `auth/invalid-api-key`: Check your API key in `.env.local`
- `auth/popup-blocked`: Allow pop-ups in your browser
- `auth/popup-closed-by-user`: User closed the pop-up (not an error)

## Quick Test Setup (For Immediate Testing)

If you want to test the functionality immediately without setting up your own Firebase project, you can use these test credentials temporarily:

**⚠️ WARNING: These are for testing only - replace with your own Firebase project for production!**

```env
VITE_FIREBASE_API_KEY=AIzaSyBdVl-cTICSwYKrjn-gKfnhOdTA3gCWXco
VITE_FIREBASE_AUTH_DOMAIN=test-booknview.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=test-booknview
VITE_FIREBASE_STORAGE_BUCKET=test-booknview.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:test123
VITE_FIREBASE_MEASUREMENT_ID=G-TEST123
```

## Next Steps

1. Set up your own Firebase project using the detailed guide in `FIREBASE_SETUP.md`
2. Replace the test credentials with your own
3. Test the Google authentication
4. Remove the FirebaseConfigChecker component once everything works

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Use the Firebase Config Checker button
3. Verify your Firebase project settings
4. Make sure Google authentication is enabled in Firebase Console
