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
  actionDisabled?: boolean;
  duplicateLoading?: boolean;
  deleteDisabled?: boolean;
  title?: string;
};

export function RecordActionRow({
  onEdit,
  onDuplicate,
  onDelete,
  actionDisabled = false,
  duplicateLoading = false,
  deleteDisabled = false,
  title,
}: RecordActionRowProps) {
  const deleteLabel = title ? `Usuń przychód ${title}` : 'Usuń przychód';

  return (
    <View style={styles.row}>
      <SecondaryButton
        accessibilityHint="Otwiera formularz edycji tego przychodu."
        accessibilityLabel={title ? `Edytuj przychód ${title}` : 'Edytuj przychód'}
        disabled={actionDisabled}
        fullWidth
        label="EDYTUJ"
        leadingAccessory={
          <MaterialCommunityIcons color={colors.text.primary} name="pencil-outline" size={16} />
        }
        onPress={onEdit}
        style={styles.actionButton}
      />
      <SecondaryButton
        accessibilityHint="Tworzy kopię tego przychodu w bieżącym miesiącu."
        accessibilityLabel={title ? `Duplikuj przychód ${title}` : 'Duplikuj przychód'}
        disabled={actionDisabled}
        fullWidth
        label="DUPLIKUJ"
        leadingAccessory={
          <MaterialCommunityIcons color={colors.text.primary} name="content-copy" size={16} />
        }
        loading={duplicateLoading}
        onPress={onDuplicate}
        style={styles.actionButton}
      />
      <IconButton
        accessibilityHint="Otwiera potwierdzenie usunięcia tego przychodu."
        accessibilityLabel={deleteLabel}
        color={colors.brand.destructive}
        disabled={actionDisabled || deleteDisabled}
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
    borderColor: 'rgba(220, 38, 38, 0.18)',
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
  },
});
