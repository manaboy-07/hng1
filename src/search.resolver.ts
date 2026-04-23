export function parseQuery(q: string) {
  q = q.toLowerCase().trim();

  const filters: any = {};
  const words = q.split(/\s+/);

  const hasMale = words.includes('male') || words.includes('males');
  const hasFemale = words.includes('female') || words.includes('females');

  if (hasMale && hasFemale) {
    filters.gender = { in: ['male', 'female'] };
  } else if (hasMale) {
    filters.gender = 'male';
  } else if (hasFemale) {
    filters.gender = 'female';
  }

  if (words.includes('adult')) filters.age_group = 'adult';
  if (words.includes('child')) filters.age_group = 'child';
  if (words.includes('senior')) filters.age_group = 'senior';

  if (words.includes('young')) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  if (words.includes('teenager') || words.includes('teenagers')) {
    filters.min_age = 13;
    filters.max_age = 19;
  }

  const aboveMatch = q.match(/above (\d+)/);
  if (aboveMatch) {
    filters.min_age = Math.max(filters.min_age ?? 0, Number(aboveMatch[1]));
  }

  const countryMatch = q.match(/from ([a-z\s]+?)(?:$| above| and)/);

  if (countryMatch) {
    filters.possibleCountry = countryMatch[1].trim();
  }

  return Object.keys(filters).length ? filters : null;
}
