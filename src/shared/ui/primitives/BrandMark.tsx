import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type BrandMarkProps = {
  title?: string;
  subtitle?: string;
  iconSize?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;
  variant?: 'splash' | 'compact';
};

export function BrandMark({
  title = 'KRONA',
  subtitle = 'Kalkulator B2B',
  iconSize = 76,
  showTitle = true,
  showSubtitle = true,
  variant = 'splash',
}: BrandMarkProps) {
  return (
    <View style={styles.container}>
      <Image
        resizeMode="contain"
        source={require('../../../../assets/images/logo.png')}
        style={[styles.logo, { width: iconSize, height: iconSize }]}
      />

      {showTitle ? (
        <Text style={variant === 'compact' ? styles.titleCompact : styles.title}>{title}</Text>
      ) : null}
      {showSubtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  logo: {
    borderRadius: radius.card,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleCompact: {
    ...typography.brandCompact,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
