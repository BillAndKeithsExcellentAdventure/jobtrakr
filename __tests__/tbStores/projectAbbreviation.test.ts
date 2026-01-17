/**
 * Tests for project abbreviation generation and accountingId functionality
 */
import { generateAbbreviation } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { generateAccountingId } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

describe('Project Abbreviation', () => {
  describe('generateAbbreviation', () => {
    it('should convert lowercase to uppercase', () => {
      const result = generateAbbreviation('my project');
      expect(result).toBe('MY_PROJECT');
    });

    it('should replace spaces with underscores', () => {
      const result = generateAbbreviation('Main Street Renovation');
      expect(result).toBe('MAIN_STREET_RENOVATION');
    });

    it('should replace special characters with underscores', () => {
      const result = generateAbbreviation('Project-123 & More!');
      expect(result).toBe('PROJECT_______MORE_');
    });

    it('should replace numbers and symbols with underscores', () => {
      const result = generateAbbreviation('House#42');
      expect(result).toBe('HOUSE___');
    });

    it('should handle already uppercase names', () => {
      const result = generateAbbreviation('ABC');
      expect(result).toBe('ABC');
    });

    it('should handle mixed case with numbers', () => {
      const result = generateAbbreviation('Building2024');
      expect(result).toBe('BUILDING____');
    });
  });
});

describe('Accounting ID Generation', () => {
  describe('generateAccountingId', () => {
    it('should generate receipt ID with correct format', () => {
      const result = generateAccountingId('receipt', 'MAIN_ST', 1);
      expect(result).toBe('receipt-MAIN_ST-1');
    });

    it('should generate invoice ID with correct format', () => {
      const result = generateAccountingId('invoice', 'PROJECT_A', 5);
      expect(result).toBe('invoice-PROJECT_A-5');
    });

    it('should handle multi-digit counts', () => {
      const result = generateAccountingId('receipt', 'TEST', 123);
      expect(result).toBe('receipt-TEST-123');
    });

    it('should handle abbreviations with underscores', () => {
      const result = generateAccountingId('invoice', 'MY_PROJECT_2024', 42);
      expect(result).toBe('invoice-MY_PROJECT_2024-42');
    });
  });
});
