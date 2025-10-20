/**
 * Showtime Validation Utilities
 * Provides functions to validate and filter showtimes based on current time
 */

export interface ShowtimeValidationResult {
  isValid: boolean;
  isPast: boolean;
  timeUntilShow: number; // in minutes
  reason?: string;
}

export interface ShowGroup {
  bookingDate: string;
  showtimes: string[];
  theatre?: string;
  theatreId?: string;
  availableSeats?: number;
  runningDates?: string[]; // Array of all running dates for this show
}

export interface Screen {
  screenId: string;
  screenName?: string;
  screenType?: string;
  showGroups: ShowGroup[];
}

/**
 * Validates if a showtime is still available for booking
 * @param bookingDate - Date in YYYY-MM-DD format
 * @param showtime - Time in HH:MM AM/PM format
 * @param bufferMinutes - Buffer time before showtime when booking should be disabled (default: 30 minutes)
 * @returns ShowtimeValidationResult
 */
export function validateShowtime(
  bookingDate: string, 
  showtime: string, 
  bufferMinutes: number = 30
): ShowtimeValidationResult {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if booking date is in the past
    if (bookingDate < today) {
      return {
        isValid: false,
        isPast: true,
        timeUntilShow: 0,
        reason: 'Show date has passed'
      };
    }
    
    // For today's shows, check if showtime has passed
    if (bookingDate === today) {
      const showDateTime = parseShowtime(bookingDate, showtime);
      if (!showDateTime) {
        return {
          isValid: false,
          isPast: true,
          timeUntilShow: 0,
          reason: 'Invalid showtime format'
        };
      }
      
      const timeUntilShow = Math.floor((showDateTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (timeUntilShow <= 0) {
        return {
          isValid: false,
          isPast: true,
          timeUntilShow: 0,
          reason: 'Showtime has already started'
        };
      }
      
      if (timeUntilShow <= bufferMinutes) {
        return {
          isValid: false,
          isPast: false,
          timeUntilShow,
          reason: `Booking closes ${bufferMinutes} minutes before showtime`
        };
      }
      
      return {
        isValid: true,
        isPast: false,
        timeUntilShow,
        reason: undefined
      };
    }
    
    // For future dates, showtime is valid
    return {
      isValid: true,
      isPast: false,
      timeUntilShow: 0,
      reason: undefined
    };
    
  } catch (error) {
    console.error('Error validating showtime:', error);
    return {
      isValid: false,
      isPast: true,
      timeUntilShow: 0,
      reason: 'Error validating showtime'
    };
  }
}

/**
 * Parses a showtime string and booking date into a Date object
 * @param bookingDate - Date in YYYY-MM-DD format
 * @param showtime - Time in HH:MM AM/PM format
 * @returns Date object or null if parsing fails
 */
function parseShowtime(bookingDate: string, showtime: string): Date | null {
  try {
    // Parse the time string (e.g., "2:30 PM", "10:00 AM")
    const timeMatch = showtime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
      return null;
    }
    
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Create date object
    const [year, month, day] = bookingDate.split('-').map(Number);
    const showDateTime = new Date(year, month - 1, day, hours, minutes);
    
    return showDateTime;
  } catch (error) {
    console.error('Error parsing showtime:', error);
    return null;
  }
}

/**
 * Filters show groups to remove past dates and invalid showtimes
 * @param showGroups - Array of show groups
 * @param bufferMinutes - Buffer time before showtime when booking should be disabled
 * @returns Filtered show groups
 */
export function filterValidShowGroups(
  showGroups: ShowGroup[], 
  bufferMinutes: number = 30
): ShowGroup[] {
  const today = new Date().toISOString().split('T')[0];
  
  return showGroups
    .filter(group => group.bookingDate >= today)
    .map(group => ({
      ...group,
      showtimes: group.showtimes.filter(showtime => {
        const validation = validateShowtime(group.bookingDate, showtime, bufferMinutes);
        return validation.isValid;
      })
    }))
    .filter(group => group.showtimes.length > 0);
}

/**
 * Checks if any date in runningDates array is still valid (not past)
 * @param runningDates - Array of dates in YYYY-MM-DD format
 * @returns boolean indicating if any running date is still valid
 */
export function hasValidRunningDates(runningDates: string[]): boolean {
  if (!Array.isArray(runningDates) || runningDates.length === 0) {
    return false;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if any running date is today or in the future
  return runningDates.some(date => date >= today);
}

/**
 * Filters screens to remove past showtimes
 * @param screens - Array of screens
 * @param bufferMinutes - Buffer time before showtime when booking should be disabled
 * @returns Filtered screens
 */
export function filterValidScreens(
  screens: Screen[], 
  bufferMinutes: number = 30
): Screen[] {
  return screens.map(screen => ({
    ...screen,
    showGroups: filterValidShowGroups(screen.showGroups, bufferMinutes)
  })).filter(screen => screen.showGroups.length > 0);
}

/**
 * Filters screens to remove past showtimes, considering runningDates
 * @param screens - Array of screens
 * @param bufferMinutes - Buffer time before showtime when booking should be disabled
 * @returns Filtered screens
 */
export function filterValidScreensWithRunningDates(
  screens: Screen[], 
  bufferMinutes: number = 30
): Screen[] {
  return screens.map(screen => ({
    ...screen,
    showGroups: filterValidShowGroups(screen.showGroups, bufferMinutes)
  })).filter(screen => {
    // Keep screen if it has valid show groups OR if any show group has valid running dates
    const hasValidShowGroups = screen.showGroups.length > 0;
    const hasValidRunningDates = screen.showGroups.some(group => 
      group.runningDates && hasValidRunningDates(group.runningDates)
    );
    return hasValidShowGroups || hasValidRunningDates;
  });
}

/**
 * Gets validation status for a specific showtime
 * @param bookingDate - Date in YYYY-MM-DD format
 * @param showtime - Time in HH:MM AM/PM format
 * @param bufferMinutes - Buffer time before showtime when booking should be disabled
 * @returns Object with validation status and styling information
 */
export function getShowtimeStatus(
  bookingDate: string, 
  showtime: string, 
  bufferMinutes: number = 30
) {
  const validation = validateShowtime(bookingDate, showtime, bufferMinutes);
  
  if (validation.isValid) {
    return {
      status: 'available',
      className: 'px-3 py-1 rounded-full text-xs font-semibold bg-brand-red text-white hover:bg-red-600 transition-colors cursor-pointer',
      disabled: false,
      tooltip: undefined
    };
  }
  
  if (validation.isPast) {
    return {
      status: 'past',
      className: 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-500 text-gray-300 cursor-not-allowed opacity-50',
      disabled: true,
      tooltip: validation.reason
    };
  }
  
  return {
    status: 'unavailable',
    className: 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-600 text-yellow-100 cursor-not-allowed opacity-75',
    disabled: true,
    tooltip: validation.reason
  };
}

/**
 * Formats time until show for display
 * @param timeUntilShow - Time in minutes
 * @returns Formatted string
 */
export function formatTimeUntilShow(timeUntilShow: number): string {
  if (timeUntilShow <= 0) return 'Show started';
  
  const hours = Math.floor(timeUntilShow / 60);
  const minutes = timeUntilShow % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m until show`;
  }
  
  return `${minutes}m until show`;
}

/**
 * Checks if a showtime is within the booking window
 * @param bookingDate - Date in YYYY-MM-DD format
 * @param showtime - Time in HH:MM AM/PM format
 * @param maxAdvanceDays - Maximum days in advance for booking (default: 7)
 * @param bufferMinutes - Buffer time before showtime when booking should be disabled
 * @returns boolean
 */
export function isWithinBookingWindow(
  bookingDate: string,
  showtime: string,
  maxAdvanceDays: number = 7,
  bufferMinutes: number = 30
): boolean {
  const validation = validateShowtime(bookingDate, showtime, bufferMinutes);
  if (!validation.isValid) return false;
  
  const now = new Date();
  const maxDate = new Date(now.getTime() + (maxAdvanceDays * 24 * 60 * 60 * 1000));
  const showDate = new Date(bookingDate);
  
  return showDate <= maxDate;
}
