import { Platform, TextStyle, ViewStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  default:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
});

export const colors = {
  text: {
    primary: 'rgba(0, 0, 0, 0.95)',
    secondary: '#615d59',
    muted: '#a39e98',
    subtle: '#414753',
    inverse: '#ffffff',
  },
  background: {
    page: '#ffffff',
    alt: '#f6f5f4',
    soft: 'rgba(0, 0, 0, 0.05)',
    badge: '#f2f9ff',
    surface: '#ffffff',
    surfaceAlt: '#faf9f8',
  },
  border: {
    whisper: 'rgba(0, 0, 0, 0.1)',
    subtle: 'rgba(0, 0, 0, 0.06)',
    input: '#e3e2e1',
  },
  brand: {
    primary: '#0075de',
    primaryActive: '#005bab',
    focus: '#097fe8',
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 64,
  page: 24,
} as const;

export const radius = {
  micro: 4,
  subtle: 5,
  standard: 8,
  card: 12,
  featured: 16,
  pill: 9999,
} as const;

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  } satisfies ViewStyle,
} as const;

export const typography = {
  display: {
    fontFamily,
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 64,
    letterSpacing: -2.125,
  } satisfies TextStyle,
  screenTitle: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -1.5,
  } satisfies TextStyle,
  authHeadline: {
    fontFamily,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.625,
  } satisfies TextStyle,
  brandCompact: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } satisfies TextStyle,
  button: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } satisfies TextStyle,
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.9,
  } satisfies TextStyle,
  micro: {
    fontFamily,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 12,
    letterSpacing: 0.8,
  } satisfies TextStyle,
} as const;

export const layout = {
  maxWidth: 1200,
  splashNarrowWidth: 360,
  authNarrowWidth: 400,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  layout,
} as const;
