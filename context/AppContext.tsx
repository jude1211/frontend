
import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { AppContextType, Movie, Showtime, Seat, Snack, CartSnack } from '../types';
import { POPULAR_CITIES } from '../constants';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [city, setCity] = useState('Mumbai');
  const [isDetectingCity, setIsDetectingCity] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [snackCart, setSnackCart] = useState<CartSnack[]>([]);

  // Note: Authentication is now handled by AuthContext directly
  // Components should use useAuth() hook instead of useAppContext() for auth
  
  const detectCity = async (): Promise<{ city?: string; error?: string; }> => {
    setIsDetectingCity(true);
    try {
      if (!navigator.geolocation) {
        return { error: "Geolocation is not supported by this browser." };
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Use OpenStreetMap Nominatim API for reverse geocoding (free and reliable)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BookNView-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.address) {
        // Try to get the most specific city name available
        const cityName = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.county ||
                        data.address.state;
        
        if (cityName) {
          // Check if the detected city is in our supported cities
          const supportedCity = findClosestSupportedCity(cityName);
          return { city: supportedCity || cityName };
        }
      }

      // Fallback: try to extract city from display_name
      if (data && data.display_name) {
        const parts = data.display_name.split(', ');
                const cityPart = parts.find((part: string) =>
          part.includes('City') || 
          part.includes('Municipality') ||
          (part.length > 0 && !part.includes('State') && !part.includes('Country'))
        );
        
        if (cityPart) {
          const cleanCityName = cityPart.replace(' City', '').replace(' Municipality', '');
          const supportedCity = findClosestSupportedCity(cleanCityName);
          return { city: supportedCity || cleanCityName };
        }
      }

      console.error("Could not determine city name from coordinates.");
      return { error: "Could not determine city name from your location." };
      
    } catch (error) {
      console.error("Full error details in detectCity:", error);
      
      let errorMessage = 'An unexpected error occurred while detecting your location.';

      if (error instanceof GeolocationPositionError) {
          if (error.code === error.PERMISSION_DENIED) {
              errorMessage = 'Location permission denied. Please enable location access in your browser settings to use this feature.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Your location information is currently unavailable. Please try again later.';
          } else if (error.code === error.TIMEOUT) {
              errorMessage = 'The request to get your location timed out. Please check your internet connection and try again.';
          }
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = `Failed to determine city from your location: ${(error as any).message}`;
      } else {
          errorMessage = 'An unknown error occurred while fetching the city name. Please try again or select manually.';
      }
      
      return { error: errorMessage };
    } finally {
      setIsDetectingCity(false);
    }
  };

  // Utility function to find the closest supported city
  const findClosestSupportedCity = (detectedCity: string): string | null => {
    const detectedCityLower = detectedCity.toLowerCase();
    
    // Direct match
    const directMatch = POPULAR_CITIES.find(city => 
      city.toLowerCase() === detectedCityLower
    );
    if (directMatch) return directMatch;
    
    // Partial match (e.g., "Mumbai" matches "Mumbai")
    const partialMatch = POPULAR_CITIES.find(city => 
      city.toLowerCase().includes(detectedCityLower) || 
      detectedCityLower.includes(city.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Check for common variations
    const cityVariations: { [key: string]: string } = {
      'bombay': 'Mumbai',
      'calcutta': 'Kolkata',
      'madras': 'Chennai',
      'bangalore': 'Bengaluru',
      'gurgaon': 'Delhi-NCR',
      'noida': 'Delhi-NCR',
      'ghaziabad': 'Delhi-NCR',
      'faridabad': 'Delhi-NCR',
      'gurugram': 'Delhi-NCR',
      'new delhi': 'Delhi-NCR',
      'old delhi': 'Delhi-NCR',
      'cochin': 'Kochi',
      'ahmedabad': 'Ahmedabad',
      'pune': 'Pune',
      'hyderabad': 'Hyderabad',
      'chandigarh': 'Chandigarh',
      'chennai': 'Chennai',
      'kolkata': 'Kolkata',
      'kochi': 'Kochi',
      'mumbai': 'Mumbai',
      'bengaluru': 'Bengaluru',
      'delhi': 'Delhi-NCR'
    };
    
    const variationMatch = cityVariations[detectedCityLower];
    if (variationMatch) return variationMatch;
    
    return null;
  };

  // Test function for development - simulates location detection
  const testLocationDetection = async (testCity: string): Promise<{ city?: string; error?: string; }> => {
    setIsDetectingCity(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const supportedCity = findClosestSupportedCity(testCity);
    setIsDetectingCity(false);
    
    if (supportedCity) {
      return { city: supportedCity };
    } else {
      return { error: `Test city "${testCity}" not found in supported cities.` };
    }
  };

  const addToCart = (snack: Snack) => {
    setSnackCart(prevCart => {
      const existingSnack = prevCart.find(item => item.id === snack.id);
      if (existingSnack) {
        return prevCart.map(item =>
          item.id === snack.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...snack, quantity: 1 }];
    });
  };

  const removeFromCart = (snackId: string) => {
    setSnackCart(prevCart => prevCart.filter(item => item.id !== snackId));
  };

  const updateQuantity = (snackId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(snackId);
    } else {
      setSnackCart(prevCart =>
        prevCart.map(item =>
          item.id === snackId ? { ...item, quantity } : item
        )
      );
    }
  };



  const totalSnackPrice = useMemo(() => {
    return snackCart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [snackCart]);

  const totalSeatPrice = useMemo(() => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  }, [selectedSeats]);

  const value = {
    city,
    setCity,
    isDetectingCity,
    detectCity,
    testLocationDetection,
    selectedMovie,
    setSelectedMovie,
    selectedShowtime,
    setSelectedShowtime,
    selectedSeats,
    setSelectedSeats,
    snackCart,
    setSnackCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    totalSnackPrice,
    totalSeatPrice,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
