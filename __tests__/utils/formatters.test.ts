/**
 * Tests for formatter utility functions
 */
import { formatDate, formatCurrency, formatNumber, replaceNonPrintable } from '@/src/utils/formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format a Date object correctly', () => {
      const date = new Date('2024-03-15T10:30:00');
      const result = formatDate(date);
      expect(result).toBe('03/15/24');
    });

    it('should format a date string correctly', () => {
      const dateString = '2024-03-15T10:30:00';
      const result = formatDate(dateString);
      expect(result).toBe('03/15/24');
    });

    it('should format a timestamp correctly', () => {
      const timestamp = new Date('2024-03-15T10:30:00').getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('03/15/24');
    });

    it('should return default string for undefined', () => {
      const result = formatDate(undefined);
      expect(result).toBe('Not Specified');
    });

    it('should return custom default string', () => {
      const result = formatDate(undefined, 'N/A');
      expect(result).toBe('N/A');
    });

    it('should include time when requested', () => {
      const date = new Date('2024-03-15T10:30:00');
      const result = formatDate(date, 'Not Specified', true);
      expect(result).toContain('03/15/24');
      expect(result).toContain(':');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-01-05T10:30:00');
      const result = formatDate(date);
      expect(result).toBe('01/05/24');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency without dollar sign', () => {
      const result = formatCurrency(1000);
      expect(result).toBe('1,000');
    });

    it('should format currency with dollar sign', () => {
      const result = formatCurrency(1000, true);
      expect(result).toBe('$1,000');
    });

    it('should round to nearest whole number by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('1,235');
    });

    it('should include cents when requested', () => {
      const result = formatCurrency(1234.56, false, true);
      expect(result).toBe('1,234.56');
    });

    it('should include cents with dollar sign', () => {
      const result = formatCurrency(1234.56, true, true);
      expect(result).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('0');
    });

    it('should return empty string for undefined', () => {
      const result = formatCurrency(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for null', () => {
      const result = formatCurrency(null as any);
      expect(result).toBe('');
    });

    it('should format large numbers with commas', () => {
      const result = formatCurrency(1234567.89, true, true);
      expect(result).toBe('$1,234,567.89');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1234.56, true, true);
      expect(result).toBe('$-1,234.56');
    });
  });

  describe('formatNumber', () => {
    it('should format with default 2 decimal places', () => {
      const result = formatNumber(123.456);
      expect(result).toBe('123.46');
    });

    it('should format with custom decimal places', () => {
      const result = formatNumber(123.456, 3);
      expect(result).toBe('123.456');
    });

    it('should format with 0 decimal places', () => {
      const result = formatNumber(123.456, 0);
      expect(result).toBe('123');
    });

    it('should return 0.00 for undefined', () => {
      const result = formatNumber(undefined);
      expect(result).toBe('0.00');
    });

    it('should return 0.00 for null', () => {
      const result = formatNumber(null as any);
      expect(result).toBe('0.00');
    });

    it('should handle zero', () => {
      const result = formatNumber(0);
      expect(result).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      const result = formatNumber(-123.456, 2);
      expect(result).toBe('-123.46');
    });
  });

  describe('replaceNonPrintable', () => {
    it('should replace non-printable characters with spaces', () => {
      const input = 'Hello\x00World\x01Test';
      const result = replaceNonPrintable(input);
      expect(result).toBe('Hello World Test');
    });

    it('should keep printable characters unchanged', () => {
      const input = 'Hello World! 123';
      const result = replaceNonPrintable(input);
      expect(result).toBe('Hello World! 123');
    });

    it('should handle empty string', () => {
      const result = replaceNonPrintable('');
      expect(result).toBe('');
    });

    it('should keep special printable characters', () => {
      const input = 'Test@#$%^&*()';
      const result = replaceNonPrintable(input);
      expect(result).toBe('Test@#$%^&*()');
    });

    it('should replace tab and newline characters', () => {
      const input = 'Hello\tWorld\nTest';
      const result = replaceNonPrintable(input);
      expect(result).toBe('Hello World Test');
    });
  });
});
