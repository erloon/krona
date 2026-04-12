import { Platform, TextStyle, ViewStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  default:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
});

/**
 * Creates a cross-platform shadow that uses boxShadow on web
 * and native shadow props on iOS/Android.
 */
function createShadow(
  config: { offsetY: number; blur: number; opacity: number },
  elevation: number
): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${config.offsetY}px ${config.blur}px rgba(0, 0, 0, ${config.opacity})`,
    } as ViewStyle;
  }
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: config.offsetY },
    shadowOpacity: config.opacity,
    shadowRadius: config.blur,
    elevation,
  } as ViewStyle;
}

export const colors = {
  brand: {
    primary: '#005db2',
    primaryActive: '#00468a',
    destructive: '#ba1a1a',
    destructiveActive: '#93000a',
  },
  text: {
    primary: '#1a1c1c',
    secondary: '#414753',
    subtle: '#605e5c',
    muted: '#717784',
    inverse: '#ffffff',
  },
  background: {
    page: '#faf9f8',
    surface: '#ffffff',
    alt: '#f4f3f2',
    badge: '#d5e3ff',
    glass: 'rgba(255, 255, 255, 0.8)',
    surfaceContainer: '#efeeed',
    surfaceContainerLow: '#f4f3f2',
    surfaceContainerHigh: '#e9e8e7',
    surfaceContainerLowest: '#ffffff',
  },
  border: {
    input: 'rgba(26, 28, 28, 0.10)',
    subtle: 'rgba(26, 28, 28, 0.08)',
    whisper: 'rgba(26, 28, 28, 0.12)',
  },
  feedback: {
    warning: '#8a6200',
    warningBackground: '#fff4e0',
    error: '#b3261e',
    errorBackground: '#fce8e6',
    success: '#146e2a',
    successBackground: '#e6f4ea',
  },
} as const;

export const shadows = {
  soft: createShadow({ offsetY: 4, blur: 12, opacity: 0.04 }, 3),
  card: createShadow({ offsetY: 2, blur: 6, opacity: 0.03 }, 1),
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
  paper: 6,
  standard: 8,
  card: 12,
  featured: 16,
  pill: 9999,
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
  heroTitle: {
    fontFamily,
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1.6,
  } satisfies TextStyle,
  metricValue: {
    fontFamily,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -1.2,
  } satisfies TextStyle,
  metricValueCompact: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.6,
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
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.9,
  } satisfies TextStyle,
  sectionLabel: {
    fontFamily,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  contentMaxWidth: 720,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  layout,
} as const;
