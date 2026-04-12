import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/shared/ui/primitives/BrandMark';
import { spacing } from '@/shared/theme';

export function AppHeaderBrand() {
  return (
    <View style={styles.container}>
      <BrandMark
        iconSize={32}
        showSubtitle={false}
        showTitle={false}
        variant="compact"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: -spacing.xs,
  },
});
