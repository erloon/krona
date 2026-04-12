import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { startupSessionActions, useStartupSession } from '@/core/store/startup-session';
import { localSecurityService } from '@/features/auth/application/services/localSecurityService';
import { colors, layout, spacing } from '@/shared/theme';

import { PinGateCard } from '../components/PinGateCard';

export function PinSetupScreen() {
  const router = useRouter();
  const { session } = useStartupSession();
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (!session) {
      setError('Sesja logowania wygasła. Zaloguj się ponownie.');
      return;
    }

    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN musi składać się dokładnie z 4 cyfr.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Wpisane PIN-y nie są identyczne.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await localSecurityService.setupPin(session.user.id, pin);
      startupSessionActions.unlockApp(result.databaseKey);
      router.replace('/(app)');
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : 'Nie udało się zapisać PIN-u.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <PinGateCard
            confirmLabel="Powtórz PIN"
            confirmValue={confirmPin}
            description="Po pierwszym logowaniu Google ustaw 4-cyfrowy PIN. Ten PIN odblokowuje aplikację i zaszyfrowaną bazę danych na tym urządzeniu."
            error={error}
            isSubmitting={isSubmitting}
            onConfirmChange={setConfirmPin}
            onPinChange={setPin}
            onSubmit={handleSubmit}
            pinLabel="Nowy PIN"
            pinValue={pin}
            submitLabel="Ustaw PIN"
            title="Ustaw PIN urządzenia"
            warning="Jeśli utracisz ten PIN, nie odzyskasz zapisanych lokalnie danych. Jedyną opcją będzie wyczyszczenie zaszyfrowanej bazy i rozpoczęcie od nowa."
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
