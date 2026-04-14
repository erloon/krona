import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { colors, spacing, typography } from '@/shared/theme';

let hasAttemptedSessionCompletion = false;

function completeWebAuthSession() {
  if (hasAttemptedSessionCompletion) {
    return;
  }

  hasAttemptedSessionCompletion = true;

  try {
    // On web, Expo AuthSession expects the callback page to complete the popup flow.
    // Without a matched route, Expo Router renders an unmatched route screen instead.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webBrowser = require('expo-web-browser') as {
      maybeCompleteAuthSession(): { type: 'success' | 'failed' | 'locked' };
    };

    webBrowser.maybeCompleteAuthSession();
  } catch {
    // If the module is unavailable for any reason, keep the route safe and redirect out.
  }
}

export default function OAuthRedirectRoute() {
  React.useEffect(() => {
    completeWebAuthSession();
  }, []);

  if (typeof window !== 'undefined' && window.opener) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.brand.primary} />
        <Text style={styles.message}>Finalizing sign-in...</Text>
      </View>
    );
  }

  return <Redirect href="/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.page,
    backgroundColor: colors.background.page,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
