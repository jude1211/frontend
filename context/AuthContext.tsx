import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { apiService, UserData } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string;
  successMessage: string;
  clearMessages: () => void;
  setUserDataManually: (user: UserData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isAuthenticated = !!currentUser || !!userData || apiService.isAuthenticated();

  useEffect(() => {
    // Check for stored authentication
    const storedUser = apiService.getStoredUser();
    if (storedUser) {
      setUserData(storedUser);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearMessages = () => {
    setAuthError('');
    setSuccessMessage('');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthError('');
      setSuccessMessage('');
      setIsLoading(true);

      console.log('🔐 Attempting login with backend API...');

      // Use backend API for authentication
      const response = await apiService.login({ email, password });

      if (response.success && response.data) {
        setUserData(response.data.user);

        // Check if this is an admin login
        if (response.data.user.isAdmin || response.data.user.role === 'admin') {
          setSuccessMessage('Admin login successful! Redirecting to dashboard...');
          console.log('✅ Admin login successful:', response.data.user.email);
        } else {
          setSuccessMessage('Login successful! Welcome back.');
          console.log('✅ Login successful:', response.data.user.email);
        }

        return true;
      } else {
        setAuthError(response.message || 'Login failed');
        console.error('❌ Login failed:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setAuthError('');
      setSuccessMessage('');
      setIsLoading(true);

      console.log('📝 Creating new account with backend API...');

      // Use backend API for signup
      const response = await apiService.signup({
        name,
        email,
        password,
        confirmPassword: password
      });

      if (response.success && response.data) {
        setUserData(response.data.user);
        setSuccessMessage('Account created successfully! Welcome to BookNView.');
        console.log('✅ Account created successfully:', response.data.user.email);
        return true;
      } else {
        setAuthError(response.message || 'Signup failed');
        console.error('❌ Signup failed:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setAuthError(error.message || 'Signup failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setAuthError('');
      setIsLoading(true);

      // Check if Firebase is properly configured
      if (!auth.app.options.apiKey || auth.app.options.apiKey.includes('your_firebase_api_key_here')) {
        setAuthError('Firebase is not properly configured. Please check your environment variables.');
        return false;
      }

      // Sign in with Google via Firebase
      const result = await signInWithPopup(auth, googleProvider);

      console.log('🔥 Firebase Google login successful!');
      console.log('👤 Google user info from Firebase:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified
      });

      // Send user data directly to backend (no need for token verification)
      const googleUserData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified
      };

      console.log('📤 Sending Google user data to backend...');
      const response = await apiService.googleAuth(googleUserData);

      if (response.success && response.data) {
        setUserData(response.data.user);
        setCurrentUser(result.user); // Also set Firebase user
        console.log('✅ Google user data stored in MongoDB:', response.data.user);
        return true;
      } else {
        console.error('❌ Backend Google auth failed:', response);
        setAuthError(response.message || 'Failed to store Google user data');
        return false;
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Google login error:', authError);

      // Handle specific Google auth errors
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          setAuthError('Sign-in was cancelled.');
          break;
        case 'auth/popup-blocked':
          setAuthError('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
          break;
        case 'auth/cancelled-popup-request':
          setAuthError('Sign-in was cancelled.');
          break;
        case 'auth/account-exists-with-different-credential':
          setAuthError('An account already exists with the same email but different sign-in credentials.');
          break;
        case 'auth/unauthorized-domain':
          setAuthError('This domain is not authorized for Google sign-in. Please check your Firebase configuration.');
          break;
        case 'auth/operation-not-allowed':
          setAuthError('Google sign-in is not enabled. Please enable it in your Firebase console.');
          break;
        case 'auth/invalid-api-key':
          setAuthError('Invalid Firebase API key. Please check your configuration.');
          break;
        case 'auth/app-not-authorized':
          setAuthError('This app is not authorized to use Firebase Authentication.');
          break;
        default:
          setAuthError(`Google sign-in failed: ${authError.message}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logging out user...');

      // Logout from backend
      await apiService.logout();

      // Also logout from Firebase
      try {
        await signOut(auth);
      } catch (firebaseError) {
        console.log('Firebase logout failed, but backend logout succeeded');
      }

      setCurrentUser(null);
      setUserData(null);
      setAuthError('');
      setSuccessMessage('Logged out successfully');

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('Logout failed. Please try again.');
    }
  };

  // Method to manually set user data (for OTP verification)
  const setUserDataManually = (user: UserData) => {
    setUserData(user);
    setSuccessMessage('Account verified and logged in successfully!');
    console.log('✅ User logged in after OTP verification:', user.email);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    isAuthenticated,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    logout,
    authError,
    successMessage,
    clearMessages,
    setUserDataManually
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
