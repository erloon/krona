import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CostAttachment } from '@/features/calculator/domain/entities/cost';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { SecondaryButton } from '@/shared/ui/primitives/SecondaryButton';

type AttachmentDropzoneProps = {
  attachment: CostAttachment | null;
  onAddPress: () => void;
  onRemovePress: () => void;
};

export function AttachmentDropzone({
  attachment,
  onAddPress,
  onRemovePress,
}: AttachmentDropzoneProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ZAŁĄCZNIK</Text>
      <Pressable
        accessibilityHint="Otwiera pole do wpisania lokalnej referencji URI dla paragonu lub faktury."
        accessibilityLabel={
          attachment ? `Załącznik dodany: ${attachment.fileName}` : 'Dodaj załącznik do kosztu'
        }
        onPress={onAddPress}
        style={({ pressed }) => [styles.dropzone, pressed ? styles.dropzonePressed : null]}
      >
        <MaterialCommunityIcons color={colors.brand.primary} name="camera-outline" size={28} />
        <Text style={styles.title}>
          {attachment ? attachment.fileName : 'Dodaj referencję do zdjęcia paragonu lub faktury'}
        </Text>
        <Text style={styles.copy}>
          {attachment ? attachment.uri : 'W v1 zapisujemy lokalne URI i metadane pliku.'}
        </Text>
      </Pressable>

      {attachment ? (
        <SecondaryButton
          accessibilityLabel="Usuń załącznik"
          label="Usuń załącznik"
          onPress={onRemovePress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dropzone: {
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.whisper,
    borderRadius: radius.card,
    backgroundColor: colors.background.surfaceContainerLow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  dropzonePressed: {
    opacity: 0.92,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  copy: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
