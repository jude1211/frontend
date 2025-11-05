// API service for backend integration
// Normalize base URL: ensure it includes /api/v1 when Vite env is provided
const RAW_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
const normalizeApiBase = (base?: string): string | undefined => {
  if (!base) return undefined;
  const trimmed = base.replace(/\/+$/, '');
  // If it already ends with /api/v{n}, keep as-is; otherwise append /api/v1
  if (/\/api\/v\d+$/.test(trimmed)) return trimmed;
  return `${trimmed}/api/v1`;
};

const VITE_BASE = normalizeApiBase(RAW_BASE);
const DEFAULT_BASES = ['https://backend-bnv.onrender.com/api/v1'];
const API_BASE_CANDIDATES = VITE_BASE ? [VITE_BASE] : DEFAULT_BASES;

// Import request cache and throttling
import { requestCache } from './requestCache';
import { requestThrottle } from '../utils/requestThrottle';

// Add error logging for debugging
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 API Request:', args[0]);
  console.log('🌐 Request details:', args[1]);

  return originalFetch.apply(this, args)
    .then(response => {
      console.log(`🌐 API Response: ${response.status} ${response.statusText}`);
      return response;
    })
    .catch(error => {
      console.error('🌐 API Network Error:', error);
      console.error('🌐 Error details:', {
        message: error.message,
        type: error.name,
        stack: error.stack
      });
      throw error;
    });
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  preferredCity: string;
  preferences: any;
  membershipTier: string;
  loyaltyPoints: number;
  totalBookings?: number;
  totalSpent?: number;
  lastLoginAt: string;
  createdAt: string;
  authProvider?: 'email' | 'google' | 'facebook';
  role?: string;
  isAdmin?: boolean;
}

interface AuthResponse {
  user: UserData;
  token: string;
  authMethod: 'manual' | 'google';
}

class ApiService {
  // Payment APIs
  async createPaymentOrder(bookingId: string): Promise<ApiResponse<{ order: any; keyId: string }>> {
    return this.makeRequest<{ order: any; keyId: string }>(`/payments/order`, {
      method: 'POST',
      body: JSON.stringify({ bookingId })
    }, false);
  }

  async verifyPayment(params: { bookingId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<ApiResponse<{ bookingId: string }>> {
    return this.makeRequest<{ bookingId: string }>(`/payments/verify`, {
      method: 'POST',
      body: JSON.stringify(params)
    }, false);
  }
  // Live seat layout for a show (with availability)
  async getLiveSeatLayout(screenId: string, bookingDate: string, showtime: string): Promise<ApiResponse<any>> {
    const endpoint = `/seat-layout/${encodeURIComponent(screenId)}/${encodeURIComponent(bookingDate)}/${encodeURIComponent(showtime)}`;
    
    // Throttle seat layout requests to prevent excessive calls
    return requestThrottle.throttle(
      `seat-layout-${screenId}-${bookingDate}-${showtime}`,
      () => this.tryFetch<any>(endpoint, { method: 'GET' }, false, false), // Disable cache for real-time data
      { delay: 1000, maxRequests: 10, windowMs: 60000 } // More lenient: 10 requests per minute with 1s delay
    );
  }

  // Confirm booking for a showtime (atomic validation + booking)
  async confirmSeatBooking(screenId: string, bookingDate: string, showtime: string, bookingPayload: any): Promise<ApiResponse<{ bookingId: string; totalAmount: number; currency: string }>> {
    return this.tryFetch<{ bookingId: string; totalAmount: number; currency: string }>(`/seat-layout/${encodeURIComponent(screenId)}/${encodeURIComponent(bookingDate)}/${encodeURIComponent(showtime)}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingPayload)
    }, true);
  }

  // Fetch seat layout for a show by showId
  async getShowSeatLayout(showId: string): Promise<ApiResponse<any>> {
    return this.tryFetch<any>(`/shows/${encodeURIComponent(showId)}/seat-layout`, { method: 'GET' }, false);
  }

  // Fetch booking details by booking ID

  private async tryFetch<T>(endpoint: string, options: RequestInit, isFormData: boolean, useCache: boolean = true, retryCount: number = 0): Promise<ApiResponse<T>> {
    // Check cache first for GET requests
    if (useCache && (!options.method || options.method === 'GET')) {
      const cached = requestCache.get<ApiResponse<T>>(endpoint, options);
      if (cached) {
        return cached;
      }

      // Check for pending request
      const pending = requestCache.getPendingRequest<ApiResponse<T>>(endpoint, options);
      if (pending) {
        return pending;
      }
    }

    let lastError: any;
    const fetchPromise = (async () => {
      for (const base of API_BASE_CANDIDATES) {
        // Prepare per-attempt timeout and controller outside inner try to avoid scope issues
        const timeoutMs = isFormData ? 30000 : 12000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const defaultHeaders = this.getAuthHeaders(isFormData);
          const optionHeaders = (options.headers || {}) as HeadersInit;
          // Merge headers so Authorization is preserved while allowing overrides like Content-Type
          const mergedHeaders: HeadersInit = { ...(defaultHeaders as any), ...(optionHeaders as any) };
          const response = await fetch(`${base}${endpoint}`, {
            ...options,
            headers: mergedHeaders,
            signal: controller.signal
          });
          let data: any = null;
          try {
            data = await response.json();
          } catch (parseError) {
            // Non-JSON response
            data = { message: response.statusText };
          }

          if (!response.ok) {
            console.error('API request failed:', {
              endpoint: `${base}${endpoint}`,
              status: response.status,
              data,
              retryCount
            });
            
            // Retry on rate limit or server errors (but not on client errors)
            if ((response.status === 429 || response.status >= 500) && retryCount < 3) {
              const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
              console.log(`⏳ Retrying request in ${backoffDelay}ms (attempt ${retryCount + 1}/3)`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              return this.tryFetch<T>(endpoint, options, isFormData, useCache, retryCount + 1);
            }
            
            const error: any = new Error(data.message || data.error || 'Request failed');
            error.status = response.status;
            error.data = data;
            error.details = data.details;
            throw error;
          }
          return data as ApiResponse<T>;
        } catch (err: any) {
          // Map AbortError to a clearer timeout error
          if (err?.name === 'AbortError') {
            lastError = new Error('Request timed out');
          } else {
            lastError = err;
          }
          // Try next candidate
          continue;
        } finally {
          clearTimeout(timeoutId);
        }
      }
      throw lastError || new Error('Network error');
    })();

    // Set pending request for deduplication
    if (useCache && (!options.method || options.method === 'GET')) {
      requestCache.setPendingRequest(endpoint, fetchPromise, options);
    }

    try {
      const result = await fetchPromise;
      
      // Cache successful GET requests
      if (useCache && (!options.method || options.method === 'GET') && result.success) {
        // Different TTL for different types of data
        let ttl = 5 * 60 * 1000; // 5 minutes default
        
        if (endpoint.includes('/movies/now-showing') || endpoint.includes('/movies/coming-soon')) {
          ttl = 10 * 60 * 1000; // 10 minutes for movie lists
        } else if (endpoint.includes('/seat-layout')) {
          ttl = 30 * 1000; // 30 seconds for seat layouts (real-time data)
        } else if (endpoint.includes('/movies/') && !endpoint.includes('/showtimes')) {
          ttl = 15 * 60 * 1000; // 15 minutes for movie details
        }
        
        requestCache.set(endpoint, result, ttl);
      }
      
      return result;
    } finally {
      // Clear pending request
      if (useCache && (!options.method || options.method === 'GET')) {
        requestCache.clearPendingRequest(endpoint, options);
      }
    }
  }
  private getAuthHeaders(isFormData: boolean = false): HeadersInit {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}, useCache: boolean = true): Promise<ApiResponse<T>> {
    try {
      const isFormData = options.body instanceof FormData;
      return await this.tryFetch<T>(endpoint, options, isFormData, useCache);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async signup(signupData: SignupData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData)
    });

    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async login(loginData: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async googleAuth(userData: any): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>('/auth/google-auth', {
      method: 'POST',
      body: JSON.stringify({ userData })
    });

    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: UserData }>> {
    return this.makeRequest<{ user: UserData }>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  // Forgot Password Methods
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async verifyResetOTP(otp: string, email: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.makeRequest<{ valid: boolean }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ otp, email })
    });
  }

  async resetPasswordWithOTP(otp: string, email: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ otp, email, newPassword })
    });
  }

  // OTP methods
  async sendOTP(data: { email: string; type?: 'verification' | 'password_reset' }): Promise<ApiResponse<any>> {
    const response = await this.makeRequest<any>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    return response;
  }

  async verifyOTP(data: { email: string; otp: string; type?: 'verification' | 'password_reset' }): Promise<ApiResponse<any>> {
    const response = await this.makeRequest<any>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    return response;
  }

  // User profile methods
  async updateProfile(profileData: Partial<UserData>): Promise<ApiResponse<UserData>> {
    return this.makeRequest<UserData>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async getUserBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/users/bookings${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest<any[]>(endpoint);
  }

  // Booking methods
  async createBooking(bookingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async getBooking(bookingId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/bookings/${bookingId}`);
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse<any>> {
    console.log('API Service: Cancelling booking', { bookingId, reason });
    try {
      const result = await this.makeRequest<any>(`/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      console.log('API Service: Cancel booking result', result);
      return result;
    } catch (error) {
      console.error('API Service: Cancel booking error', error);
      throw error;
    }
  }

  // Movie Ratings
  async submitMovieRating(movieId: string, rating: number, review?: string, bookingId?: string): Promise<ApiResponse<any>> {
    console.log('API Service: Submitting movie rating', { movieId, rating, review, bookingId });
    try {
      const requestBody: any = { movieId, rating };
      if (review) requestBody.review = review;
      if (bookingId) requestBody.bookingId = bookingId;
      
      const result = await this.makeRequest<any>('/movie-ratings', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      console.log('API Service: Submit rating result', result);
      return result;
    } catch (error) {
      console.error('API Service: Submit rating error', error);
      throw error;
    }
  }

  async getMovieRating(movieId: string): Promise<ApiResponse<any>> {
    console.log('API Service: Getting movie rating', { movieId });
    try {
      const result = await this.makeRequest<any>(`/movie-ratings/movie/${movieId}`);
      console.log('API Service: Get rating result', result);
      return result;
    } catch (error) {
      console.error('API Service: Get rating error', error);
      throw error;
    }
  }

  async updateMovieRating(ratingId: string, rating: number, review?: string): Promise<ApiResponse<any>> {
    console.log('API Service: Updating movie rating', { ratingId, rating, review });
    try {
      const result = await this.makeRequest<any>(`/movie-ratings/${ratingId}`, {
        method: 'PUT',
        body: JSON.stringify({ rating, review })
      });
      console.log('API Service: Update rating result', result);
      return result;
    } catch (error) {
      console.error('API Service: Update rating error', error);
      throw error;
    }
  }

  async deleteMovieRating(ratingId: string): Promise<ApiResponse<any>> {
    console.log('API Service: Deleting movie rating', { ratingId });
    try {
      const result = await this.makeRequest<any>(`/movie-ratings/${ratingId}`, {
        method: 'DELETE'
      });
      console.log('API Service: Delete rating result', result);
      return result;
    } catch (error) {
      console.error('API Service: Delete rating error', error);
      throw error;
    }
  }

  async getUserRatings(page = 1, limit = 10): Promise<ApiResponse<any>> {
    console.log('API Service: Getting user ratings', { page, limit });
    try {
      const result = await this.makeRequest<any>(`/movie-ratings/user?page=${page}&limit=${limit}`);
      console.log('API Service: Get user ratings result', result);
      return result;
    } catch (error) {
      console.error('API Service: Get user ratings error', error);
      throw error;
    }
  }

  // Admin Movies
  async adminListMovies(page = 1, limit = 20): Promise<ApiResponse<any>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    return this.makeRequest<any>(`/admin/movies?${qs}`);
  }
  async adminCreateMovie(payload: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/admin/movies', { method: 'POST', body: JSON.stringify(payload) });
    }
  async adminUpdateMovie(id: string, patch: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/admin/movies/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(patch) });
  }
  async adminDeleteMovie(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/admin/movies/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // Admin Screens
  async adminListScreens(page = 1, limit = 20): Promise<ApiResponse<any>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
    return this.makeRequest<any>(`/admin/screens?${qs}`);
  }
  async adminCreateScreen(payload: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/admin/screens', { method: 'POST', body: JSON.stringify(payload) });
  }
  async adminUpdateScreen(screenId: string, patch: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/admin/screens/${encodeURIComponent(screenId)}`, { method: 'PUT', body: JSON.stringify(patch) });
  }
  async adminDeleteScreen(screenId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/admin/screens/${encodeURIComponent(screenId)}`, { method: 'DELETE' });
  }

  // Movie methods
  async getMovies(params?: {
    page?: number;
    limit?: number;
    genre?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.genre) queryParams.append('genre', params.genre);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/movies${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest<any[]>(endpoint);
  }

  async getMoviesByLocation(city: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    const qs = new URLSearchParams({ city, limit: String(limit) }).toString();
    return this.makeRequest<any[]>(`/movies/by-location?${qs}`);
  }

  async getNowShowing(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/movies/now-showing`);
  }

  async getActiveMoviesWithShows(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/movies/active-with-shows`);
  }

  async getComingSoon(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/movies/coming-soon`);
  }

  async getMovie(movieId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/movies/${movieId}`);
  }

  async getMovieShowtimes(movieId: string, params?: {
    city?: string;
    date?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.date) queryParams.append('date', params.date);

    const endpoint = `/movies/${movieId}/showtimes${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest<any>(endpoint);
  }

  // Theatre methods
  async checkTheatreOwnerEmail(email: string): Promise<ApiResponse<{ exists: boolean; email: string; message: string }>> {
    return this.makeRequest<{ exists: boolean; email: string; message: string }>(`/theatres/owner-applications/check-email/${encodeURIComponent(email)}`);
  }

  async createTheatreOwnerApplication(payload: any): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>('/theatres/owner-applications', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
  async createTheatreOwnerApplicationMultipart(form: FormData): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>('/theatres/owner-applications', {
      method: 'POST',
      body: form
    });
  }
  async getTheatres(params?: {
    city?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/theatres${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest<any[]>(endpoint);
  }

  async getTheatre(theatreId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/theatres/${theatreId}`);
  }

  async getTheatreConcessions(theatreId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/theatres/${theatreId}/concessions`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getStoredUser(): UserData | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear cache when user logs out
    requestCache.clear();
  }

  // Cache management methods
  clearCache(): void {
    requestCache.clear();
  }

  clearCachePattern(pattern: string): void {
    requestCache.clearPattern(pattern);
  }

  getCacheStats(): { cacheSize: number; pendingRequests: number } {
    return requestCache.getStats();
  }

  // Admin methods
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/users/admin/all${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest<any>(endpoint);
  }

  async getTheatreApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/theatres/admin/applications${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest<any>(endpoint);
  }

  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/users/admin/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/users/admin/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  async approveApplication(applicationId: string): Promise<ApiResponse<any>> {
    console.log('🔧 API Service: Approving application', applicationId);
    console.log('🔧 API Service: Making PATCH request to /theatres/admin/applications/' + applicationId + '/approve');
    
    const token = localStorage.getItem('authToken');
    console.log('🔧 API Service: Auth token exists:', !!token);
    
    const response = await this.makeRequest<any>(`/theatres/admin/applications/${applicationId}/approve`, {
      method: 'PATCH'
    });
    
    console.log('🔧 API Service: Response received:', response);
    return response;
  }

  async rejectApplication(applicationId: string, reason: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/theatres/admin/applications/${applicationId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  }

  // Theatre Owner methods
  async theatreOwnerLogin(username: string, password: string): Promise<ApiResponse<any>> {
    console.log('🎭 Theatre Owner Login attempt:', { username, endpoint: '/theatre-owner/login' });
    
    const response = await this.makeRequest<any>('/theatre-owner/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response.success && response.data?.token) {
      localStorage.setItem('theatreOwnerToken', response.data.token);
      localStorage.setItem('theatreOwnerData', JSON.stringify(response.data.theatreOwner));
      console.log('✅ Theatre Owner login successful');
    }

    return response;
  }

  async getTheatreOwnerProfile(): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>('/theatre-owner/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async updateTheatreOwnerProfile(profileData: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>('/theatre-owner/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
  }

  // Offline Booking Methods
  async createOfflineBooking(bookingData: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>('/offline-bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
  }

  async getOfflineBookings(params?: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.makeRequest<any>(`/offline-bookings${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async getOfflineBooking(bookingId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>(`/offline-bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async updateOfflineBookingStatus(bookingId: string, status: string, reason?: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>(`/offline-bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, cancellationReason: reason })
    });
  }

  async getOfflineBookingStats(params?: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.makeRequest<any>(`/offline-bookings/stats/summary${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async searchOfflineBookings(query: string, page = 1, limit = 10): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>(`/offline-bookings/search/query?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Movie Management Methods for Theatre Owners
  async addMovie(movieData: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>('/movies', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(movieData)
    });
    if (result?.success) {
      // Invalidate owner movies and related lists
      this.clearCachePattern('^GET:/movies/theatre-owner/');
      this.clearCachePattern('^GET:/movies/');
    }
    return result;
  }

  async getTheatreOwnerMovies(theatreOwnerId: string): Promise<ApiResponse<any[]>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any[]>(`/movies/theatre-owner/${theatreOwnerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async updateMovie(movieId: string, movieData: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/movies/${movieId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(movieData)
    });
    if (result?.success) {
      this.clearCachePattern('^GET:/movies/theatre-owner/');
      this.clearCachePattern(`^GET:/movies/${movieId}$`);
      this.clearCachePattern('^GET:/screens/.*/shows');
    }
    return result;
  }

  async deleteMovie(movieId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/movies/${movieId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (result?.success) {
      this.clearCachePattern('^GET:/movies/theatre-owner/');
      this.clearCachePattern('^GET:/screens/.*/shows');
    }
    return result;
  }

  // Screen Layout APIs
  async saveScreenLayout(screenId: string, layoutData: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/screens/${screenId}/layout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(layoutData)
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/screens/${screenId}/layout`);
    }
    return result;
  }

  async updateScreenLayout(screenId: string, layoutData: any): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/screens/${screenId}/layout`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(layoutData)
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/screens/${screenId}/layout`);
    }
    return result;
  }

  async getScreenLayout(screenId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    return this.makeRequest<any>(`/screens/${screenId}/layout?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Public API method for getting screen layout (no authentication required)
  async getPublicScreenLayout(screenId: string): Promise<ApiResponse<any>> {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    return this.makeRequest<any>(`/screens/${screenId}/layout?t=${timestamp}`, {
      method: 'GET'
    });
  }

  // Screen Management APIs
  async getOwnerScreens(ownerId: string): Promise<ApiResponse<{ screenCount: number; screens: any[] }>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<{ screenCount: number; screens: any[] }>(`/theatres/owner/${encodeURIComponent(ownerId)}/screens`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async syncScreenLayouts(ownerId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/theatres/owner/${encodeURIComponent(ownerId)}/sync-layouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/theatres/owner/${ownerId}/screens`);
      this.clearCachePattern('^GET:/screens/.*/layout');
    }
    return result;
  }

  async addOwnerScreen(ownerId: string, payload: { name?: string; type?: string }): Promise<ApiResponse<{ screenCount: number; screens: any[] }>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<{ screenCount: number; screens: any[] }>(`/theatres/owner/${encodeURIComponent(ownerId)}/screens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload || {})
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/theatres/owner/${ownerId}/screens`);
    }
    return result;
  }

  async deleteOwnerScreen(ownerId: string, screenId: string): Promise<ApiResponse<{ message: string }>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<{ message: string }>(`/theatres/owner/${encodeURIComponent(ownerId)}/screens/${encodeURIComponent(screenId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/theatres/owner/${ownerId}/screens`);
      this.clearCachePattern(`^GET:/screens/${screenId}/shows`);
    }
    return result;
  }

  async updateScreenConfiguration(ownerId: string, screenNumber: string, payload: { 
    rows?: string; 
    columns?: string; 
    aisleColumns?: string; 
    seatClasses?: Array<{ label: string; price: string }>; 
    seatingCapacity?: string; 
  }): Promise<ApiResponse<{ message: string; screen: any }>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<{ message: string; screen: any }>(`/theatres/owner/${encodeURIComponent(ownerId)}/screens/${encodeURIComponent(screenNumber)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload || {})
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/theatres/owner/${ownerId}/screens`);
      this.clearCachePattern(`^GET:/screens/${screenNumber}/shows`);
    }
    return result;
  }

  // Screen Shows APIs
  async getScreenShows(screenId: string, date?: string): Promise<ApiResponse<any[]>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.makeRequest<any[]>(`/screens/${encodeURIComponent(screenId)}/shows${qs}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async saveScreenShows(screenId: string, movieId: string, showtimes: string[], bookingDate?: string, maxDays?: number): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/screens/${encodeURIComponent(screenId)}/shows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movieId, showtimes, bookingDate, maxDays })
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/screens/${screenId}/shows`);
    }
    return result;
  }

  async deleteScreenShow(screenId: string, showId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/screens/${encodeURIComponent(screenId)}/shows/${encodeURIComponent(showId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/screens/${screenId}/shows`);
    }
    return result;
  }

  async cleanupPastScreenShows(screenId: string): Promise<ApiResponse<{ deletedCount: number }>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<{ deletedCount: number }>(`/screens/${encodeURIComponent(screenId)}/shows/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/screens/${screenId}/shows`);
    }
    return result;
  }

  // Movie advance booking management
  async updateMovieAdvanceBooking(movieId: string, enabled: boolean): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/movies/${encodeURIComponent(movieId)}/advance-booking`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled })
    });
    if (result?.success) {
      this.clearCachePattern('^GET:/movies/theatre-owner/');
    }
    return result;
  }

  // Show Timings Management APIs
  async getShowTimings(ownerId: string): Promise<ApiResponse<any[]>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any[]>(`/show-timings/owner/${encodeURIComponent(ownerId)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async getAvailableTimings(ownerId: string, date: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>(`/show-timings/owner/${encodeURIComponent(ownerId)}/available/${encodeURIComponent(date)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, false);
  }

  async saveWeekdayTimings(ownerId: string, timings: string[]): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/show-timings/owner/${encodeURIComponent(ownerId)}/weekday`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timings })
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/show-timings/owner/${ownerId}`);
      this.clearCachePattern(`^GET:/show-timings/owner/${ownerId}/available/`);
    }
    return result;
  }

  async saveWeekendTimings(ownerId: string, timings: string[]): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/show-timings/owner/${encodeURIComponent(ownerId)}/weekend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timings })
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/show-timings/owner/${ownerId}`);
      this.clearCachePattern(`^GET:/show-timings/owner/${ownerId}/available/`);
    }
    return result;
  }

  async createSpecialTiming(ownerId: string, timings: string[], specialDate: string, description?: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/show-timings/owner/${encodeURIComponent(ownerId)}/special`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timings, specialDate, description })
    });
    if (result?.success) {
      this.clearCachePattern(`^GET:/show-timings/owner/${ownerId}`);
      this.clearCachePattern(`^GET:/show-timings/owner/${ownerId}/available/`);
    }
    return result;
  }

  async updateSpecialTiming(timingId: string, timings: string[], description?: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/show-timings/special/${encodeURIComponent(timingId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timings, description })
    });
    if (result?.success) {
      this.clearCachePattern('^GET:/show-timings/owner/');
      this.clearCachePattern('^GET:/show-timings/owner/.*/available/');
    }
    return result;
  }

  async deleteSpecialTiming(timingId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    const result = await this.makeRequest<any>(`/show-timings/special/${encodeURIComponent(timingId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (result?.success) {
      this.clearCachePattern('^GET:/show-timings/owner/');
      this.clearCachePattern('^GET:/show-timings/owner/.*/available/');
    }
    return result;
  }
}

export const apiService = new ApiService();
export type { ApiResponse, LoginData, SignupData, UserData, AuthResponse };
