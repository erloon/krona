import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/shared/theme';
import { useStartupSession } from '@/core/store/startup-session';
import { InfoBanner } from '@/shared/ui/primitives/InfoBanner';

import { AuthCard } from '../components/AuthCard';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function LoginScreen() {
  const { error, isPending, signIn } = useGoogleSignIn();
  const { securityMessage } = useStartupSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <AuthCard
            action={
              <GoogleSignInButton
                disabled={isPending}
                loading={isPending}
                onPress={signIn}
              />
            }
            statusMessage="Google potwierdza Twoją tożsamość. Następnie ustawisz albo wpiszesz 4-cyfrowy PIN chroniący lokalną, zaszyfrowaną bazę danych."
          />
          {securityMessage ? <InfoBanner message={securityMessage} /> : null}
          {error ? <InfoBanner message={error} /> : null}
        </View>
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
    backgroundColor: colors.background.page,
    paddingHorizontal: spacing.page,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.authNarrowWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
