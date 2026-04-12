import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, layout, spacing, typography } from '@/shared/theme';
import { BrandMark } from '@/shared/ui/primitives/BrandMark';
import { InfoBanner } from '@/shared/ui/primitives/InfoBanner';
import { PrimaryButton } from '@/shared/ui/primitives/PrimaryButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';
import { TextField } from '@/shared/ui/primitives/TextField';

type PinGateCardProps = {
  title: string;
  description: string;
  pinLabel: string;
  pinValue: string;
  onPinChange: (value: string) => void;
  submitLabel: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  warning?: string | null;
  confirmLabel?: string;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLoading?: boolean;
};

export function PinGateCard({
  title,
  description,
  pinLabel,
  pinValue,
  onPinChange,
  submitLabel,
  onSubmit,
  isSubmitting = false,
  error,
  warning,
  confirmLabel,
  confirmValue,
  onConfirmChange,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionLoading = false,
}: PinGateCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <BrandMark iconSize={48} showSubtitle={false} title="KRONA" variant="compact" />
      </View>

      <View style={styles.headingSection}>
        <Text style={styles.heading}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.form}>
        <TextField
          autoComplete="off"
          helperText="Wpisz dokładnie 4 cyfry."
          keyboardType="number-pad"
          label={pinLabel}
          maxLength={4}
          onChangeText={(value) => onPinChange(sanitizePin(value))}
          secureTextEntry
          textContentType="oneTimeCode"
          value={pinValue}
        />
        {confirmLabel && onConfirmChange ? (
          <TextField
            autoComplete="off"
            helperText="Powtórz ten sam 4-cyfrowy PIN."
            keyboardType="number-pad"
            label={confirmLabel}
            maxLength={4}
            onChangeText={(value) => onConfirmChange(sanitizePin(value))}
            secureTextEntry
            textContentType="oneTimeCode"
            value={confirmValue ?? ''}
          />
        ) : null}
        {warning ? <InfoBanner message={warning} /> : null}
        {error ? <InfoBanner message={error} /> : null}
        <PrimaryButton
          disabled={pinValue.length !== 4 || (confirmLabel ? confirmValue?.length !== 4 : false)}
          label={submitLabel}
          loading={isSubmitting}
          onPress={onSubmit}
        />
        {secondaryActionLabel && onSecondaryAction ? (
          <SecondaryButton
            disabled={secondaryActionLoading}
            label={secondaryActionLabel}
            loading={secondaryActionLoading}
            onPress={onSecondaryAction}
          />
        ) : null}
      </View>
    </View>
  );
}

function sanitizePin(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: layout.authNarrowWidth,
    alignItems: 'center',
  },
  brandSection: {
    marginBottom: spacing.xxxl,
  },
  headingSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  heading: {
    ...typography.authHeadline,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.bodySmall,
    maxWidth: 320,
    color: colors.text.subtle,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: spacing.lg,
  },
});
