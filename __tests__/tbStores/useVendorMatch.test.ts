import { renderHook } from '@testing-library/react-native';
import { useVendorMatch, VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

const mockVendors: VendorData[] = [
  {
    id: 'v1',
    accountingId: 'qb-1',
    name: 'Home Depot',
    matchCompareString: 'home*depot',
    inactive: false,
  },
  {
    id: 'v2',
    accountingId: 'qb-2',
    name: 'Lowes Home Improvement',
    matchCompareString: 'lowe*',
    inactive: false,
  },
  {
    id: 'v3',
    accountingId: '',
    name: 'Acme Supply',
    matchCompareString: '',
    inactive: false,
  },
  {
    id: 'v4',
    accountingId: 'qb-4',
    name: 'Ferguson Plumbing',
    inactive: false,
  },
  {
    id: 'v5',
    accountingId: 'qb-5',
    name: 'Inactive Vendor',
    matchCompareString: 'inactive*',
    inactive: true,
  },
  {
    id: 'v6',
    accountingId: '',
    name: 'Local Lumber',
    inactive: false,
  },
];

describe('useVendorMatch', () => {
  describe('findFirstVendorMatch - Pass 1: matchCompareString patterns', () => {
    it('matches * as any number of characters', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      const match = result.current.findFirstVendorMatch('The Home Depot of Dayton');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v1');
    });

    it('performs case-insensitive pattern matching', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      const match = result.current.findFirstVendorMatch("LOWE'S #1234");
      expect(match).toBeDefined();
      expect(match?.id).toBe('v2');
    });

    it('treats ? as a literal character (not wildcard)', () => {
      const vendors: VendorData[] = [
        {
          id: 'literal-question',
          accountingId: '',
          name: 'Literal Question',
          matchCompareString: 'home?depot',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch(vendors));
      const noLiteralQuestionMatch = result.current.findFirstVendorMatch('The Home Depot of Dayton');
      expect(noLiteralQuestionMatch).toBeUndefined();

      const literalQuestionMatch = result.current.findFirstVendorMatch('Store: home?depot #22');
      expect(literalQuestionMatch).toBeDefined();
      expect(literalQuestionMatch?.id).toBe('literal-question');
    });

    it('matches pattern anywhere in the string', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      const match = result.current.findFirstVendorMatch('Receipt from Home Depot Store #456');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v1');
    });
  });

  describe('findFirstVendorMatch - Pass 2: name substring fallback', () => {
    it('falls back to name substring match when no pattern match found', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      const match = result.current.findFirstVendorMatch('Ferguson Plumbing Supply Co.');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v4');
    });

    it('performs case-insensitive name substring match', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      const match = result.current.findFirstVendorMatch('FERGUSON PLUMBING SUPPLY CO.');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v4');
    });

    it('matches when vendor name appears anywhere in the input', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      const match = result.current.findFirstVendorMatch('Order from Local Lumber yard');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v6');
    });
  });

  describe('findFirstVendorMatch - priority', () => {
    it('prefers pattern match (pass 1) over name substring (pass 2)', () => {
      const vendors: VendorData[] = [
        {
          id: 'pattern-vendor',
          accountingId: '',
          name: 'Some Name',
          matchCompareString: 'test*vendor',
          inactive: false,
        },
        {
          id: 'name-vendor',
          accountingId: '',
          name: 'Test Vendor',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch(vendors));
      const match = result.current.findFirstVendorMatch('Test My Vendor');
      expect(match).toBeDefined();
      expect(match?.id).toBe('pattern-vendor');
    });
  });

  describe('findFirstVendorMatch - edge cases', () => {
    it('returns undefined for empty string', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      expect(result.current.findFirstVendorMatch('')).toBeUndefined();
    });

    it('returns undefined when no vendors match', () => {
      const { result } = renderHook(() => useVendorMatch(mockVendors));
      expect(result.current.findFirstVendorMatch('Unknown Vendor XYZ')).toBeUndefined();
    });

    it('returns undefined when vendor list is empty', () => {
      const { result } = renderHook(() => useVendorMatch([]));
      expect(result.current.findFirstVendorMatch('Home Depot')).toBeUndefined();
    });

    it('handles special regex characters in matchCompareString', () => {
      const vendors: VendorData[] = [
        {
          id: 'special',
          accountingId: '',
          name: 'Special',
          matchCompareString: 'price(s)',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch(vendors));
      const match = result.current.findFirstVendorMatch('Best price(s) around');
      expect(match).toBeDefined();
      expect(match?.id).toBe('special');
    });

    it('handles special regex characters in vendor name for pass 2', () => {
      const vendors: VendorData[] = [
        {
          id: 'special-name',
          accountingId: '',
          name: 'Smith & Sons (LLC)',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch(vendors));
      const match = result.current.findFirstVendorMatch('Invoice from Smith & Sons (LLC) Services');
      expect(match).toBeDefined();
      expect(match?.id).toBe('special-name');
    });

    it('treats empty matchCompareString same as unset (falls to pass 2)', () => {
      const vendors: VendorData[] = [
        {
          id: 'empty-pattern',
          accountingId: '',
          name: 'Empty Pattern Co',
          matchCompareString: '',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch(vendors));
      const match = result.current.findFirstVendorMatch('Receipt from Empty Pattern Co store');
      expect(match).toBeDefined();
      expect(match?.id).toBe('empty-pattern');
    });
  });
});
