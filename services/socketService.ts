// Fallback Socket Service - using polling instead of WebSocket for now
// This will be replaced with proper Socket.IO when the package is installed

class SocketService {
  private isConnected = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime: string | null = null;
  private lastReservedSeats: string[] = [];
  private currentScreenId: string | null = null;
  private currentBookingDate: string | null = null;
  private currentShowtime: string | null = null;

  connect(): any {
    console.log('🔌 Socket Service initialized (polling mode)');
    this.isConnected = true;
    return { id: 'polling-client' };
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    console.log('🔌 Socket Service disconnected');
  }

  joinShow(screenId: string, bookingDate: string, showtime: string): void {
    this.currentScreenId = screenId;
    this.currentBookingDate = bookingDate;
    this.currentShowtime = showtime;
    
    // Reset tracking variables for new show
    this.lastUpdateTime = null;
    this.lastReservedSeats = [];
    
    console.log(`📺 Joined show room (polling): ${screenId}-${bookingDate}-${showtime}`);
    
    // Start polling for updates every 5 seconds
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`https://backend-bnv.onrender.com/api/v1/seat-layout/${screenId}/${bookingDate}/${encodeURIComponent(showtime)}/live`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const currentTime = new Date().toISOString();
            const currentReservedSeats = data.data.reservedSeats || [];
            
            // Check if the reserved seats have actually changed
            const seatsChanged = JSON.stringify(this.lastReservedSeats.sort()) !== JSON.stringify(currentReservedSeats.sort());
            
            // Only trigger update if seats have actually changed
            if (seatsChanged) {
              this.lastUpdateTime = currentTime;
              this.lastReservedSeats = [...currentReservedSeats];
              
              // Simulate WebSocket event
              // The API returns seats as an object and reservedSeats as an array
              const reservedSeatsList = data.data.reservedSeats || [];
              const totalSeats = data.data.totalSeats || 0;
              const availableSeats = data.data.availableSeats || 0;
              
              // Always trigger update if there are any changes (even if no reserved seats)
              // This ensures the UI updates when seats become available or reserved
              const reservedSeats = reservedSeatsList.map((seatNumber: string) => ({
                seatNumber: seatNumber,
                status: 'reserved'
              }));
              
              console.log('📡 Polling detected seat updates:', {
                reservedCount: reservedSeats.length,
                totalSeats,
                availableSeats,
                reservedSeats: reservedSeatsList
              });
              
              // Trigger any registered callbacks
              if (this.seatsUpdateCallback) {
                this.seatsUpdateCallback({
                  screenId,
                  bookingDate,
                  showtime,
                  reservedSeats,
                  totalSeats,
                  availableSeats,
                  timestamp: currentTime
                });
              }
            }
          }
        } else if (response.status === 429) {
          // Rate limited - increase polling interval temporarily
          console.warn('Rate limited, increasing polling interval');
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = setInterval(() => {
              // Recursive call with longer interval
              this.pollInterval = null;
              this.joinShow(screenId, bookingDate, showtime);
            }, 15000); // 15 seconds when rate limited
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // On error, increase polling interval
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = setInterval(() => {
            this.pollInterval = null;
            this.joinShow(screenId, bookingDate, showtime);
          }, 10000); // 10 seconds on error
        }
      }
    }, 8000); // Increased to 8 seconds to reduce load
  }

  private seatsUpdateCallback: ((data: any) => void) | null = null;

  leaveShow(screenId: string, bookingDate: string, showtime: string): void {
    console.log(`📺 Left show room (polling): ${screenId}-${bookingDate}-${showtime}`);
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.currentScreenId = null;
    this.currentBookingDate = null;
    this.currentShowtime = null;
  }

  onSeatsUpdated(callback: (data: any) => void): void {
    this.seatsUpdateCallback = callback;
    console.log('📡 Registered seats update callback');
  }

  offSeatsUpdated(callback: (data: any) => void): void {
    this.seatsUpdateCallback = null;
    console.log('📡 Unregistered seats update callback');
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  getSocketId(): string {
    return 'polling-client';
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
