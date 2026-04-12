import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStartupSession } from '@/core/store/startup-session';
import { colors, typography } from '@/shared/theme';

export function AppHeaderUser() {
  const { session } = useStartupSession();
  const displayName = resolveDisplayName(session?.user.name, session?.user.email);

  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.name}>
        {displayName}
      </Text>
    </View>
  );
}

function resolveDisplayName(name?: string, email?: string) {
  const normalizedName = name?.trim();

  if (normalizedName) {
    return normalizedName;
  }

  const normalizedEmail = email?.trim();

  if (normalizedEmail) {
    return normalizedEmail;
  }

  return 'Krona';
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 180,
    justifyContent: 'flex-end',
  },
  name: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
});
