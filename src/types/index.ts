export interface GenderResponse {
  count: number;
  name: string;
  gender: 'male' | 'female' | null;
  probability: number;
}

export interface AgeResponse {
  count: number;
  name: string;
  age: number | null;
}

export interface CountryProbability {
  country_id: string;
  probability: number;
}

export interface NationalityResponse {
  count: number;
  name: string;
  country: CountryProbability[];
}

export type AgeGroup = 'child' | 'teenager' | 'senior' | 'adult' | 'unknown';

export interface ModifiedResponse {
  data: {
    name: string;
    gender: string | null;
    gender_probability: number;
    country_name: number;
    age: number | null;
    age_group: string;
    country_id: string;
    country_probability: number;
  };
}

export interface searchQuery {
  gender: any;
  min_age?: number | undefined;
  max_age?: number | undefined;
  possibleCountry?: string;
}
