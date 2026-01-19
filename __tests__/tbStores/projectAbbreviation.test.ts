/**
 * Tests for project abbreviation generation
 */
import { generateAbbreviation } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';

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
