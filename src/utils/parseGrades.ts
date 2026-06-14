export function parseGrades(input: string): number[] {
  const matches = input.match(/\d+(\.\d+)?/g);
  if (!matches) return [];
  return matches.map(Number).filter(n => n >= 0 && n <= 100);
}
