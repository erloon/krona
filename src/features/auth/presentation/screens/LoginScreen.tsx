import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/shared/theme';

import { AuthCard } from '../components/AuthCard';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function LoginScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <AuthCard action={<GoogleSignInButton />} />
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
  },
});
