import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { IncomeBillingType } from '@/features/calculator/domain/entities/income';
import { colors, radius, spacing } from '@/shared/theme';
import { ChoiceCard } from '@/shared/ui/primitives/ChoiceCard';

type SettlementTypeSelectorProps = {
  value: IncomeBillingType;
  onValueChange: (value: IncomeBillingType) => void;
};

const options: {
  value: IncomeBillingType;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  {
    value: 'MONTHLY',
    title: 'Miesięczny',
    description: 'Stała kwota za miesiąc pracy',
    icon: 'calendar-month-outline',
  },
  {
    value: 'DAILY',
    title: 'Dzienny',
    description: 'Stawka za jeden dzień roboczy',
    icon: 'white-balance-sunny',
  },
  {
    value: 'HOURLY',
    title: 'Godzinowy',
    description: 'Stawka za każdą zaraportowaną godzinę',
    icon: 'clock-outline',
  },
];

export function SettlementTypeSelector({
  value,
  onValueChange,
}: SettlementTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <ChoiceCard
            description={option.description}
            key={option.value}
            onPress={() => onValueChange(option.value)}
            selected={selected}
            title={option.title}
          >
            <View style={[styles.iconWrap, selected ? styles.iconWrapSelected : null]}>
              <MaterialCommunityIcons
                color={selected ? colors.brand.primary : colors.text.secondary}
                name={option.icon}
                size={22}
              />
            </View>
          </ChoiceCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.standard,
    backgroundColor: colors.background.surfaceContainer,
  },
  iconWrapSelected: {
    backgroundColor: colors.background.badge,
  },
});
