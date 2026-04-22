import { searchQuery } from './types';

export function parseQuery(q: string) {
  const filters: searchQuery = {};
  if (q.includes('males')) filters.gender = 'male';
  if (q.includes('females')) filters.gender = 'female';
  let min_age: number | undefined;
  let max_age: number | undefined;
  if (q.includes('young')) {
    min_age = 16;
    max_age = 24;
  }
  if (q.includes('teenager')) {
    min_age = 13;
    max_age = 19;
  }
  const aboveMatch = q.match(/above (\d+)/);
  if (aboveMatch) {
    filters.min_age = parseInt(aboveMatch[1]);
  }

  // Extract possible country word (last word usually)
  const words = q.split(' ');
  filters.possibleCountry = words[words.length - 1];

  return filters;
}
