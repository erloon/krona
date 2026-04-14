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
  entityLabel?: string;
};

export function RecordActionRow({
  onEdit,
  onDuplicate,
  onDelete,
  actionDisabled = false,
  duplicateLoading = false,
  deleteDisabled = false,
  title,
  entityLabel = 'przychód',
}: RecordActionRowProps) {
  const deleteLabel = title ? `Usuń ${entityLabel} ${title}` : `Usuń ${entityLabel}`;

  return (
    <View style={styles.row}>
      <SecondaryButton
        accessibilityHint={`Otwiera formularz edycji rekordu ${entityLabel}.`}
        accessibilityLabel={title ? `Details ${entityLabel} ${title}` : `Details ${entityLabel}`}
        disabled={actionDisabled}
        fullWidth
        label="Details"
        leadingAccessory={
          <MaterialCommunityIcons color={colors.text.primary} name="pencil-outline" size={16} />
        }
        onPress={onEdit}
        style={styles.actionButton}
      />
      <IconButton
        accessibilityHint={`Tworzy kopię rekordu ${entityLabel} w bieżącym miesiącu.`}
        accessibilityLabel={title ? `Duplikuj ${entityLabel} ${title}` : `Duplikuj ${entityLabel}`}
        color={colors.text.primary}
        disabled={actionDisabled}
        filled
        icon="content-copy"
        loading={duplicateLoading}
        onPress={onDuplicate}
        style={styles.iconActionButton}
      />
      <IconButton
        accessibilityHint={`Otwiera potwierdzenie usunięcia rekordu ${entityLabel}.`}
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
  iconActionButton: {
    borderWidth: 1,
    borderColor: colors.border.input,
    backgroundColor: colors.background.surface,
  },
  deleteButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.18)',
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
  },
});
