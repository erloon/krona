import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { TextField } from '@/shared/ui/primitives/TextField';

type WorkParametersSectionProps = {
  daysPerMonth: string;
  hoursPerDay: string;
  onDaysPerMonthChange: (value: string) => void;
  onHoursPerDayChange: (value: string) => void;
  showHoursPerDay: boolean;
};

export function WorkParametersSection({
  daysPerMonth,
  hoursPerDay,
  onDaysPerMonthChange,
  onHoursPerDayChange,
  showHoursPerDay,
}: WorkParametersSectionProps) {
  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <TextField
          keyboardType="number-pad"
          label="DNI / MIES."
          onChangeText={onDaysPerMonthChange}
          placeholder="21"
          value={daysPerMonth}
        />
      </View>
      {showHoursPerDay ? (
        <View style={styles.column}>
          <TextField
            keyboardType="number-pad"
            label="GODZ. / DZIEŃ"
            onChangeText={onHoursPerDayChange}
            placeholder="8"
            value={hoursPerDay}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    minWidth: 140,
  },
});
