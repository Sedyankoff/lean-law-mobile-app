import { buildShareText, calculateTotals } from "../src/services/macroService";
import type { FoodEntry, MacroTargets } from "../src/types/macros";

describe("macroService.calculateTotals", () => {
  test("sums macro values correctly", () => {
    const foods: FoodEntry[] = [
      {
        id: "1",
        name: "Chicken",
        calories: 200,
        protein: 30,
        carbs: 0,
        fats: 10,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Rice",
        calories: 300,
        protein: 6,
        carbs: 60,
        fats: 2,
        createdAt: new Date().toISOString(),
      },
    ];

    const totals = calculateTotals(foods);

    expect(totals.calories).toBe(500);
    expect(totals.protein).toBe(36);
    expect(totals.carbs).toBe(60);
    expect(totals.fats).toBe(12);
  });

  test("returns zeros for empty list", () => {
    const totals = calculateTotals([]);
    expect(totals.calories).toBe(0);
    expect(totals.protein).toBe(0);
    expect(totals.carbs).toBe(0);
    expect(totals.fats).toBe(0);
  });
});

describe("macroService.buildShareText", () => {
  test("formats text properly", () => {
    const targets: MacroTargets = {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fats: 70,
    };

    const foods: FoodEntry[] = [
      {
        id: "1",
        name: "Chicken",
        calories: 200,
        protein: 30,
        carbs: 0,
        fats: 10,
        createdAt: new Date().toISOString(),
      },
    ];

    const text = buildShareText(targets, { calories: 200, protein: 30, carbs: 0, fats: 10 }, foods);

    expect(text).toContain("LeanLaw – daily macros");
    expect(text).toContain("Calories: 2000");
    expect(text).toContain("Protein: 150 g");
    expect(text).toContain("Chicken");
  });
});