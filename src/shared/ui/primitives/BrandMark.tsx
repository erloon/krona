import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';

type BrandMarkProps = {
  title?: string;
  subtitle?: string;
  iconSize?: number;
  showSubtitle?: boolean;
  variant?: 'splash' | 'compact';
};

export function BrandMark({
  title = 'KRONA',
  subtitle = 'Kalkulator B2B',
  iconSize = 76,
  showSubtitle = true,
  variant = 'splash',
}: BrandMarkProps) {
  const tileSize = iconSize;
  const walletWidth = iconSize * 0.46;
  const walletHeight = iconSize * 0.38;

  return (
    <View style={styles.container}>
      <View style={[styles.iconTile, { width: tileSize, height: tileSize }]}>
        <View style={[styles.walletBody, { width: walletWidth, height: walletHeight }]}>
          <View style={styles.walletFlap} />
          <View style={styles.walletButton} />
        </View>
      </View>

      <Text style={variant === 'compact' ? styles.titleCompact : styles.title}>{title}</Text>
      {showSubtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.brand.primary,
    ...shallowShadow(),
  },
  walletBody: {
    borderWidth: 3,
    borderColor: colors.text.inverse,
    borderRadius: radius.standard,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  walletFlap: {
    position: 'absolute',
    top: '28%',
    right: '20%',
    width: '46%',
    height: '38%',
    borderWidth: 3,
    borderColor: colors.text.inverse,
    borderRadius: radius.micro,
    backgroundColor: colors.brand.primary,
  },
  walletButton: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.text.inverse,
    alignSelf: 'flex-end',
    marginRight: spacing.xs,
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

function shallowShadow() {
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  } as const;
}
