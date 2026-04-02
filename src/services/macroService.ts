import type { FoodEntry, MacroTargets } from '../types/macros';

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export function calculateTotals(foods: FoodEntry[]): MacroTotals {
  return foods.reduce(
    (acc, f) => {
      acc.calories += f.calories;
      acc.protein += f.protein;
      acc.carbs += f.carbs;
      acc.fats += f.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export function buildShareText(
  targets: MacroTargets,
  totals: MacroTotals,
  foods: FoodEntry[]
): string {
  const header = `LeanLaw – daily macros

Target:
- Calories: ${targets.calories.toFixed(0)}
- Protein: ${targets.protein.toFixed(0)} g
- Carbs: ${targets.carbs.toFixed(0)} g
- Fats: ${targets.fats.toFixed(0)} g

Current:
- Calories: ${totals.calories.toFixed(0)}
- Protein: ${totals.protein.toFixed(0)} g
- Carbs: ${totals.carbs.toFixed(0)} g
- Fats: ${totals.fats.toFixed(0)} g`;

  const foodLines =
    foods.length === 0
      ? '\n\nNo foods logged yet.'
      : '\n\nFoods:\n' +
        foods
          .map(
            (f) =>
              `• ${f.name} – ${f.calories.toFixed(0)} kcal (P ${f.protein.toFixed(
                0
              )}g / C ${f.carbs.toFixed(0)}g / F ${f.fats.toFixed(0)}g)`
          )
          .join('\n');

  return header + foodLines;
}