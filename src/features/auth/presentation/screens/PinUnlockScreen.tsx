import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { startupSessionActions, useStartupSession } from '@/core/store/startup-session';
import { authSessionService } from '@/features/auth/application/services/authSessionService';
import { localSecurityService } from '@/features/auth/application/services/localSecurityService';
import { colors, layout, spacing } from '@/shared/theme';

import { PinGateCard } from '../components/PinGateCard';

export function PinUnlockScreen() {
  const router = useRouter();
  const { session } = useStartupSession();
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  async function handleSubmit() {
    if (!session) {
      setError('Sesja logowania wygasła. Zaloguj się ponownie.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await localSecurityService.unlockWithPin(session.user.id, pin);
      startupSessionActions.unlockApp(result.databaseKey);
      router.replace('/(app)');
    } catch (unlockError) {
      setError(
        unlockError instanceof Error
          ? unlockError.message
          : 'Nie udało się odblokować aplikacji.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPin() {
    Alert.alert(
      'Nie pamiętasz PIN-u?',
      'Bez poprawnego PIN-u nie da się odszyfrować lokalnej bazy danych. Kontynuacja usunie wszystkie lokalne dane na tym urządzeniu i wyloguje Cię z aplikacji.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń dane',
          style: 'destructive',
          onPress: () => {
            void resetSecureData();
          },
        },
      ]
    );
  }

  async function resetSecureData() {
    try {
      setIsResetting(true);
      await authSessionService.signOut();
      await localSecurityService.resetSecureLocalData();
      startupSessionActions.signOut(
        'PIN został zresetowany razem z lokalnymi danymi. Zaloguj się ponownie przez Google i ustaw nowy PIN.'
      );
      router.replace('/(auth)/login');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <PinGateCard
            description="Po logowaniu Google wpisz 4-cyfrowy PIN, aby odblokować aplikację i zaszyfrowaną bazę danych."
            error={error}
            isSubmitting={isSubmitting}
            onPinChange={setPin}
            onSecondaryAction={handleForgotPin}
            pinLabel="PIN"
            pinValue={pin}
            secondaryActionLabel="Nie pamiętam PIN-u"
            secondaryActionLoading={isResetting}
            submitLabel="Odblokuj aplikację"
            title="Wpisz PIN"
            warning="Jeśli utracisz PIN, lokalne dane nie będą możliwe do odzyskania."
            onSubmit={handleSubmit}
          />
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
    justifyContent: 'center',
  },
});
