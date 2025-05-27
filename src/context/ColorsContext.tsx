import { Colors } from '@/src/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { createContext, useContext, useMemo } from 'react';

export type ColorSchemeColors = {
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  secondary100: string;
  secondary200: string;
  secondary300: string;
  secondary400: string;
  secondary500: string;
  accent100: string;
  accent200: string;
  accent300: string;
  accent400: string;
  accent500: string;
  angry100: string;
  angry500: string;
  overlay20: string;
  overlay50: string;
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  headerBackgroundColor: string;
  listBackground: string;
  itemBackground: string;
  iconColor: string;
  pressedIconColor: string;
  shadowColor: string;
  separatorColor: string;
  inputBorder: string;
  boxShadow: string;
  placeHolder: string;
  modalOverlayBackgroundColor: string;
  opaqueModalOverlayBackgroundColor: string;
  error: string;
  errorBackground: string;
  textDim: string;
  transparent: string;
  bottomSheetBackground: string;
  actionBg: string;
  actionFg: string;
  buttonBlue: string;
  sectionHeaderBG: string;
  sectionFG: string;
};

const ColorsContext = createContext<ColorSchemeColors | null>(null);

export function ColorsProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  const colors = useMemo(() => (colorScheme === 'dark' ? Colors.dark : Colors.light), [colorScheme]);

  return <ColorsContext.Provider value={colors}>{children}</ColorsContext.Provider>;
}

export function useColors() {
  const context = useContext(ColorsContext);
  if (!context) {
    throw new Error('useColors must be used within a ColorsProvider');
  }
  return context;
}
