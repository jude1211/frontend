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
import AdminManageMovies from './pages/AdminManageMovies';
import AdminManageScreens from './pages/AdminManageScreens';
import TheatreOwnerSignupPage from './pages/TheatreOwnerSignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import TheatreOwnerProtectedRoute from './components/TheatreOwnerProtectedRoute';
import AuthGuard from './components/AuthGuard';
import TheatreOwnerLanding from './pages/TheatreOwnerLanding';
import TheatreOwnerDashboard from './pages/TheatreOwnerDashboard';
import MovieManagement from './theatre-owner/MovieManagement';
import ScreenManagement from './theatre-owner/ScreenManagement';
import ManageScreensAndShows from './theatre-owner/ManageScreensAndShows';
import ManageShowTimings from './theatre-owner/ManageShowTimings';
import SnacksManagement from './theatre-owner/SnacksManagement';
import TheatreOwnerReports from './pages/TheatreOwnerReports';
import TheatreOwnerProfile from './pages/TheatreOwnerProfile';
import DynamicMovieLanding from './pages/DynamicMovieLanding';
import LiveSeatLayoutPage from './pages/LiveSeatLayoutPage';

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
                <Route path="/live-movies" element={<DynamicMovieLanding />} />
                <Route path="/movie/:id" element={<MovieDetailPage />} />
                <Route path="/live-seats/:movieId/:screenId/:bookingDate/:showtime" element={<LiveSeatLayoutPage />} />
                <Route path="/select-seats/:movieId/:screenId/:bookingDate/:time" element={<SeatSelectionPage />} />
                <Route path="/snacks" element={<SnackOrderPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/admin" element={
                  <AuthGuard adminOnly={true}>
                    <AdminLoginPage />
                  </AuthGuard>
                } />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/movies" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminManageMovies />
                  </ProtectedRoute>
                } />
                <Route path="/admin/screens" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminManageScreens />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={<AdminDashboardPage />} />

                {/* Theatre Owner Routes */}
                <Route path="/theatre-owner-signup" element={<TheatreOwnerSignupPage />} />
                <Route path="/theatre-owner-landing" element={
                  <AuthGuard theatreOwnerOnly={true}>
                    <TheatreOwnerLanding />
                  </AuthGuard>
                } />
                <Route path="/theatre-owner/dashboard" element={<TheatreOwnerDashboard />} />
                <Route path="/theatre-owner" element={
                  <TheatreOwnerProtectedRoute>
                    <TheatreOwnerDashboard />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/movies" element={
                  <TheatreOwnerProtectedRoute>
                    <MovieManagement />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/screens" element={
                  <TheatreOwnerProtectedRoute>
                    <ScreenManagement />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/shows" element={
                  <TheatreOwnerProtectedRoute>
                    <ManageScreensAndShows />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/show-timings" element={
                  <TheatreOwnerProtectedRoute>
                    <ManageShowTimings />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/snacks" element={
                  <TheatreOwnerProtectedRoute>
                    <SnacksManagement />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/reports" element={
                  <TheatreOwnerProtectedRoute>
                    <TheatreOwnerReports />
                  </TheatreOwnerProtectedRoute>
                } />
                <Route path="/theatre-owner/profile" element={
                  <TheatreOwnerProtectedRoute>
                    <TheatreOwnerProfile />
                  </TheatreOwnerProtectedRoute>
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
