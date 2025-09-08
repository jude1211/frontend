import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const validateConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field =>
    !firebaseConfig[field as keyof typeof firebaseConfig] ||
    firebaseConfig[field as keyof typeof firebaseConfig]?.toString().includes('your_')
  );

  if (missingFields.length > 0) {
    console.error('Firebase configuration is incomplete. Missing or placeholder values for:', missingFields);
    console.error('Please check your .env.local file and ensure all Firebase environment variables are set correctly.');
  }

  return missingFields.length === 0;
};

// Validate configuration
const isConfigValid = validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export configuration validation status
export { isConfigValid };

export default app;
