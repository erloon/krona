export const colors = {
  primary: '#0A0A0A',
  secondary: '#F5F5F5',
  accent: '#2563EB',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#22C55E',
} as const;

export type Colors = typeof colors;
