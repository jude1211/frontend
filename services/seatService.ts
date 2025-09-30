import { apiService as api } from './api';

export interface Seat {
  _id: string;
  seatId: string;
  rowNumber: number;
  columnNumber: number;
  rowLabel: string;
  classType: 'Gold' | 'Silver' | 'Balcony';
  isAvailable: boolean;
  status: 'available' | 'booked' | 'aisle';
  color: string;
  price: number;
  tier: 'Base' | 'Premium' | 'VIP';
  gridRow: number;
  gridCol: number;
  seatLayoutId: string;
  theatreId: string;
  screenId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeatClass {
  _id: string;
  name: 'Gold' | 'Silver' | 'Balcony';
  color: string;
  price: number;
  tier: 'Base' | 'Premium' | 'VIP';
  rowRange: string;
  layout: {
    numRows: number;
    numCols: number;
    aisleColumns: number[];
  };
  seatLayoutId: string;
  theatreId: string;
  screenId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeatLayout {
  _id: string;
  theatreId: string;
  screenId: string;
  screenName: string;
  config: {
    numRows: number;
    numCols: number;
    aisleColumns: number[];
  };
  seatClasses: SeatClass[];
  totalRows: number;
  totalSeats: number;
  manualLayout: string[][];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  version: number;
}

export interface SeatLayoutWithDetails extends SeatLayout {
  seats: Seat[];
  seatClasses: SeatClass[];
}

export interface CreateSeatData {
  seatId: string;
  rowNumber: number;
  columnNumber: number;
  rowLabel: string;
  classType: 'Gold' | 'Silver' | 'Balcony';
  color?: string;
  price: number;
  tier: 'Base' | 'Premium' | 'VIP';
  gridRow: number;
  gridCol: number;
  seatLayoutId: string;
  theatreId: string;
  screenId: string;
}

export interface UpdateSeatPositionData {
  newRow: number;
  newCol: number;
  newGridRow: number;
  newGridCol: number;
}

export interface GenerateSeatsData {
  seatClasses: Omit<SeatClass, '_id' | 'seatLayoutId' | 'theatreId' | 'screenId' | 'createdAt' | 'updatedAt'>[];
}

class SeatService {
  // Fetch screen layout for current theatre owner by screenId
  async getScreenLayout(screenId: string): Promise<SeatLayout | null> {
    const token = localStorage.getItem('theatreOwnerToken');
    try {
      const res = await api.makeRequest<{ success: boolean; data: SeatLayout }>(`/screens/${encodeURIComponent(screenId)}/layout`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      return (res as any).data || null as any;
    } catch (err) {
      return null as any;
    }
  }

  // Save or update screen layout
  async saveScreenLayout(screenId: string, payload: {
    screenName?: string;
    layout: { rows: number; columns: number; aisleColumns?: number[]; totalSeats?: number };
    seatClasses?: Array<{ label: string; price: number; color: string; tier: 'Base' | 'Premium' | 'VIP'; rows: string }>;
    seats?: Array<{
      row: string;
      number: number;
      seatClass: string;
      price: number;
      color: string;
      status?: string;
      position?: { x: number; y: number };
      isAisle?: boolean;
      isActive?: boolean;
    }>;
  }): Promise<SeatLayout> {
    const token = localStorage.getItem('theatreOwnerToken');
    const res = await api.makeRequest<{ success: boolean; data: SeatLayout; message?: string }>(`/screens/${encodeURIComponent(screenId)}/layout`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return (res as any).data as any;
  }
  // Get all seats for a layout
  async getSeatsByLayout(layoutId: string): Promise<Seat[]> {
    const res = await api.makeRequest<{ data: Seat[] }>(`/seats/layout/${layoutId}`);
    return (res as any).data as any;
  }

  // Get seats by class type
  async getSeatsByClass(layoutId: string, classType: 'Gold' | 'Silver' | 'Balcony'): Promise<Seat[]> {
    const res = await api.makeRequest<{ data: Seat[] }>(`/seats/layout/${layoutId}/class/${classType}`);
    return (res as any).data as any;
  }

  // Get a specific seat by seatId
  async getSeatById(seatId: string): Promise<Seat> {
    const res = await api.makeRequest<{ data: Seat }>(`/seats/${seatId}`);
    return (res as any).data as any;
  }

  // Get total rows across all classes
  async getTotalRows(layoutId: string): Promise<number> {
    const res = await api.makeRequest<{ data: { totalRows: number } }>(`/seats/layout/${layoutId}/total-rows`);
    return (res as any).data.totalRows as any;
  }

  // Create a new seat
  async createSeat(seatData: CreateSeatData): Promise<Seat> {
    const res = await api.makeRequest<{ data: Seat }>(`/seats`, { method: 'POST', body: JSON.stringify(seatData) });
    return (res as any).data as any;
  }

  // Update seat position (for drag and drop)
  async updateSeatPosition(seatId: string, positionData: UpdateSeatPositionData): Promise<Seat> {
    const res = await api.makeRequest<{ data: Seat }>(`/seats/${seatId}/position`, { method: 'PUT', body: JSON.stringify(positionData) });
    return (res as any).data as any;
  }

  // Update seat properties
  async updateSeat(seatId: string, updateData: Partial<Seat>): Promise<Seat> {
    const res = await api.makeRequest<{ data: Seat }>(`/seats/${seatId}`, { method: 'PUT', body: JSON.stringify(updateData) });
    return (res as any).data as any;
  }

  // Delete a seat
  async deleteSeat(seatId: string): Promise<Seat> {
    const res = await api.makeRequest<{ data: Seat }>(`/seats/${seatId}`, { method: 'DELETE' });
    return (res as any).data as any;
  }

  // Bulk update seats
  async bulkUpdateSeats(layoutId: string, seats: Partial<Seat>[]): Promise<Seat[]> {
    const res = await api.makeRequest<{ data: Seat[] }>(`/seats/layout/${layoutId}/bulk`, { method: 'PUT', body: JSON.stringify({ seats }) });
    return (res as any).data as any;
  }

  // Generate seats for a layout
  async generateSeats(layoutId: string, seatClasses: GenerateSeatsData['seatClasses']): Promise<{
    seats: Seat[];
    seatClasses: SeatClass[];
    totalRows: number;
    totalSeats: number;
  }> {
    const res = await api.makeRequest<any>(`/seats/layout/${layoutId}/generate`, { method: 'POST', body: JSON.stringify({ seatClasses }) });
    return (res as any).data as any;
  }

  // Get layout with all details
  async getLayoutWithDetails(theatreId: string, screenId: string): Promise<SeatLayoutWithDetails> {
    const token = localStorage.getItem('theatreOwnerToken');
    const res = await api.makeRequest<SeatLayoutWithDetails>(`/seat-layouts/${theatreId}/${screenId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    });
    return (res as any).data as any;
  }

  // Create or update seat layout
  async createOrUpdateLayout(theatreId: string, screenId: string, layoutData: Partial<SeatLayout>): Promise<SeatLayout> {
    const token = localStorage.getItem('theatreOwnerToken');
    try {
      const res = await api.makeRequest<SeatLayout>(`/seat-layouts/${theatreId}/${screenId}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        body: JSON.stringify(layoutData)
      });
      return (res as any).data as any;
    } catch (error: any) {
      const message = error?.data?.message || error?.message || '';
      const status = error?.status;
      // Fallback path: some dev environments may not have a Theatre record yet
      if (status === 404) {
        const resFallback = await api.makeRequest<SeatLayout>(`/screens/${screenId}/layout`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          body: JSON.stringify({
            // Do not send theatreId to skip theatre existence check in this route
            screenName: (layoutData as any)?.screenName || `Screen ${screenId}`,
            config: (layoutData as any)?.config,
            seats: (layoutData as any)?.seats ?? [],
            seatClasses: (layoutData as any)?.seatClasses,
            manualLayout: (layoutData as any)?.manualLayout
          })
        });
        return (resFallback as any).data as any;
      }
      throw error;
    }
  }

  // Get seat layout by ID
  async getSeatLayout(layoutId: string): Promise<SeatLayout> {
    const res = await api.makeRequest<{ data: SeatLayout }>(`/seat-layouts/${layoutId}`);
    return (res as any).data as any;
  }

  // Update seat layout
  async updateSeatLayout(layoutId: string, updateData: Partial<SeatLayout>): Promise<SeatLayout> {
    const res = await api.makeRequest<{ data: SeatLayout }>(`/seat-layouts/${layoutId}`, { method: 'PUT', body: JSON.stringify(updateData) });
    return (res as any).data as any;
  }

  // Delete seat layout
  async deleteSeatLayout(layoutId: string): Promise<void> {
    await api.makeRequest(`/seat-layouts/${layoutId}`, { method: 'DELETE' });
  }

  // Helper method to generate seat ID
  generateSeatId(classType: 'Gold' | 'Silver' | 'Balcony', rowLabel: string, columnNumber: number): string {
    return `${classType}-${rowLabel}${columnNumber}`;
  }

  // Helper method to calculate grid position
  calculateGridPosition(rowLabel: string, columnNumber: number): { gridRow: number; gridCol: number } {
    return {
      gridRow: rowLabel.charCodeAt(0) - 'A'.charCodeAt(0),
      gridCol: columnNumber - 1
    };
  }

  // Helper method to parse row range
  parseRowRange(rowRange: string): string[] {
    const rows: string[] = [];
    const ranges = rowRange.split(',');
    
    for (const range of ranges) {
      const trimmed = range.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-');
        const startCode = start.charCodeAt(0);
        const endCode = end.charCodeAt(0);
        for (let c = startCode; c <= endCode; c++) {
          rows.push(String.fromCharCode(c));
        }
      } else {
        rows.push(trimmed);
      }
    }
    
    return rows;
  }

  // Helper method to get class color
  getClassColor(classType: 'Gold' | 'Silver' | 'Balcony'): string {
    const colors = {
      'Gold': '#FFD700',
      'Silver': '#C0C0C0',
      'Balcony': '#008000'
    };
    return colors[classType];
  }

  // Get configured screens from application for the logged-in theatre owner
  async getOwnerScreens(): Promise<{ screenCount: number; screens: Array<{ screenNumber: number; rows: number; columns: number; aisleColumns: number[]; seatClasses: any[] }> }> {
    const token = localStorage.getItem('theatreOwnerToken');
    const res = await api.makeRequest<{ success: boolean; data: { screenCount: number; screens: any[] } }>(`/theatre-owner/screens`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    });
    return (res as any).data as any;
  }
}

export const seatService = new SeatService();