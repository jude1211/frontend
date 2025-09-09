// API service for backend integration
// Prefer Vite env; fallback to common local ports (prefer 5000 default, then 5001)
const VITE_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
const API_BASE_CANDIDATES = VITE_BASE ? [VITE_BASE] : ['http://localhost:5000/api/v1'];

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
  private async tryFetch<T>(endpoint: string, options: RequestInit, isFormData: boolean): Promise<ApiResponse<T>> {
    let lastError: any;
    for (const base of API_BASE_CANDIDATES) {
      try {
        // Add a short timeout so we can quickly fall back to the next base URL if one is unreachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${base}${endpoint}`, {
          headers: this.getAuthHeaders(isFormData),
          signal: controller.signal,
          ...options
        });
        clearTimeout(timeoutId);
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
            data
          });
          const error: any = new Error(data.message || data.error || 'Request failed');
          error.status = response.status;
          error.data = data;
          error.details = data.details;
          throw error;
        }
        return data as ApiResponse<T>;
      } catch (err) {
        lastError = err;
        // Try next candidate
        continue;
      }
    }
    throw lastError || new Error('Network error');
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

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const isFormData = options.body instanceof FormData;
      return await this.tryFetch<T>(endpoint, options, isFormData);
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
    return this.makeRequest<any>(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
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
    });
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
    });
  }

  async getOfflineBooking(bookingId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('theatreOwnerToken');
    return this.makeRequest<any>(`/offline-bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
}

export const apiService = new ApiService();
export type { ApiResponse, LoginData, SignupData, UserData, AuthResponse };
