export type MacroSuggestion = {
  title: string;
  ingredients: string[];
  estimatedMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  reason: string;
};

export type MacroSuggestionsResponse = {
  suggestions: MacroSuggestion[];
};

export type MacroSuggestionsRequest = {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFats: number;
  preferredFoods?: string[];
  avoidFoods?: string[];
};
