import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { loadTargets, saveTargets } from '../storage/leanLawStorage';
import type { MacroTargets } from '../types/macros';

const defaultTargets: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 70,
};

function parseNumberOrDefault(value: string, fallback: number): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

const TargetsScreen: React.FC = () => {
  const [form, setForm] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

  useEffect(() => {
    const load = async () => {
      const t = await loadTargets();
      const useTargets = t ?? defaultTargets;
      setForm({
        calories: useTargets.calories.toString(),
        protein: useTargets.protein.toString(),
        carbs: useTargets.carbs.toString(),
        fats: useTargets.fats.toString(),
      });
    };
    void load();
  }, []);

  const onChange = (key: keyof typeof form, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const targets: MacroTargets = {
      calories: parseNumberOrDefault(form.calories, defaultTargets.calories),
      protein: parseNumberOrDefault(form.protein, defaultTargets.protein),
      carbs: parseNumberOrDefault(form.carbs, defaultTargets.carbs),
      fats: parseNumberOrDefault(form.fats, defaultTargets.fats),
    };

    await saveTargets(targets);
    Alert.alert('Saved', 'Targets updated successfully.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily targets</Text>
      <Text style={styles.subtitle}>These values are used on the Today screen.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Calories</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.calories}
          onChangeText={(t) => onChange('calories', t)}
          placeholder="2000"
        />
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.protein}
            onChangeText={(t) => onChange('protein', t)}
            placeholder="150"
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.carbs}
            onChangeText={(t) => onChange('carbs', t)}
            placeholder="200"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Fats (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.fats}
          onChangeText={(t) => onChange('fats', t)}
          placeholder="70"
        />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save targets</Text>
      </Pressable>
    </View>
  );
};

export default TargetsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111313ff',
    padding: 16,
  },
  title: {
    color: '#e5e7eb',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#111313ff',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#e5e7eb',
    fontSize: 14,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#16a34a',
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#020617',
    fontWeight: '600',
    fontSize: 15,
  },
});