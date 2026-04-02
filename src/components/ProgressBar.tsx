import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  target: number;
  unit?: string;
};

export const ProgressBar: React.FC<Props> = ({ label, value, target, unit = '' }) => {
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  const percent = target > 0 ? Math.round((value / target) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value.toFixed(0)}
          {unit} / {target.toFixed(0)}
          {unit} ({percent}%)
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: '#9ca3af',
    fontSize: 12,
  },
  track: {
    height: 10,
    borderRadius: 9999,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 9999,
  },
});