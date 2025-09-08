
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import SnackOrderPage from './pages/SnackOrderPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TheatreOwnerSignupPage from './pages/TheatreOwnerSignupPage';
import ProtectedRoute from './components/ProtectedRoute';

// Theatre Owner Components
import TheatreOwnerLoginPage from './pages/TheatreOwnerLoginPage';
import TheatreOwnerDashboard from './pages/TheatreOwnerDashboard';
import MovieManagement from './theatre-owner/MovieManagement';
import ScreenManagement from './theatre-owner/ScreenManagement';
import SnacksManagement from './theatre-owner/SnacksManagement';
import TheatreOwnerLanding from './pages/TheatreOwnerLanding';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <div className="flex flex-col min-h-screen bg-brand-bg">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/movie/:id" element={<MovieDetailPage />} />
                <Route path="/select-seats/:movieId/:showtimeId" element={<SeatSelectionPage />} />
                <Route path="/snacks" element={<SnackOrderPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                
                {/* Theatre Owner Routes */}
                <Route path="/theatre-owner-signup" element={<TheatreOwnerSignupPage />} />
                <Route path="/theatre-owner-landing" element={<TheatreOwnerLanding />} />
                <Route path="/theatre-owner/login" element={<TheatreOwnerLoginPage />} />
                <Route path="/theatre-owner/dashboard" element={<TheatreOwnerDashboard />} />
                <Route path="/theatre-owner" element={
                  <ProtectedRoute>
                    <TheatreOwnerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/theatre-owner/movies" element={
                  <ProtectedRoute>
                    <MovieManagement />
                  </ProtectedRoute>
                } />
                <Route path="/theatre-owner/screens" element={
                  <ProtectedRoute>
                    <ScreenManagement />
                  </ProtectedRoute>
                } />
                <Route path="/theatre-owner/snacks" element={
                  <ProtectedRoute>
                    <SnacksManagement />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
