import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodEntry } from '../types/macros';

type Props = {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
};

export const FoodListItem: React.FC<Props> = ({ entry, onEdit, onDelete }) => {
  const handlePress = () => onEdit(entry);
  const handleLongPress = () => onDelete(entry.id);

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{entry.name}</Text>
        <Text style={styles.details}>
          {entry.calories.toFixed(0)} kcal • Protein {entry.protein.toFixed(0)}g • Carbs{' '}
          {entry.carbs.toFixed(0)}g • Fats {entry.fats.toFixed(0)}g
        </Text>
      </View>
      <Text style={styles.hint}>Tap to edit • Hold to delete</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111313ff',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
  },
  details: {
    color: '#9ca3af',
    fontSize: 12,
  },
  hint: {
    color: '#4b5563',
    fontSize: 10,
  },
});