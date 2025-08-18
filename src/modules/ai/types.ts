export type LlmMoveResponse = {
  move: string;
  explanation?: string;
};

export type LlmSuggestionsResponse = {
  suggestions: string[];
  explanations?: string[];
};
