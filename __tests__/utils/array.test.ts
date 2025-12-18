/**
 * Tests for array utility functions
 */
import { createItemsArray } from '@/src/utils/array';

describe('array utilities', () => {
  describe('createItemsArray', () => {
    describe('include action', () => {
      it('should include items from modifyItems that are not in activeItems', () => {
        const activeItems = [1, 2, 3];
        const modifyItems = [3, 4, 5];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should not duplicate items already in activeItems', () => {
        const activeItems = [1, 2, 3];
        const modifyItems = [1, 2, 3];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle empty activeItems array', () => {
        const activeItems: number[] = [];
        const modifyItems = [1, 2, 3];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle empty modifyItems array', () => {
        const activeItems = [1, 2, 3];
        const modifyItems: number[] = [];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle both arrays empty', () => {
        const activeItems: number[] = [];
        const modifyItems: number[] = [];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual([]);
      });

      it('should work with string arrays', () => {
        const activeItems = ['a', 'b', 'c'];
        const modifyItems = ['c', 'd', 'e'];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual(['a', 'b', 'c', 'd', 'e']);
      });

      it('should work with object arrays', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        const obj3 = { id: 3 };
        const obj4 = { id: 4 };

        const activeItems = [obj1, obj2];
        const modifyItems = [obj3, obj4];
        const result = createItemsArray(activeItems, modifyItems, 'include');
        expect(result).toEqual([obj1, obj2, obj3, obj4]);
      });
    });

    describe('exclude action', () => {
      it('should exclude items from activeItems that are in modifyItems', () => {
        const activeItems = [1, 2, 3, 4, 5];
        const modifyItems = [2, 4];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual([1, 3, 5]);
      });

      it('should keep all items if modifyItems is empty', () => {
        const activeItems = [1, 2, 3];
        const modifyItems: number[] = [];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual([1, 2, 3]);
      });

      it('should return empty array if all items are excluded', () => {
        const activeItems = [1, 2, 3];
        const modifyItems = [1, 2, 3];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual([]);
      });

      it('should handle empty activeItems array', () => {
        const activeItems: number[] = [];
        const modifyItems = [1, 2, 3];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual([]);
      });

      it('should keep items not in modifyItems', () => {
        const activeItems = [1, 2, 3, 4, 5];
        const modifyItems = [6, 7, 8];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should work with string arrays', () => {
        const activeItems = ['a', 'b', 'c', 'd'];
        const modifyItems = ['b', 'd'];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual(['a', 'c']);
      });

      it('should work with object arrays (reference equality)', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        const obj3 = { id: 3 };

        const activeItems = [obj1, obj2, obj3];
        const modifyItems = [obj2];
        const result = createItemsArray(activeItems, modifyItems, 'exclude');
        expect(result).toEqual([obj1, obj3]);
      });
    });

    describe('error handling', () => {
      it('should throw error for invalid action', () => {
        const activeItems = [1, 2, 3];
        const modifyItems = [4, 5];
        expect(() => {
          createItemsArray(activeItems, modifyItems, 'invalid' as any);
        }).toThrow('Invalid action type');
      });
    });
  });
});
