
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { POPULAR_CITIES } from '../constants';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { city, setCity, isDetectingCity, detectCity } = useAppContext();
  const { isAuthenticated, userData, logout, clearMessages } = useAuth();
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [detectionError, setDetectionError] = useState('');
  const [detectionSuccess, setDetectionSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [theatreOwnerData, setTheatreOwnerData] = useState<any>(null);

  // Check for theatre owner authentication
  useEffect(() => {
    const storedTheatreOwnerData = localStorage.getItem('theatreOwnerData');
    if (storedTheatreOwnerData) {
      try {
        setTheatreOwnerData(JSON.parse(storedTheatreOwnerData));
      } catch (error) {
        console.error('Error parsing theatre owner data:', error);
      }
    }
  }, []);

  // Check if theatre owner is logged in
  const isTheatreOwnerLoggedIn = !!localStorage.getItem('theatreOwnerToken');

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setIsCityModalOpen(false);
    setDetectionError('');
    setDetectionSuccess(false);
    setRetryCount(0);
  };

  const handleDetectLocation = async () => {
    setDetectionError('');
    setDetectionSuccess(false);
    setRetryCount(prev => prev + 1);
    
    const result = await detectCity();
    if (result.city) {
      setDetectionSuccess(true);
      // Add a small delay to show success message before closing
      setTimeout(() => {
        handleCitySelect(result.city!);
      }, 1000);
    } else {
      setDetectionError(result.error || 'Could not detect your location. Please select a city manually.');
    }
  };

  const handleRetryDetection = () => {
    if (retryCount < 3) {
      handleDetectLocation();
    } else {
      setDetectionError('Maximum retry attempts reached. Please select a city manually.');
    }
  };

  const resetDetectionState = () => {
    setDetectionError('');
    setDetectionSuccess(false);
    setRetryCount(0);
  };

  const handleTheatreOwnerLogout = () => {
    localStorage.removeItem('theatreOwnerToken');
    localStorage.removeItem('theatreOwnerData');
    setTheatreOwnerData(null);
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <>
      <header className="bg-brand-gray shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-brand-red">
                BookNView
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="text-white hover:text-brand-red transition-colors">
                  Home
                </Link>
              </nav>
              <div className="hidden md:flex relative">
                <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search for Movies, Events, Plays..."
                  className="bg-white text-black rounded-md py-2 pl-10 pr-4 w-96 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  setIsCityModalOpen(true);
                  resetDetectionState();
                }} 
                className="flex items-center space-x-2 hover:bg-brand-dark px-3 py-2 rounded-md transition-colors"
              >
                <i className="fa fa-map-marker-alt text-brand-red"></i>
                <span>{city}</span>
                <i className="fa fa-chevron-down text-xs"></i>
              </button>
              {isTheatreOwnerLoggedIn && theatreOwnerData ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-white px-3 py-2 rounded-md">
                    <i className="fa fa-building text-xl text-brand-red"></i>
                    <span className="font-semibold">
                      {theatreOwnerData.ownerName}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-brand-dark rounded-md shadow-lg py-1 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-10 origin-top-right">
                    <Link
                      to="/theatre-owner/dashboard"
                      className="block w-full text-left px-4 py-2 text-sm text-brand-light-gray hover:bg-brand-gray"
                    >
                      <i className="fa fa-tachometer-alt mr-2"></i>
                      Dashboard
                    </Link>
                    <button
                      onClick={handleTheatreOwnerLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-brand-light-gray hover:bg-brand-gray"
                    >
                      <i className="fa fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              ) : isAuthenticated && userData ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-white px-3 py-2 rounded-md">
                    {userData.isAdmin || userData.role === 'admin' ? (
                      <i className="fa fa-shield-alt text-xl text-yellow-400"></i>
                    ) : userData.profilePicture ? (
                      <img
                        src={userData.profilePicture}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <i className="fa fa-user-circle text-xl"></i>
                    )}
                    <span className="font-semibold">
                      {userData.isAdmin || userData.role === 'admin' 
                        ? (userData.firstName || userData.displayName || 'Administrator')
                        : `Hi, ${userData.firstName || userData.displayName.split(' ')[0]}`
                      }
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-brand-dark rounded-md shadow-lg py-1 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-10 origin-top-right">
                    {userData.isAdmin || userData.role === 'admin' ? (
                      <>
                        <Link
                          to="/admin-dashboard"
                          className="block w-full text-left px-4 py-2 text-sm text-brand-light-gray hover:bg-brand-gray"
                        >
                          <i className="fa fa-tachometer-alt mr-2"></i>
                          Admin Dashboard
                        </Link>
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-brand-light-gray hover:bg-brand-gray"
                        >
                          <i className="fa fa-sign-out-alt mr-2"></i>
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/profile"
                          className="block w-full text-left px-4 py-2 text-sm text-brand-light-gray hover:bg-brand-gray"
                        >
                          <i className="fa fa-user mr-2"></i>
                          My Profile
                        </Link>
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-brand-light-gray hover:bg-brand-gray"
                        >
                          <i className="fa fa-sign-out-alt mr-2"></i>
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                 <button
                   onClick={() => {
                     clearMessages();
                     setIsLoginModalOpen(true);
                   }}
                   className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                 >
                  Login
                </button>
              )}
              <button className="md:hidden">
                <i className="fa fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <Modal isOpen={isCityModalOpen} onClose={() => {
        setIsCityModalOpen(false);
        resetDetectionState();
      }}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Select Your City</h2>
        
        <div className="mb-4">
          <button
            onClick={handleDetectLocation}
            disabled={isDetectingCity}
            className="w-full flex justify-center items-center py-3 px-4 bg-brand-red text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDetectingCity ? (
              <>
                <i className="fa fa-spinner fa-spin mr-2"></i>
                Detecting your location...
              </>
            ) : (
              <>
                <i className="fa fa-location-crosshairs mr-2"></i>
                Detect My Location
              </>
            )}
          </button>
          
          {detectionSuccess && (
            <div className="mt-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center">
              <i className="fa fa-check-circle mr-2"></i>
              <span>Location detected successfully!</span>
            </div>
          )}
          
          {detectionError && (
            <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <div className="flex items-start">
                <i className="fa fa-exclamation-triangle mr-2 mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-sm">{detectionError}</p>
                  {retryCount < 3 && (
                    <button
                      onClick={handleRetryDetection}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try again ({3 - retryCount} attempts left)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}


        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {POPULAR_CITIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCitySelect(c)}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-brand-red hover:text-white transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
        

      </Modal>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default Header;