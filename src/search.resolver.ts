import { searchQuery } from './types';

export function parseQuery(q: string) {
  q = q.toLowerCase();
  const filters: any = {};

  //gender handler
  const hasMale = /\bmale\b/.test(q);
  const hasFemale = /\bfemale\b/.test(q);

  if (hasMale && hasFemale) {
    filters.gender = { in: ['male', 'female'] };
  } else if (hasMale) {
    filters.gender = 'male';
  } else if (hasFemale) {
    filters.gender = 'female';
  }

  //age group filter
  if (q.includes('adult')) filters.age_group = 'adult';
  if (q.includes('child')) filters.age_group = 'child';
  if (q.includes('senior')) filters.age_group = 'senior';

  //teenagers and young
  if (q.includes('young')) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  if (q.includes('teenager') || q.includes('teenagers')) {
    filters.min_age = 13;
    filters.max_age = 19;
  }

  const aboveMatch = q.match(/above (\d+)/);
  if (aboveMatch) {
    filters.min_age = Math.max(filters.min_age ?? 0, parseInt(aboveMatch[1]));
  }

  //map country
  const countryMatch = q.match(/from ([a-z\s]+?)(?:$| above| and)/);
  if (countryMatch) {
    filters.possibleCountry = countryMatch[1].trim();
  }

  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
}
