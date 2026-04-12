import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { startupSessionActions } from '@/core/store/startup-session';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { ScreenContainer } from '@/shared/ui/layout/ScreenContainer';
import { AppTopBar } from '@/shared/ui/primitives/AppTopBar';
import { ChoiceCard } from '@/shared/ui/primitives/ChoiceCard';
import { ConfirmationModal } from '@/shared/ui/primitives/ConfirmationModal';
import { DestructiveButton } from '@/shared/ui/primitives/DestructiveButton';
import { InfoBanner } from '@/shared/ui/primitives/InfoBanner';
import { SectionHeader } from '@/shared/ui/primitives/SectionHeader';
import { SelectField } from '@/shared/ui/primitives/SelectField';
import { TextAreaField } from '@/shared/ui/primitives/TextAreaField';
import { TextField } from '@/shared/ui/primitives/TextField';
import { ToggleSwitch } from '@/shared/ui/primitives/ToggleSwitch';

import { ReliefToggleRow } from '../components/ReliefToggleRow';
import { SettingsGroupCard } from '../components/SettingsGroupCard';
import { ThresholdIndicator } from '../components/ThresholdIndicator';
import { useSettings } from '../hooks/useSettings';
import {
  currencyOptions,
  languageOptions,
  lumpSumRateOptions,
  taxationFormOptions,
  zusStatusOptions,
} from '../view-models/settingsOptions';

export function SettingsScreen() {
  const router = useRouter();
  const {
    clearDatabase,
    error,
    isClearingData,
    isLoading,
    reload,
    saveState,
    settings,
    updateSettings,
  } = useSettings();
  const [isResetConfirmationVisible, setIsResetConfirmationVisible] = React.useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  function handleLogout() {
    startupSessionActions.setAuthenticated(false);
    router.replace('/(auth)/login');
  }

  async function handleConfirmClearDatabase() {
    try {
      await clearDatabase();
      setIsResetConfirmationVisible(false);
    } catch {
      // The hook already exposes a screen-level error message.
    }
  }

  if (isLoading || !settings) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.brand.primary} />
          <Text style={styles.loadingText}>Wczytywanie ustawień...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const selectedTaxationForm = taxationFormOptions.find(
    (option) => option.value === settings.tax.taxationForm
  );

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppTopBar
        title="Krona"
        trailingContent={
          <View style={styles.topBarActions}>
            <Pressable style={styles.iconAction}>
              <MaterialCommunityIcons
                color={colors.text.secondary}
                name="bell-outline"
                size={20}
              />
            </Pressable>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>K</Text>
            </View>
          </View>
        }
      />

      <View style={styles.hero}>
        <Text style={styles.screenTitle}>Ustawienia</Text>
        <Text style={styles.screenSubtitle}>
          Konfiguracja profilu, podatków i preferencji
        </Text>
      </View>

      {error ? (
        <View style={styles.inlineStatus}>
          <InfoBanner message={error} />
          <Pressable onPress={reload} style={styles.retryLink}>
            <Text style={styles.retryLinkLabel}>Ponów</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.saveStatus}>
        {saveState === 'saving'
          ? 'Zapisywanie...'
          : saveState === 'saved'
            ? 'Wszystkie zmiany zapisane'
            : saveState === 'error'
              ? 'Błąd zapisu'
              : 'Gotowe'}
      </Text>

      <View style={styles.section}>
        <SectionHeader title="Profil firmy" />
        <SettingsGroupCard>
          <TextField
            label="Nazwa firmy"
            onChangeText={(value) =>
              updateSettings({ profile: { companyName: value } }, 'debounced')
            }
            placeholder="Np. Studio Projektowe ARCHI-TEK"
            value={settings.profile.companyName}
          />
          <TextField
            keyboardType="number-pad"
            label="NIP"
            onChangeText={(value) => updateSettings({ profile: { nip: value } }, 'debounced')}
            placeholder="5251234567"
            value={settings.profile.nip}
          />
          <TextAreaField
            label="Adres siedziby"
            onChangeText={(value) => updateSettings({ profile: { address: value } }, 'debounced')}
            placeholder="ul. Marszałkowska 12/4, 00-001 Warszawa"
            value={settings.profile.address}
          />
        </SettingsGroupCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Forma opodatkowania" />
        <View style={styles.stack}>
          {taxationFormOptions.map((option) => (
            <ChoiceCard
              description={option.description}
              key={option.value}
              onPress={() => updateSettings({ tax: { taxationForm: option.value } })}
              selected={settings.tax.taxationForm === option.value}
              title={option.title}
            >
              {option.value === 'LUMP_SUM' && settings.tax.taxationForm === 'LUMP_SUM' ? (
                <SelectField
                  label="Stawka ryczałtu"
                  onValueChange={(value) => updateSettings({ tax: { lumpSumRate: value } })}
                  options={lumpSumRateOptions}
                  value={settings.tax.lumpSumRate}
                />
              ) : null}
            </ChoiceCard>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Składka zdrowotna" />
        <SettingsGroupCard>
          <ThresholdIndicator
            taxYear={settings.tax.taxYear}
            taxationFormLabel={selectedTaxationForm?.title ?? 'Podatek liniowy'}
          />
        </SettingsGroupCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Status ZUS" />
        <SettingsGroupCard style={styles.zeroPaddingCard}>
          {zusStatusOptions.map((option, index) => (
            <View key={option.value}>
              <ChoiceCard
                description={option.description}
                onPress={() => updateSettings({ zus: { zusStatus: option.value } })}
                selected={settings.zus.zusStatus === option.value}
                title={option.title}
              />
              {index < zusStatusOptions.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
          <View style={styles.topBorder}>
            <ToggleSwitch
              description="Dodatkowe 2.45% składki"
              disabled={
                settings.zus.zusStatus === 'STARTUP' || settings.zus.zusStatus === 'UOP'
              }
              label="Dobrowolne chorobowe"
              onValueChange={(value) =>
                updateSettings({ zus: { voluntarySicknessInsurance: value } })
              }
              value={settings.zus.voluntarySicknessInsurance}
            />
          </View>
        </SettingsGroupCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Preferencje PIT" />
        <SettingsGroupCard style={styles.zeroPaddingCard}>
          <View style={styles.paddedBlock}>
            <ReliefToggleRow
              description={
                settings.tax.taxationForm === 'LUMP_SUM'
                  ? 'Niedostępne przy ryczałcie'
                  : 'Ulga na kwalifikowane IP'
              }
              disabled={settings.tax.taxationForm === 'LUMP_SUM'}
              label="IP BOX (5%)"
              nestedLabel="Udział dochodu (%)"
              nestedSuffix="%"
              nestedValue={settings.reliefs.ipBoxQualifiedIncomePercent}
              onNestedChange={(value) =>
                updateSettings(
                  { reliefs: { ipBoxQualifiedIncomePercent: value } },
                  'debounced'
                )
              }
              onValueChange={(value) => updateSettings({ reliefs: { ipBox: value } })}
              value={settings.reliefs.ipBox}
            />
            {settings.reliefs.ipBox ? (
              <View style={styles.ipBoxCosts}>
                <TextField
                  keyboardType="numeric"
                  label="Koszty kwalifikowane A"
                  onChangeText={(value) =>
                    updateSettings({ reliefs: { ipBoxCostsA: value } }, 'debounced')
                  }
                  suffix="PLN"
                  value={settings.reliefs.ipBoxCostsA}
                />
                <TextField
                  keyboardType="numeric"
                  label="Koszty kwalifikowane B"
                  onChangeText={(value) =>
                    updateSettings({ reliefs: { ipBoxCostsB: value } }, 'debounced')
                  }
                  suffix="PLN"
                  value={settings.reliefs.ipBoxCostsB}
                />
                <TextField
                  keyboardType="numeric"
                  label="Koszty kwalifikowane C"
                  onChangeText={(value) =>
                    updateSettings({ reliefs: { ipBoxCostsC: value } }, 'debounced')
                  }
                  suffix="PLN"
                  value={settings.reliefs.ipBoxCostsC}
                />
                <TextField
                  keyboardType="numeric"
                  label="Koszty kwalifikowane D"
                  onChangeText={(value) =>
                    updateSettings({ reliefs: { ipBoxCostsD: value } }, 'debounced')
                  }
                  suffix="PLN"
                  value={settings.reliefs.ipBoxCostsD}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.divider} />
          <View style={styles.paddedBlock}>
            <ToggleSwitch
              description="Przychód zwolniony do wspólnego limitu 85 528 PLN"
              label="Ulga na powrót / 4+"
              onValueChange={(value) =>
                updateSettings({
                  reliefs: {
                    returnRelief: value,
                    familyRelief: value,
                  },
                })
              }
              value={settings.reliefs.returnRelief || settings.reliefs.familyRelief}
            />
          </View>
        </SettingsGroupCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Podatek VAT" />
        <SettingsGroupCard>
          <ToggleSwitch
            description="Obowiązek naliczania i odliczania podatku"
            label="Czynny podatnik VAT"
            onValueChange={(value) =>
              updateSettings({ vat: { vatStatus: value ? 'ACTIVE' : 'EXEMPT' } })
            }
            value={settings.vat.vatStatus === 'ACTIVE'}
          />
          <InfoBanner message="Limit zwolnienia podmiotowego z VAT wynosi 200 000 PLN rocznie." />
        </SettingsGroupCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Preferencje" />
        <SettingsGroupCard>
          <SelectField
            label="Język aplikacji"
            onValueChange={(value) => updateSettings({ preferences: { language: value } })}
            options={languageOptions}
            value={settings.preferences.language}
          />
          <SelectField
            label="Waluta domyślna"
            onValueChange={(value) =>
              updateSettings({ preferences: { defaultCurrency: value } })
            }
            options={currencyOptions}
            value={settings.preferences.defaultCurrency}
          />
          <ToggleSwitch
            description="Dostępne tylko dla rozliczenia skalą podatkową"
            disabled={settings.tax.taxationForm !== 'SCALE'}
            label="Rozliczenie z małżonkiem"
            onValueChange={(value) =>
              updateSettings({ tax: { jointTaxation: value } })
            }
            value={settings.tax.jointTaxation}
          />
          {settings.tax.taxationForm === 'SCALE' && settings.tax.jointTaxation ? (
            <TextField
              keyboardType="numeric"
              label="Roczny dochód małżonka"
              onChangeText={(value) =>
                updateSettings(
                  { tax: { jointTaxationSpouseAnnualIncome: value } },
                  'debounced'
                )
              }
              suffix="PLN"
              value={settings.tax.jointTaxationSpouseAnnualIncome}
            />
          ) : null}
        </SettingsGroupCard>
      </View>

      <View style={styles.footer}>
        <DestructiveButton
          accessibilityHint="Usuwa wszystkie zapisane przychody, koszty, snapshoty i ustawienia aplikacji."
          disabled={isClearingData}
          label="Wyczyść bazę danych"
          loading={isClearingData}
          onPress={() => setIsResetConfirmationVisible(true)}
          style={styles.clearDataButton}
        />
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons color={colors.text.primary} name="logout" size={18} />
          <Text style={styles.logoutLabel}>Wyloguj się</Text>
        </Pressable>
        <Text style={styles.footerMeta}>KRONA v{appVersion} • 2026</Text>
      </View>

      <ConfirmationModal
        cancelLabel="Anuluj"
        confirmLabel="Wyczyść"
        destructive
        loading={isClearingData}
        message="Wszystkie przychody, koszty, okresy raportowe, snapshoty obliczeń i ustawienia zostaną trwale usunięte."
        onCancel={() => setIsResetConfirmationVisible(false)}
        onConfirm={handleConfirmClearDatabase}
        title="Wyczyścić bazę danych?"
        visible={isResetConfirmationVisible}
        warningMessage="Ta operacja przywróci aplikację do stanu początkowego, ale nie wyloguje Cię z konta."
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingBottom: spacing.hero,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconAction: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  avatar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surfaceContainerLow,
  },
  avatarLabel: {
    ...typography.caption,
    color: colors.text.primary,
  },
  hero: {
    gap: spacing.xs,
  },
  screenTitle: {
    ...typography.screenTitle,
    color: colors.text.primary,
  },
  screenSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  inlineStatus: {
    gap: spacing.sm,
  },
  retryLink: {
    alignSelf: 'flex-start',
  },
  retryLinkLabel: {
    ...typography.button,
    color: colors.brand.primary,
  },
  saveStatus: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  section: {
    gap: spacing.lg,
  },
  stack: {
    gap: spacing.sm,
  },
  zeroPaddingCard: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.whisper,
  },
  paddedBlock: {
    padding: spacing.lg,
  },
  topBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.whisper,
    padding: spacing.lg,
  },
  footer: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  clearDataButton: {
    marginBottom: spacing.xs,
  },
  ipBoxCosts: {
    gap: spacing.md,
    paddingLeft: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 117, 222, 0.16)',
  },
  logoutButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
  },
  logoutLabel: {
    ...typography.button,
    color: colors.text.primary,
  },
  footerMeta: {
    ...typography.micro,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
