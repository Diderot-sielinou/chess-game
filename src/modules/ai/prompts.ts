export function movePrompt(params: {
  fen: string;
  legalMoves: string[];
  lastMoves: string[];
  difficulty: string;
}) {
  const { fen, legalMoves, lastMoves, difficulty } = params;
  return (
    `You are a chess assistant. Return ONLY strict JSON.\n\n` +
    `TASK: Choose ONE move for the side to move in the given FEN.\n` +
    `CONSTRAINTS: The move MUST be one of LegalMoves. Do not invent new formats.\n` +
    `FORMAT: {"move":"<uci or san>","explanation":"<short reason>"}\n\n` +
    `FEN: ${fen}\n` +
    `LegalMoves: ${JSON.stringify(legalMoves)}\n` +
    `LastMoves: ${JSON.stringify(lastMoves.slice(-10))}\n` +
    `Difficulty: ${difficulty}`
  );
}

export function suggestionsPrompt(params: {
  fen: string;
  legalMoves: string[];
  lastMoves: string[];
  count: number;
  style: string;
}) {
  const { fen, legalMoves, lastMoves, count, style } = params;
  return (
    `You are a chess coach. Return ONLY strict JSON.\n\n` +
    `TASK: Propose ${count} candidate moves for the side to move.\n` +
    `CONSTRAINTS: Suggestions MUST be a subset of LegalMoves.\n` +
    `FORMAT: {"suggestions":["<uci/san>","<uci/san>",...],"explanations":["...","..."]}\n\n` +
    `FEN: ${fen}\n` +
    `LegalMoves: ${JSON.stringify(legalMoves)}\n` +
    `LastMoves: ${JSON.stringify(lastMoves.slice(-10))}\n` +
    `Style: ${style}`
  );
}
