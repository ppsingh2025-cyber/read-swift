export const getContextPreview = (words: string[], idx: number) =>
  words.slice(Math.max(0, idx - 4), Math.min(words.length, idx + 10)).join(' ');

export type ContextSegment = { text: string; isCurrent: boolean };
export const getContextSegments = (words: string[], idx: number): ContextSegment[] => {
  const start = Math.max(0, idx - 20), end = Math.min(words.length, idx + 30);
  return words.slice(start, end).map((w, i) => ({ text: w, isCurrent: start + i === idx }));
};
