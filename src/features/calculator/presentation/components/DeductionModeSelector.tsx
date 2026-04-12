import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { CostCategory } from '@/features/calculator/domain/entities/cost';
import { colors, spacing, typography } from '@/shared/theme';
import { ChoiceCard } from '@/shared/ui/primitives/ChoiceCard';

type DeductionModeSelectorProps = {
  value: CostCategory;
  onValueChange: (value: CostCategory) => void;
};

const OPTIONS: {
  value: CostCategory;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  {
    value: 'STANDARD',
    title: 'Standard',
    description: '100% PIT, 100% VAT',
    icon: 'check-circle-outline',
  },
  {
    value: 'CAR_MIXED',
    title: 'Samochód - mieszany',
    description: '75% PIT, 50% VAT',
    icon: 'car-multiple',
  },
  {
    value: 'CAR_BUSINESS',
    title: 'Samochód - firmowy',
    description: '100% PIT, 100% VAT',
    icon: 'office-building',
  },
];

export function DeductionModeSelector({ value, onValueChange }: DeductionModeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>KATEGORIA I ODLICZENIE</Text>
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <ChoiceCard
            description={option.description}
            key={option.value}
            leadingContent={
              <MaterialCommunityIcons
                color={value === option.value ? colors.brand.primary : colors.text.secondary}
                name={option.icon}
                size={20}
              />
            }
            onPress={() => onValueChange(option.value)}
            selected={value === option.value}
            title={option.title}
          />
        ))}
      </View>
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
  options: {
    gap: spacing.sm,
  },
});
