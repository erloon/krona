import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, layout, spacing, typography } from '@/shared/theme';
import { BrandMark } from '@/shared/ui/primitives/BrandMark';

type AuthCardProps = {
  action: React.ReactNode;
  statusMessage?: string | null;
};

export function AuthCard({ action, statusMessage }: AuthCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <BrandMark
          iconSize={48}
          showSubtitle={false}
          title="KRONA"
          variant="compact"
        />
      </View>

      <View style={styles.headingSection}>
        <Text style={styles.heading}>Witaj ponownie</Text>
        <Text style={styles.description}>
          Zaloguj się, aby zarządzać swoimi finansami B2B
        </Text>
      </View>

      <View style={styles.actions}>{action}</View>
      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: layout.authNarrowWidth,
    alignItems: 'center',
  },
  brandSection: {
    marginBottom: spacing.xxxl,
  },
  headingSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  heading: {
    ...typography.authHeadline,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.bodySmall,
    maxWidth: 320,
    color: colors.text.subtle,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
  statusMessage: {
    ...typography.caption,
    width: '100%',
    marginTop: spacing.lg,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
