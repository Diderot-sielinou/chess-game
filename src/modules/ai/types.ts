export type LlmMoveResponse = {
  move: string;
  explanation?: string;
  promotion?: string; // optionnel : "q", "r", "b", "n"
};

export type LlmSuggestionsResponse = {
  suggestions: string[];
  explanations?: string[];
};
