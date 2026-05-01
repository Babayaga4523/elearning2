/**
 * Fisher-Yates shuffle algorithm.
 * Creates a NEW shuffled array without mutating the original.
 * Safe to use on objects with references (e.g., isCorrect stays attached to the correct option).
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]; // shallow copy to avoid mutation
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
