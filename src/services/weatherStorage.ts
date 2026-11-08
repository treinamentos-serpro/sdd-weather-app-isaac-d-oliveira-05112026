import type { City, WeatherData } from '../types/weather';

const CACHE_KEY = 'weather-app-cache';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

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
