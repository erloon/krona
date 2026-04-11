import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/shared/theme';
import { SecondaryButton } from './SecondaryButton';
import { DestructiveButton } from './DestructiveButton';
import { PrimaryButton } from './PrimaryButton';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  warningMessage?: string;
  style?: StyleProp<ViewStyle>;
};

export function ConfirmationModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  destructive = false,
  loading = false,
  warningMessage,
  style,
}: ConfirmationModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable onPress={loading ? undefined : onCancel} style={styles.backdrop}>
        <View style={[styles.container, style]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {warningMessage ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>!</Text>
              <Text style={styles.warningText}>{warningMessage}</Text>
            </View>
          ) : null}
          <View style={styles.buttonRow}>
            <SecondaryButton disabled={loading} label={cancelLabel} onPress={onCancel} style={styles.button} />
            {destructive ? (
              <DestructiveButton label={confirmLabel} loading={loading} onPress={onConfirm} style={styles.button} />
            ) : (
              <PrimaryButton label={confirmLabel} loading={loading} onPress={onConfirm} style={styles.button} />
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.glass,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.standard,
    backgroundColor: colors.background.surfaceContainerLowest,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.authHeadline,
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.standard,
    borderWidth: 1,
    borderColor: colors.brand.destructive,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  warningIcon: {
    width: 20,
    height: 20,
    borderRadius: radius.micro,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.inverse,
    backgroundColor: colors.brand.destructive,
  },
  warningText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
  },
});