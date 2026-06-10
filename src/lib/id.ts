/**
 * Deterministic-ish unique id generator for the mock layer.
 * (Avoids Math.random reliance for readability; good enough for in-memory data.)
 */
let counter = 1000;

export function makeId(prefix = 'id'): string {
  counter += 1;
  const stamp = Date.now().toString(36);
  return `${prefix}_${stamp}${counter.toString(36)}`;
}
