/**
 * Tests for showtime validation utilities
 */

import { validateShowtime, filterValidShowGroups, getShowtimeStatus } from '../showtimeValidation';

describe('showtimeValidation', () => {
  const mockDate = new Date('2024-01-15T10:00:00Z'); // Mock current time
  
  beforeEach(() => {
    // Mock Date.now to return a fixed time
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateShowtime', () => {
    it('should validate future showtimes as valid', () => {
      const result = validateShowtime('2024-01-16', '2:30 PM');
      expect(result.isValid).toBe(true);
      expect(result.isPast).toBe(false);
    });

    it('should invalidate past showtimes', () => {
      const result = validateShowtime('2024-01-14', '2:30 PM');
      expect(result.isValid).toBe(false);
      expect(result.isPast).toBe(true);
      expect(result.reason).toBe('Show date has passed');
    });

    it('should invalidate showtimes that are too close to current time', () => {
      const result = validateShowtime('2024-01-15', '10:45 AM'); // 45 minutes from mock time
      expect(result.isValid).toBe(false);
      expect(result.isPast).toBe(false);
      expect(result.reason).toBe('Booking closes 30 minutes before showtime');
    });

    it('should validate showtimes that are far enough in the future', () => {
      const result = validateShowtime('2024-01-15', '12:00 PM'); // 2 hours from mock time
      expect(result.isValid).toBe(true);
      expect(result.isPast).toBe(false);
    });
  });

  describe('getShowtimeStatus', () => {
    it('should return available status for valid showtimes', () => {
      const status = getShowtimeStatus('2024-01-16', '2:30 PM');
      expect(status.status).toBe('available');
      expect(status.disabled).toBe(false);
      expect(status.className).toContain('bg-brand-red');
    });

    it('should return past status for past showtimes', () => {
      const status = getShowtimeStatus('2024-01-14', '2:30 PM');
      expect(status.status).toBe('past');
      expect(status.disabled).toBe(true);
      expect(status.className).toContain('bg-gray-500');
    });

    it('should return unavailable status for showtimes too close to current time', () => {
      const status = getShowtimeStatus('2024-01-15', '10:45 AM');
      expect(status.status).toBe('unavailable');
      expect(status.disabled).toBe(true);
      expect(status.className).toContain('bg-yellow-600');
    });
  });

  describe('filterValidShowGroups', () => {
    it('should filter out past showtimes from show groups', () => {
      const showGroups = [
        {
          bookingDate: '2024-01-14',
          showtimes: ['2:30 PM', '6:00 PM'],
          theatre: 'Test Theatre'
        },
        {
          bookingDate: '2024-01-16',
          showtimes: ['2:30 PM', '6:00 PM'],
          theatre: 'Test Theatre'
        }
      ];

      const filtered = filterValidShowGroups(showGroups);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].bookingDate).toBe('2024-01-16');
    });

    it('should filter out invalid showtimes within valid dates', () => {
      const showGroups = [
        {
          bookingDate: '2024-01-15',
          showtimes: ['9:30 AM', '12:00 PM', '6:00 PM'], // 9:30 AM is too close to mock time
          theatre: 'Test Theatre'
        }
      ];

      const filtered = filterValidShowGroups(showGroups);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].showtimes).toEqual(['12:00 PM', '6:00 PM']);
    });
  });
});
