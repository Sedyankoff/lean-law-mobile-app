import type {
    MacroSuggestionsRequest,
    MacroSuggestionsResponse,
} from "../types/ai";

const API_BASE_URL = "http://10.13.16.112:3001";

export async function getMacroSuggestions(
  payload: MacroSuggestionsRequest,
): Promise<MacroSuggestionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/macro-suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  return response.json();
}
