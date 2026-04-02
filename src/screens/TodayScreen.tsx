import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { FoodListItem } from '../components/FoodListItem';
import { ProgressBar } from '../components/ProgressBar';
import {
    buildShareText,
    calculateTotals,
    type MacroTotals,
} from '../services/macroService';
import {
    clearDay,
    loadFoods,
    loadTargets,
    saveFoods,
} from '../storage/leanLawStorage';
import type { FoodEntry, MacroTargets } from '../types/macros';

type FormState = {
  id: string | null;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
};

const defaultTargets: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 70,
};

function createEmptyForm(): FormState {
  return {
    id: null,
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  };
}

function parseNumberOrZero(value: string): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const TodayScreen: React.FC = () => {
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [showQr, setShowQr] = useState(false);
  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    const loadFoodsOnly = async () => {
      const f = await loadFoods();
      setFoods(f);
    };
    void loadFoodsOnly();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadTargetsOnly = async () => {
        const t = await loadTargets();
        setTargets(t ?? defaultTargets);
      };
      void loadTargetsOnly();
    }, [])
  );

  const totals: MacroTotals = useMemo(() => calculateTotals(foods), [foods]);

  const onChangeField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(createEmptyForm());

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Please enter a food name.');
      return;
    }

    const food: FoodEntry = {
      id: form.id ?? Date.now().toString(),
      name: form.name.trim(),
      calories: parseNumberOrZero(form.calories),
      protein: parseNumberOrZero(form.protein),
      carbs: parseNumberOrZero(form.carbs),
      fats: parseNumberOrZero(form.fats),
      createdAt: new Date().toISOString(),
    };

    const updated = form.id
      ? foods.map((f) => (f.id === form.id ? food : f))
      : [food, ...foods];

    setFoods(updated);
    await saveFoods(updated);
    resetForm();
  };

  const handleEdit = (entry: FoodEntry) => {
    setForm({
      id: entry.id,
      name: entry.name,
      calories: entry.calories.toString(),
      protein: entry.protein.toString(),
      carbs: entry.carbs.toString(),
      fats: entry.fats.toString(),
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this food?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = foods.filter((f) => f.id !== id);
          setFoods(updated);
          await saveFoods(updated);
          if (form.id === id) resetForm();
        },
      },
    ]);
  };

  const handleClearDay = () => {
    Alert.alert('Reset day', 'Clear all foods and targets?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearDay();
          setFoods([]);
          setTargets(defaultTargets);
          resetForm();
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!targets) return;
    const text = buildShareText(targets, totals, foods);
    try {
      await Share.share({ message: text });
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  if (!targets) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>LeanLaw</Text>
        <Text style={styles.subtitle}>Loading targets...</Text>
      </View>
    );
  }

  const logoSource = require('../../assets/images/icon.png');
  const shareText = buildShareText(targets, totals, foods);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
        <View style={styles.headerTitleArea}>
            <Image 
                source={logoSource} 
                style={styles.logo} 
                accessibilityLabel="LeanLaw Logo"
            />
            <View>
                <Text style={styles.title}>LeanLaw</Text>
                <Text style={styles.subtitle}>Your favourite daily macro tracker</Text>
            </View>
        </View>
    
        <View style={styles.headerButtons}>
            <Pressable style={styles.headerButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={18} color="#16a34a" style={styles.icon} />
                <Text style={styles.headerButtonText}>Share</Text>
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleClearDay}>
                <Ionicons name="reload-outline" size={18} color="#16a34a" style={styles.icon} />
                <Text style={styles.headerButtonText}>Reset</Text>
            </Pressable>
        </View>
    </View>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>
            Daily Macro Progress
          </Text>
          <ProgressBar
            label="Calories"
            value={totals.calories}
            target={targets.calories}
          />
          <ProgressBar
            label="Protein"
            value={totals.protein}
            target={targets.protein}
            unit="g"
          />
          <ProgressBar
            label="Carbs"
            value={totals.carbs}
            target={targets.carbs}
            unit="g"
          />
          <ProgressBar
            label="Fats"
            value={totals.fats}
            target={targets.fats}
            unit="g"
          />
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Today&apos;s foods</Text>
          {foods.length === 0 ? (
            <Text style={styles.emptyText}>
              No foods yet. Add your first entry.
            </Text>
          ) : (
            <FlatList
              data={foods}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <FoodListItem
                  entry={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            />
          )}
        </View>

       {!showForm && (
            <View style={styles.addFoodContainer}>
                <Pressable 
                    style={styles.addFoodButton} 
                    onPress={() => setShowForm(true)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#020617" />
                    <Text style={styles.addFoodButtonText}>Add New Food</Text>
                </Pressable>
            </View>
        )}

        {showForm && (
            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                    {form.id ? 'Edit food' : 'Add food'}
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Food name"
                    placeholderTextColor="#9ca3af"
                    value={form.name}
                    onChangeText={(t) => onChangeField('name', t)}
                />
                
                <View style={styles.row}>
                <View style={styles.rowInput}>
                    <Text style={styles.inputLabel}>Calories</Text>
                    <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.calories}
                    placeholderTextColor="#9ca3af"
                    onChangeText={(t) => onChangeField('calories', t)}
                    placeholder="0"
                    />
                </View>
                <View style={styles.rowInput}>
                    <Text style={styles.inputLabel}>Protein (g)</Text>
                    <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.protein}
                    placeholderTextColor="#9ca3af"
                    onChangeText={(t) => onChangeField('protein', t)}
                    placeholder="0"
                    />
                </View>
                </View>

                <View style={styles.row}>
                <View style={styles.rowInput}>
                    <Text style={styles.inputLabel}>Carbs (g)</Text>
                    <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.carbs}
                    placeholderTextColor="#9ca3af"
                    onChangeText={(t) => onChangeField('carbs', t)}
                    placeholder="0"
                    />
                </View>
                <View style={styles.rowInput}>
                    <Text style={styles.inputLabel}>Fats (g)</Text>
                    <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.fats}
                    placeholderTextColor="#9ca3af"
                    onChangeText={(t) => onChangeField('fats', t)}
                    placeholder="0"
                    />
                </View>
                </View>
                
                <View style={styles.formButtonsRow}>
                    <Pressable style={styles.primaryButton} onPress={handleSave}>
                        <Text style={styles.primaryButtonText}>
                            {form.id ? 'Save changes' : 'Add food'}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => setShowForm(false)}>
                        <Text style={styles.secondaryButtonText}>Close</Text>
                    </Pressable>
                    
                </View>
            </View>
        )}

        <View style={styles.qrSection}>
          <View style={styles.qrHeaderRow}>
            <Text style={styles.sectionTitle}>Share with QR Code</Text>
            <Pressable
              style={styles.qrCodeButton}
              onPress={() => setShowQr((prev) => !prev)}
            >
              <Text style={styles.headerButtonText}>
                {showQr ? 'Hide QR' : 'Show QR'}
              </Text>
            </Pressable>
          </View>
          {showQr && (
            <View style={styles.qrWrapper}>
              <QRCode value={shareText} size={180} />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default TodayScreen;

const styles = StyleSheet.create({
    addFoodContainer: {
        marginTop: 8,
        alignItems: 'center', 
        marginBottom: 10,
    },

    addFoodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 8,
        borderRadius: 9999,
        minWidth: '100%',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },

    addFoodButtonText: {
        color: '#020617',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },

    secondaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: '#4b5563',
    },
    headerRow: {
        flexDirection: 'column',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        paddingVertical: 4,
        gap: 22,
    },

    headerTitleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap: 10,
    },
    
    logo: {
        width: 80,
        height: 80,
        marginRight: 8,
        borderRadius: 10,
    },

    title: {
        fontSize: 35,
        fontWeight: 'bold',
        color: '#e5e7eb',
    },
    
    subtitle: {
        fontSize: 12,
        color: '#666',
    },

    headerButtons: {
        flexDirection: 'row',
        gap: 8,
        flexShrink: 0, 
    },

    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'white', 
        borderWidth: 1,
        borderColor: '#16a34a',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, 
        shadowRadius: 3,
        elevation: 3, 
    },
    qrCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#111313ff', 
        borderWidth: 1,
        borderColor: '#16a34a',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, 
        shadowRadius: 3,
        elevation: 3, 
    },
    icon: {
        marginRight: 4,
    },

    headerButtonText: {
        color: '#16a34a',
        fontWeight: '600',
        fontSize: 15,
    },
  container: {
    flex: 1,
    backgroundColor: '#111313ff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111313ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  progressSection: {
    backgroundColor: '#111313ff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
    marginTop: 16,
  },
  formSection: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111313ff',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowInput: {
    flex: 1,
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 9999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#020617',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  listSection: {
    marginTop: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  qrSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111313ff',
  },
  qrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});