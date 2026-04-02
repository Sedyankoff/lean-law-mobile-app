import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { getMacroSuggestions } from "../services/aiService";
import { calculateTotals } from "../services/macroService";
import { loadFoods, loadTargets } from "../storage/leanLawStorage";
import type { MacroSuggestion } from "../types/ai";
import type { FoodEntry, MacroTargets } from "../types/macros";

const defaultTargets: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 70,
};

export default function AiMacroSuggestionsScreen() {
  const [targets, setTargets] = useState<MacroTargets>(defaultTargets);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [bootLoading, setBootLoading] = useState(true);

  const [preferredFoods, setPreferredFoods] = useState(
    "chicken, rice, eggs, skyr",
  );
  const [avoidFoods, setAvoidFoods] = useState("peanuts");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MacroSuggestion[]>([]);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const [loadedTargets, loadedFoods] = await Promise.all([
            loadTargets(),
            loadFoods(),
          ]);

          setTargets(loadedTargets ?? defaultTargets);
          setFoods(loadedFoods);
        } catch (e) {
          console.warn("Failed to load macro data", e);
        } finally {
          setBootLoading(false);
        }
      };

      void loadData();
    }, []),
  );

  const totals = useMemo(() => calculateTotals(foods), [foods]);

  const remainingCalories = Math.max(
    0,
    Number((targets.calories - totals.calories).toFixed(1)),
  );
  const remainingProtein = Math.max(
    0,
    Number((targets.protein - totals.protein).toFixed(1)),
  );
  const remainingCarbs = Math.max(
    0,
    Number((targets.carbs - totals.carbs).toFixed(1)),
  );
  const remainingFats = Math.max(
    0,
    Number((targets.fats - totals.fats).toFixed(1)),
  );

  const onGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setSuggestions([]);

      const result = await getMacroSuggestions({
        remainingCalories,
        remainingProtein,
        remainingCarbs,
        remainingFats,
        preferredFoods: preferredFoods
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        avoidFoods: avoidFoods
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      });

      setSuggestions(result.suggestions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading macro data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Macro Suggestions</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Remaining macros</Text>
        <Text style={styles.text}>Calories: {remainingCalories}</Text>
        <Text style={styles.text}>Protein: {remainingProtein}g</Text>
        <Text style={styles.text}>Carbs: {remainingCarbs}g</Text>
        <Text style={styles.text}>Fats: {remainingFats}g</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TextInput
          value={preferredFoods}
          onChangeText={setPreferredFoods}
          placeholder="Preferred foods"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />

        <TextInput
          value={avoidFoods}
          onChangeText={setAvoidFoods}
          placeholder="Foods to avoid"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />

        <Pressable
          style={styles.button}
          onPress={onGenerate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Generating..." : "Generate Suggestions"}
          </Text>
        </Pressable>
      </View>

      {!!error && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {suggestions.map((item, index) => (
        <View key={`${item.title}-${index}`} style={styles.card}>
          <Text style={styles.suggestionTitle}>{item.title}</Text>
          <Text style={styles.text}>
            Ingredients: {item.ingredients.join(", ")}
          </Text>
          <Text style={styles.text}>
            Macros: {item.estimatedMacros.calories} kcal | P{" "}
            {item.estimatedMacros.protein}g | C {item.estimatedMacros.carbs}g |
            F {item.estimatedMacros.fats}g
          </Text>
          <Text style={styles.text}>{item.reason}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#111313ff",
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#111313ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 12,
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e5e7eb",
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#111313ff",
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  text: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#111313ff",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#16a34a",
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 14,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
  },
  suggestionTitle: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
});
