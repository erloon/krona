import Constants from 'expo-constants';
import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/shared/ui/primitives/BrandMark';
import { LoadingIndicator } from '@/shared/ui/primitives/LoadingIndicator';
import { colors, layout, radius, spacing, typography } from '@/shared/theme';

const textureStep = 32;

export function SplashBrandScreen() {
  const versionLabel = useMemo(() => {
    const version = Constants.expoConfig?.version ?? '1.0.0';
    return `EST. 2024 / VERSION ${version}`;
  }, []);

  const dots = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    const columns = Math.ceil(width / textureStep);
    const rows = Math.ceil(height / textureStep);

    return Array.from({ length: columns * rows }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      return {
        key: `${column}-${row}`,
        left: column * textureStep + 8,
        top: row * textureStep + 8,
      };
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.textureLayer}>
          {dots.map((dot) => (
            <View
              key={dot.key}
              style={[styles.textureDot, { left: dot.left, top: dot.top }]}
            />
          ))}
        </View>

        <View pointerEvents="none" style={styles.hairline} />

        <View style={styles.centerContent}>
          <BrandMark />
        </View>

        <View style={styles.footer}>
          <LoadingIndicator />
        </View>

        <Text style={styles.versionLabel}>{versionLabel}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.background.page,
  },
  textureLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  textureDot: {
    position: 'absolute',
    width: 1,
    height: 1,
    borderRadius: radius.pill,
    backgroundColor: '#d9d4cf',
  },
  hairline: {
    position: 'absolute',
    top: spacing.hero,
    left: spacing.page,
    width: 56,
    height: 1,
    backgroundColor: colors.border.whisper,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.page,
    minHeight: 420,
    width: '100%',
    maxWidth: layout.splashNarrowWidth,
    alignSelf: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: Platform.select({ web: 34, default: 42 }),
    left: spacing.page,
    right: spacing.page,
    alignItems: 'center',
  },
  versionLabel: {
    ...typography.micro,
    position: 'absolute',
    right: -18,
    bottom: 108,
    color: colors.text.muted,
    opacity: 0.7,
    transform: [{ rotate: '90deg' }],
  },
});
