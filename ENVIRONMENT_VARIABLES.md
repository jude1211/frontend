# Frontend Environment Variables

This document lists all environment variables used in the frontend with their exact values from the `.env.local` file.

## Current Environment Variables (from .env.local)

| Variable | Value | Description | Used In |
|----------|-------|-------------|---------|
| `GEMINI_API_KEY` | `PLACEHOLDER_API_KEY` | Gemini API key (for AI features) | `vite.config.ts` (lines 8-9) |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAtUzwCNYwjQg2rSvV5SFA_8hJQef7Ti9o` | Firebase API key | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `booknview-d2c04.firebaseapp.com` | Firebase authentication domain | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |
| `VITE_FIREBASE_PROJECT_ID` | `booknview-d2c04` | Firebase project ID | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `booknview-d2c04.firebasestorage.app` | Firebase storage bucket | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `788435525125` | Firebase messaging sender ID | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |
| `VITE_FIREBASE_APP_ID` | `1:788435525125:web:d6c2081d15e49f0917866c` | Firebase application ID | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-EQ47T3NRV8` | Firebase Analytics measurement ID | `config/firebase.ts`, `components/FirebaseConfigChecker.tsx` |

## Additional Environment Variables (Used in Code but Not in .env.local)

These variables are referenced in the code but not currently set in the `.env.local` file. They use default/fallback values:

| Variable | Current Value (from code) | Description | Used In |
|----------|---------------------------|-------------|---------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | Backend API base URL (fallback) | `services/api.ts` (line 3), `components/MovieSearchInput.tsx` (line 58), `pages/MovieDetailPage.tsx` (line 70) |
| `VITE_TMDB_API_KEY` | `your-tmdb-api-key-here` | The Movie Database (TMDB) API key (fallback) | `components/MovieSearchInput.tsx` (line 56), `pages/MovieDetailPage.tsx` (line 68) |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dslj1txvj` | Cloudinary cloud name (fallback) | `pages/TheatreOwnerSignupPage.tsx` (line 7) |
| `VITE_CLOUDINARY_UNSIGNED_PRESET` | `booknview` | Cloudinary unsigned upload preset (fallback) | `pages/TheatreOwnerSignupPage.tsx` (line 8) |
| `import.meta.env.PROD` | *(auto-set by Vite)* | Production mode flag | `components/FirebaseConfigChecker.tsx` (line 43) |
| `GEMINI_API_KEY` | `PLACEHOLDER_API_KEY` | Gemini API key (via vite.config.ts) | `vite.config.ts` (lines 8-9) - exposed as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` |

## Environment Variable Usage Details

### Firebase Configuration

**Location:** `frontend/config/firebase.ts` (lines 5-11)

All Firebase environment variables are required for Firebase initialization:
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Authentication domain
- `VITE_FIREBASE_PROJECT_ID` - Project identifier
- `VITE_FIREBASE_STORAGE_BUCKET` - Storage bucket URL
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Messaging sender ID
- `VITE_FIREBASE_APP_ID` - Application ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Analytics measurement ID (optional)

**Validation:** The code validates that required fields are present and not using placeholder values.

### API Base URL

**Location:** `frontend/services/api.ts` (line 3-5)

```typescript
const VITE_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
const DEFAULT_BASES = ['http://localhost:5000/api/v1'];
const API_BASE_CANDIDATES = VITE_BASE ? [VITE_BASE] : DEFAULT_BASES;
```

- **Current status:** Not set in `.env.local`
- **Fallback:** `http://localhost:5000/api/v1`
- **Usage:** Used for all backend API calls

### TMDB API Key

**Location:** `frontend/components/MovieSearchInput.tsx` (line 56)

```typescript
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'your-tmdb-api-key-here';
```

- **Current status:** Not set in `.env.local`
- **Fallback:** `your-tmdb-api-key-here` (placeholder)
- **Usage:** Used for movie search functionality via TMDB API
- **Note:** The fallback value is a placeholder and won't work. Actual API key is required.

### Gemini API Key

**Location:** `frontend/vite.config.ts` (lines 8-9)

```typescript
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```

- **Current value:** `PLACEHOLDER_API_KEY` (placeholder)
- **Usage:** Made available to the app via Vite's `define` config
- **Note:** Currently set to placeholder value

### Production Mode

**Location:** `frontend/components/FirebaseConfigChecker.tsx` (line 43)

```typescript
if (import.meta.env.PROD) {
  return null;
}
```

- **Auto-set by Vite:** Automatically set to `true` in production builds
- **Usage:** Used to conditionally render development-only components

## Notes

### Vite Environment Variables

- All frontend environment variables must be prefixed with `VITE_` to be exposed to the client-side code
- Variables are accessed via `import.meta.env.VITE_*` in the code
- `.env.local` file is typically gitignored and used for local development
- For production, these should be set in your deployment platform (Vercel, Netlify, etc.)

### Socket.IO Configuration

- The Socket.IO service (`services/socketService.ts`) currently uses polling mode
- It hardcodes the backend URL: `http://localhost:5000/api/v1/seat-layout/...`
- No environment variable is currently used for Socket.IO configuration
- Consider adding `VITE_SOCKET_URL` for production deployments

### Cloudinary Configuration

**Location:** `frontend/pages/TheatreOwnerSignupPage.tsx` (lines 7-8)

```typescript
const CLOUD_NAME = (import.meta as any)?.env?.VITE_CLOUDINARY_CLOUD_NAME || 'dslj1txvj';
const UNSIGNED_PRESET = (import.meta as any)?.env?.VITE_CLOUDINARY_UNSIGNED_PRESET || 'booknview';
```

- **VITE_CLOUDINARY_CLOUD_NAME:** Not set (uses fallback: `dslj1txvj`)
- **VITE_CLOUDINARY_UNSIGNED_PRESET:** Not set (uses fallback: `booknview`)
- **Usage:** Used for client-side file uploads to Cloudinary (theatre owner signup)
- **Note:** These are hardcoded fallback values that match the backend configuration

### Missing Variables

To enable full functionality, consider adding these to `.env.local`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1

# TMDB Configuration
VITE_TMDB_API_KEY=your_actual_tmdb_api_key_here

# Cloudinary Configuration (optional - has fallbacks)
VITE_CLOUDINARY_CLOUD_NAME=dslj1txvj
VITE_CLOUDINARY_UNSIGNED_PRESET=booknview

# Socket.IO Configuration (if needed)
VITE_SOCKET_URL=http://localhost:5000
```

## Complete List of All Environment Variables Used in Frontend Code

### Variables Set in .env.local:
1. `GEMINI_API_KEY` = `PLACEHOLDER_API_KEY`
2. `VITE_FIREBASE_API_KEY` = `AIzaSyAtUzwCNYwjQg2rSvV5SFA_8hJQef7Ti9o`
3. `VITE_FIREBASE_AUTH_DOMAIN` = `booknview-d2c04.firebaseapp.com`
4. `VITE_FIREBASE_PROJECT_ID` = `booknview-d2c04`
5. `VITE_FIREBASE_STORAGE_BUCKET` = `booknview-d2c04.firebasestorage.app`
6. `VITE_FIREBASE_MESSAGING_SENDER_ID` = `788435525125`
7. `VITE_FIREBASE_APP_ID` = `1:788435525125:web:d6c2081d15e49f0917866c`
8. `VITE_FIREBASE_MEASUREMENT_ID` = `G-EQ47T3NRV8`

### Variables Used in Code (Not in .env.local):
9. `VITE_API_BASE_URL` - Fallback: `http://localhost:5000/api/v1`
10. `VITE_TMDB_API_KEY` - Fallback: `your-tmdb-api-key-here`
11. `VITE_CLOUDINARY_CLOUD_NAME` - Fallback: `dslj1txvj`
12. `VITE_CLOUDINARY_UNSIGNED_PRESET` - Fallback: `booknview`
13. `import.meta.env.PROD` - Auto-set by Vite

### Variables Exposed via vite.config.ts:
14. `process.env.API_KEY` - From `GEMINI_API_KEY`
15. `process.env.GEMINI_API_KEY` - From `GEMINI_API_KEY`

## Environment Variable Summary

### By Category:
- **Firebase**: 7 variables (all set in `.env.local`)
- **API**: 1 variable (using fallback)
- **TMDB**: 1 variable (using placeholder fallback)
- **Cloudinary**: 2 variables (using hardcoded fallbacks)
- **AI/Gemini**: 1 variable (using placeholder, exposed as 2 process.env vars)
- **System**: 1 variable (auto-set by Vite)

**Total: 8 variables set in .env.local, 5 variables using fallbacks, 2 process.env variables**

