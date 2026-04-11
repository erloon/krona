import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, spacing } from '@/shared/theme';
import { IconButton } from '@/shared/ui/primitives/IconButton';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';

type RecordActionRowProps = {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

export function RecordActionRow({
  onEdit,
  onDuplicate,
  onDelete,
}: RecordActionRowProps) {
  return (
    <View style={styles.row}>
      <SecondaryButton
        fullWidth
        label="EDYTUJ"
        leadingAccessory={
          <MaterialCommunityIcons color={colors.text.primary} name="pencil-outline" size={16} />
        }
        onPress={onEdit}
        style={styles.actionButton}
      />
      <SecondaryButton
        fullWidth
        label="DUPLIKUJ"
        leadingAccessory={
          <MaterialCommunityIcons color={colors.text.primary} name="content-copy" size={16} />
        }
        onPress={onDuplicate}
        style={styles.actionButton}
      />
      <IconButton
        accessibilityLabel="Usuń przychód"
        color={colors.text.muted}
        icon="trash-can-outline"
        onPress={onDelete}
        style={styles.deleteButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
  },
  deleteButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border.input,
    backgroundColor: colors.background.surface,
  },
});
