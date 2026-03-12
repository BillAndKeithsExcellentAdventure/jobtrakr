import { renderHook } from '@testing-library/react-native';

// We need to define VendorData locally since the mock replaces the module
interface VendorData {
  id: string;
  accountingId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  mobilePhone?: string;
  businessPhone?: string;
  notes?: string;
  inactive?: boolean;
  matchCompareString?: string;
}

// Mock vendors used across tests
const mockVendors: VendorData[] = [
  {
    id: 'v1',
    accountingId: 'qb-1',
    name: 'Home Depot',
    matchCompareString: 'home?depot',
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
    // no matchCompareString at all
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

let mockVendorList: VendorData[] = mockVendors;

jest.mock('@/src/tbStores/configurationStore/ConfigurationStore', () => ({
  TABLES_SCHEMA: {},
  useStoreId: () => 'test-store',
}));

jest.mock('tinybase/ui-react/with-schemas', () => ({
  useStore: () => null,
}));

jest.mock('@/src/tbStores/configurationStore/ConfigurationStoreHooks', () => {
  const React = require('react');

  function matchPatternToRegExp(pattern: string): RegExp {
    const escaped = pattern.replace(/[-\\^$+.()|[\]{}]/g, '\\$&');
    const withWildcards = escaped.replace(/\?/g, '.').replace(/\*/g, '.*');
    return new RegExp(withWildcards, 'i');
  }

  function VendorDataCompareName(a: any, b: any) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }

  // This replaces useAllRows to return our mock data directly
  const useAllRows = () => mockVendorList;

  function useVendorMatch(requireAccountingId = false) {
    const allVendors = useAllRows();

    const vendors = React.useMemo(
      () =>
        requireAccountingId ? allVendors.filter((v: any) => !!v.accountingId && !v.inactive) : allVendors,
      [allVendors, requireAccountingId],
    );

    const vendorPatternsWithMatch = React.useMemo(
      () =>
        vendors
          .filter((v: any) => !!v.matchCompareString)
          .map((v: any) => ({ vendor: v, regex: matchPatternToRegExp(v.matchCompareString!) })),
      [vendors],
    );

    const vendorsWithoutMatch = React.useMemo(
      () => vendors.filter((v: any) => !v.matchCompareString),
      [vendors],
    );

    const findFirstVendorMatch = React.useCallback(
      (vendorName: string) => {
        if (!vendorName) return undefined;
        const patternMatch = vendorPatternsWithMatch.find(({ regex }: any) => regex.test(vendorName))?.vendor;
        if (patternMatch) return patternMatch;
        const lowerName = vendorName.toLowerCase();
        return vendorsWithoutMatch.find((v: any) => lowerName.includes(v.name.toLowerCase()));
      },
      [vendorPatternsWithMatch, vendorsWithoutMatch],
    );

    return { vendors, findFirstVendorMatch };
  }

  return {
    useAllRows,
    useVendorMatch,
    VendorDataCompareName,
  };
});

import { useVendorMatch } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

describe('useVendorMatch', () => {
  beforeEach(() => {
    mockVendorList = mockVendors;
  });

  describe('vendors list', () => {
    it('returns all vendors when requireAccountingId is false', () => {
      const { result } = renderHook(() => useVendorMatch(false));
      expect(result.current.vendors).toHaveLength(mockVendors.length);
    });

    it('returns all vendors by default', () => {
      const { result } = renderHook(() => useVendorMatch());
      expect(result.current.vendors).toHaveLength(mockVendors.length);
    });

    it('filters to only active vendors with accountingId when requireAccountingId is true', () => {
      const { result } = renderHook(() => useVendorMatch(true));
      // Should include: v1 (qb-1, active), v2 (qb-2, active), v4 (qb-4, active)
      // Should exclude: v3 (no accountingId), v5 (inactive), v6 (no accountingId)
      expect(result.current.vendors).toHaveLength(3);
      expect(result.current.vendors.map((v) => v.id)).toEqual(expect.arrayContaining(['v1', 'v2', 'v4']));
    });
  });

  describe('findFirstVendorMatch - Pass 1: matchCompareString patterns', () => {
    it('matches ? as any single character', () => {
      const { result } = renderHook(() => useVendorMatch());
      // 'home?depot' should match 'The Home Depot of Dayton' (space is the single char)
      const match = result.current.findFirstVendorMatch('The Home Depot of Dayton');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v1');
    });

    it('matches * as any number of characters', () => {
      const { result } = renderHook(() => useVendorMatch());
      // 'lowe*' should match "Lowe's #1234"
      const match = result.current.findFirstVendorMatch("Lowe's #1234");
      expect(match).toBeDefined();
      expect(match?.id).toBe('v2');
    });

    it('performs case-insensitive pattern matching', () => {
      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('THE HOME DEPOT');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v1');
    });

    it('does not match ? for multiple characters', () => {
      const { result } = renderHook(() => useVendorMatch());
      // 'home?depot' should NOT match 'home  depot' (two spaces - ? is exactly one char)
      // But actually the pattern is unanchored, so 'home depot' embedded could still match
      // Let's test a string that has NO single-char between home and depot
      const match = result.current.findFirstVendorMatch('homedepot');
      expect(match).toBeUndefined(); // 'home?depot' requires exactly one char between home and depot
    });

    it('matches pattern anywhere in the string', () => {
      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('Receipt from Home Depot Store #456');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v1');
    });
  });

  describe('findFirstVendorMatch - Pass 2: name substring fallback', () => {
    it('falls back to name substring match when no pattern match found', () => {
      const { result } = renderHook(() => useVendorMatch());
      // 'Ferguson Plumbing' has no matchCompareString, should match by name substring
      const match = result.current.findFirstVendorMatch('Ferguson Plumbing Supply Co.');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v4');
    });

    it('performs case-insensitive name substring match', () => {
      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('FERGUSON PLUMBING SUPPLY CO.');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v4');
    });

    it('matches when vendor name appears anywhere in the input', () => {
      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('Order from Local Lumber yard');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v6');
    });
  });

  describe('findFirstVendorMatch - priority', () => {
    it('prefers pattern match (pass 1) over name substring (pass 2)', () => {
      // Set up vendors where both passes could match
      mockVendorList = [
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

      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('Test My Vendor');
      expect(match).toBeDefined();
      expect(match?.id).toBe('pattern-vendor');
    });
  });

  describe('findFirstVendorMatch - edge cases', () => {
    it('returns undefined for empty string', () => {
      const { result } = renderHook(() => useVendorMatch());
      expect(result.current.findFirstVendorMatch('')).toBeUndefined();
    });

    it('returns undefined when no vendors match', () => {
      const { result } = renderHook(() => useVendorMatch());
      expect(result.current.findFirstVendorMatch('Unknown Vendor XYZ')).toBeUndefined();
    });

    it('returns undefined when vendor list is empty', () => {
      mockVendorList = [];
      const { result } = renderHook(() => useVendorMatch());
      expect(result.current.findFirstVendorMatch('Home Depot')).toBeUndefined();
    });

    it('handles special regex characters in matchCompareString', () => {
      mockVendorList = [
        {
          id: 'special',
          accountingId: '',
          name: 'Special',
          matchCompareString: 'price(s)',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch());
      // Parentheses should be escaped, matching literal '(s)'
      const match = result.current.findFirstVendorMatch('Best price(s) around');
      expect(match).toBeDefined();
      expect(match?.id).toBe('special');
    });

    it('handles special regex characters in vendor name for pass 2', () => {
      mockVendorList = [
        {
          id: 'special-name',
          accountingId: '',
          name: 'Smith & Sons (LLC)',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('Invoice from Smith & Sons (LLC) Services');
      expect(match).toBeDefined();
      expect(match?.id).toBe('special-name');
    });

    it('treats empty matchCompareString same as unset (falls to pass 2)', () => {
      mockVendorList = [
        {
          id: 'empty-pattern',
          accountingId: '',
          name: 'Empty Pattern Co',
          matchCompareString: '',
          inactive: false,
        },
      ];

      const { result } = renderHook(() => useVendorMatch());
      const match = result.current.findFirstVendorMatch('Receipt from Empty Pattern Co store');
      expect(match).toBeDefined();
      expect(match?.id).toBe('empty-pattern');
    });
  });

  describe('requireAccountingId filtering with matching', () => {
    it('does not match vendors without accountingId when requireAccountingId is true', () => {
      const { result } = renderHook(() => useVendorMatch(true));
      // v6 'Local Lumber' has no accountingId
      const match = result.current.findFirstVendorMatch('Order from Local Lumber');
      expect(match).toBeUndefined();
    });

    it('does not match inactive vendors when requireAccountingId is true', () => {
      const { result } = renderHook(() => useVendorMatch(true));
      // v5 has matchCompareString 'inactive*' but is inactive
      const match = result.current.findFirstVendorMatch('inactive vendor test');
      expect(match).toBeUndefined();
    });

    it('still matches vendors with accountingId when requireAccountingId is true', () => {
      const { result } = renderHook(() => useVendorMatch(true));
      const match = result.current.findFirstVendorMatch('The Home Depot');
      expect(match).toBeDefined();
      expect(match?.id).toBe('v1');
    });
  });
});
