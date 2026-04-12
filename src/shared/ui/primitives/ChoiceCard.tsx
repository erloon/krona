import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/shared/theme';

type ChoiceCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  leadingContent?: React.ReactNode;
  children?: React.ReactNode;
};

export function ChoiceCard({
  title,
  description,
  selected,
  onPress,
  leadingContent,
  children,
}: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected ? styles.cardSelected : null]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {leadingContent ? <View style={styles.leading}>{leadingContent}</View> : null}
          <View style={styles.copy}>
          <Text style={[styles.title, selected ? styles.titleSelected : null]}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        </View>
        <MaterialCommunityIcons
          color={selected ? colors.brand.primary : colors.text.muted}
          name={selected ? 'check-circle' : 'radiobox-blank'}
          size={20}
        />
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border.whisper,
    borderRadius: radius.paper,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: 'rgba(0, 117, 222, 0.5)',
    backgroundColor: '#fbfdff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  titleSelected: {
    color: colors.brand.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.border.whisper,
    paddingTop: spacing.md,
  },
});
