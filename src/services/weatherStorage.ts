import type { City, Preferences, TemperatureUnit, WeatherData } from '../types/weather';

const CACHE_KEY = 'weather-app-cache';
const PREFERENCES_KEY = 'weather-app-preferences';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const DEFAULT_PREFERENCES: Preferences = { lastCity: null, temperatureUnit: 'celsius' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableNumber(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function validCity(value: unknown): value is City {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    nullableString(value.admin1) &&
    nullableString(value.country) &&
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180
  );
}

function validTemperatureUnit(value: unknown): value is TemperatureUnit {
  return value === 'celsius' || value === 'fahrenheit';
}

export function readWeatherPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return DEFAULT_PREFERENCES;
    return {
      lastCity: validCity(parsed.lastCity) ? parsed.lastCity : null,
      temperatureUnit: validTemperatureUnit(parsed.temperatureUnit)
        ? parsed.temperatureUnit
        : 'celsius',
    };
  } catch {
    console.warn('Não foi possível ler as preferências meteorológicas.');
    return DEFAULT_PREFERENCES;
  }
}

export function updateWeatherPreferences(updates: Partial<Preferences>): void {
  try {
    const preferences = { ...readWeatherPreferences(), ...updates };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    console.warn('Não foi possível armazenar as preferências meteorológicas.');
  }
}

function validSnapshot(value: unknown): value is WeatherData {
  if (!isRecord(value) || !isRecord(value.city) || !isRecord(value.current)) return false;
  const { city, current } = value;
  if (
    typeof city.id !== 'string' ||
    !city.id ||
    typeof city.name !== 'string' ||
    !city.name.trim() ||
    !nullableString(city.admin1) ||
    !nullableString(city.country) ||
    typeof city.latitude !== 'number' ||
    !Number.isFinite(city.latitude) ||
    Math.abs(city.latitude) > 90 ||
    typeof city.longitude !== 'number' ||
    !Number.isFinite(city.longitude) ||
    Math.abs(city.longitude) > 180 ||
    typeof value.timezone !== 'string' ||
    !value.timezone ||
    !validTimestamp(value.fetchedAt) ||
    !validTimestamp(current.referenceTime) ||
    !nullableString(current.modelRunAt) ||
    ![
      'temperatureC',
      'apparentTemperatureC',
      'humidityPercent',
      'windKmh',
      'precipitationMm',
      'weatherCode',
    ].every((key) => nullableNumber(current[key])) ||
    !Array.isArray(value.forecast) ||
    !value.forecast.every(
      (day: unknown) =>
        isRecord(day) &&
        typeof day.localDate === 'string' &&
        nullableNumber(day.weatherCode) &&
        nullableNumber(day.minimumC) &&
        nullableNumber(day.maximumC),
    )
  )
    return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value.timezone });
    return true;
  } catch {
    return false;
  }
}

export function saveWeatherCache(snapshot: WeatherData): void {
  if (!validSnapshot(snapshot)) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ snapshot, storedAt: Date.now() }));
  } catch {
    console.warn('Não foi possível armazenar o cache meteorológico.');
  }
}

export function readWeatherCache(city: City, now = Date.now()): WeatherData | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const entry: unknown = JSON.parse(raw);
    if (!isRecord(entry) || typeof entry.storedAt !== 'number' || !Number.isFinite(entry.storedAt))
      return undefined;
    const age = now - entry.storedAt;
    if (age < 0 || age > CACHE_TTL_MS || !validSnapshot(entry.snapshot)) return undefined;
    const snapshot = entry.snapshot;
    if (
      snapshot.city.id !== city.id ||
      snapshot.city.latitude !== city.latitude ||
      snapshot.city.longitude !== city.longitude ||
      !snapshot.current.referenceTime ||
      Date.parse(snapshot.current.referenceTime) > now
    )
      return undefined;
    return snapshot;
  } catch {
    console.warn('Não foi possível ler o cache meteorológico.');
    return undefined;
  }
}
