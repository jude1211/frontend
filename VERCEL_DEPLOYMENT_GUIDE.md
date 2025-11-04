# Vercel Deployment Guide for BookNView Frontend

## Prerequisites
1. A Vercel account (sign up at vercel.com)
2. Your project connected to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your backend API deployed and accessible

## Environment Variables Required

You need to set these environment variables in your Vercel project settings:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### API Configuration
```
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

### TMDB API (for movie search)
```
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### Gemini AI API
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## How to Get These Values

### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on your web app or create one if you haven't
6. Copy the configuration values from the Firebase config object

### API Base URL
- If your backend is deployed on Vercel: `https://your-backend-project.vercel.app/api/v1`
- If on Railway: `https://your-backend-project.railway.app/api/v1`
- If on Render: `https://your-backend-project.onrender.com/api/v1`
- If on Heroku: `https://your-backend-project.herokuapp.com/api/v1`

### TMDB API Key
1. Go to [TMDB API](https://www.themoviedb.org/settings/api)
2. Create an account and request an API key
3. Copy the API key

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

## Deployment Steps

### 1. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the `frontend` folder as the root directory

### 2. Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Set Environment Variables
1. In your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add each environment variable with its corresponding value
4. Make sure to set them for Production, Preview, and Development environments

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Test movie browsing and search
- [ ] Test seat selection and booking
- [ ] Test payment integration
- [ ] Test theatre owner features (if applicable)
- [ ] Verify all API calls are working
- [ ] Check console for any errors

## Troubleshooting

### Common Issues

1. **Build Fails**: Check that all environment variables are set correctly
2. **API Calls Fail**: Verify the `VITE_API_BASE_URL` is correct and your backend is accessible
3. **Firebase Auth Issues**: Double-check all Firebase configuration values
4. **CORS Errors**: Ensure your backend has the correct CORS settings for your Vercel domain

### Environment Variable Format
- Use `VITE_` prefix for variables that should be accessible in the browser
- Don't use quotes around values in Vercel dashboard
- Make sure there are no trailing spaces

## Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Monitoring
- Use Vercel Analytics to monitor your app's performance
- Check the Functions tab for any serverless function logs
- Monitor your backend API for any issues

## Security Notes
- Never commit `.env` files to your repository
- Use Vercel's environment variables for sensitive data
- Regularly rotate your API keys
- Monitor your API usage and costs



