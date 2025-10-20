/**
 * Date utility functions for movie booking system
 */

export interface DateOption {
  value: string; // YYYY-MM-DD format
  label: string; // "MON 20 OCT" format
  isSelected: boolean;
  isToday: boolean;
}

/**
 * Generates date options from actual show dates
 * @param showDates - Array of dates that have shows (YYYY-MM-DD format)
 * @param selectedDate - Currently selected date in YYYY-MM-DD format
 * @returns Array of date options
 */
export function generateDateOptionsFromShows(showDates: string[], selectedDate: string): DateOption[] {
  const todayStr = getCurrentDate();
  
  // Sort dates and filter out past dates
  const validDates = showDates
    .filter(date => date >= todayStr)
    .sort();
  
  return validDates.map(dateStr => {
    const dayName = formatDateForDisplay(dateStr).split(' ')[0]; // Extract day name
    const dayNumber = parseInt(dateStr.split('-')[2]);
    const monthName = formatDateForDisplay(dateStr).split(' ')[2]; // Extract month name
    
    return {
      value: dateStr,
      label: `${dayName} ${dayNumber} ${monthName}`,
      isSelected: dateStr === selectedDate,
      isToday: dateStr === todayStr
    };
  });
}

/**
 * Gets the next available date (today or future)
 * @returns Date string in YYYY-MM-DD format
 */
export function getNextAvailableDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Formats a date string for display
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Formatted date string like "MON 20 OCT"
 */
export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  
  return `${dayName} ${dayNumber} ${monthName}`;
}

/**
 * Checks if a date is in the past
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns boolean
 */
export function isPastDate(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

/**
 * Gets the current date in YYYY-MM-DD format
 * @returns Date string
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}
