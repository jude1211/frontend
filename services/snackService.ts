import { apiService } from './api';

export interface Snack {
  _id: string; // From MongoDB
  id?: string; // For frontend compatibility
  name: string;
  category: 'popcorn' | 'beverages' | 'nachos' | 'combo' | 'candy' | 'other';
  price: number;
  originalPrice: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'low_stock';
  image: string;
  discountPercent: number;
  isActive: boolean;
  createdAt?: string;
}

export interface SnackStats {
  totalItems: number;
  available: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
}

const getAuthHeaders = () => {
  // Use theatreOwnerToken for admin operations, fallback to normal authToken string in case
  const token = localStorage.getItem('theatreOwnerToken') || localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // this will override default auth header in apiService
  }
  return headers;
};

export const snackService = {
  async getStats(): Promise<SnackStats> {
    const response = await apiService.makeRequest<SnackStats>('/snacks/stats', {
      method: 'GET',
    }, false); // disable cache for admin dashboard
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch stats');
    return response.data;
  },

  async getSnacks(category?: string, search?: string): Promise<Snack[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiService.makeRequest<any[]>(`/snacks${query}`, {
      method: 'GET'
    }, false); // disable cache for admin dashboard
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch snacks');
    
    // Map _id to id for compatibility
    return response.data.map((snack: any) => ({
      ...snack,
      id: snack._id,
      imageUrl: snack.image,
      discount: snack.discountPercent
    }));
  },

  async createSnack(snackData: Partial<Snack>): Promise<Snack> {
    const payload = {
      ...snackData,
      image: (snackData as any).imageUrl || snackData.image,
      discountPercent: (snackData as any).discount || snackData.discountPercent
    };
    
    const response = await apiService.makeRequest<Snack>('/snacks', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    }, false); // don't cache POST

    if (!response.success || !response.data) throw new Error(response.message || response.error || 'Failed to create snack');
    return response.data;
  },

  async updateSnack(id: string, snackData: Partial<Snack>): Promise<Snack> {
    const payload = {
      ...snackData,
      image: (snackData as any).imageUrl || snackData.image,
      discountPercent: (snackData as any).discount || snackData.discountPercent
    };

    const response = await apiService.makeRequest<Snack>(`/snacks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    }, false);

    if (!response.success || !response.data) throw new Error(response.message || response.error || 'Failed to update snack');
    return response.data;
  },

  async deleteSnack(id: string): Promise<void> {
    const response = await apiService.makeRequest<void>(`/snacks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }, false);
    
    if (!response.success) throw new Error(response.message || response.error || 'Failed to delete snack');
  }
};
