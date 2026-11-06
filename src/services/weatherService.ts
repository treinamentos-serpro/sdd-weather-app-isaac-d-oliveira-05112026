import type { City, WeatherData } from '../types/weather';

export const WEATHER_TIMEOUT_MS = 5000;

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'WeatherServiceError';
  }
}

export function getWeatherErrorMessage(
  error: unknown,
  fallback = 'Não foi possível carregar os dados do clima. Tente novamente.',
): string {
  if (error instanceof WeatherServiceError) return error.message;
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'A consulta demorou mais de 5 segundos. Tente novamente.';
  }
  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.';
  }
  if (error instanceof SyntaxError) {
    return 'O serviço de clima enviou uma resposta inválida. Tente novamente.';
  }
  return fallback;
}

interface GeocodingResult {
  name: string;
  admin1?: string | null;
  country?: string | null;
  latitude: number;
  longitude: number;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  timezone?: string;
  utc_offset_seconds?: number;
  current?: Record<string, unknown>;
  daily?: Record<string, unknown>;
}

const currentFields =
  'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code';
const dailyFields = 'weather_code,temperature_2m_min,temperature_2m_max';

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function arrayNumber(values: unknown, index: number): number | null {
  return Array.isArray(values) ? finiteNumber(values[index]) : null;
}

function normalizeReferenceTime(value: unknown, offsetSeconds: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) ||
    typeof offsetSeconds !== 'number' ||
    !Number.isFinite(offsetSeconds)
  ) {
    throw new WeatherServiceError('Resposta de previsão incompleta ou inválida.');
  }

  const utcTime = Date.parse(`${value.length === 16 ? `${value}:00` : value}Z`);
  if (!Number.isFinite(utcTime)) {
    throw new WeatherServiceError('Resposta de previsão incompleta ou inválida.');
  }
  return new Date(utcTime - offsetSeconds * 1000).toISOString();
}

function isValidTimezone(timezone: unknown): timezone is string {
  if (typeof timezone !== 'string' || !timezone) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) });
    if (!response.ok) {
      throw new WeatherServiceError(
        response.status === 429
          ? 'O serviço recebeu muitas consultas. Aguarde um momento antes de tentar novamente.'
          : 'Não foi possível buscar cidades. Tente novamente em alguns instantes.',
        response.status,
      );
    }

    const data: GeocodingResponse = await response.json();
    return (data.results ?? [])
      .filter(
        (result) =>
          typeof result.name === 'string' &&
          result.name.trim().length > 0 &&
          Number.isFinite(result.latitude) &&
          Math.abs(result.latitude) <= 90 &&
          Number.isFinite(result.longitude) &&
          Math.abs(result.longitude) <= 180,
      )
      .map((result) => {
        const admin1 = result.admin1 ?? null;
        const country = result.country ?? null;
        return {
          id: JSON.stringify([result.name, admin1, country, result.latitude, result.longitude]),
          name: result.name,
          admin1,
          country,
          latitude: result.latitude,
          longitude: result.longitude,
        };
      });
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError(
      getWeatherErrorMessage(error, 'Não foi possível buscar cidades. Tente novamente.'),
      undefined,
      { cause: error },
    );
  }
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: currentFields,
    daily: dailyFields,
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    forecast_days: '5',
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) });
    if (!response.ok) {
      throw new WeatherServiceError(
        response.status === 429
          ? 'O serviço recebeu muitas consultas. Aguarde um momento antes de tentar novamente.'
          : 'Não foi possível consultar a previsão. Tente novamente em alguns instantes.',
        response.status,
      );
    }

    const data = (await response.json()) as ForecastResponse;
    if (!data.current || !data.daily || !isValidTimezone(data.timezone)) {
      throw new WeatherServiceError('Resposta de previsão incompleta ou inválida.');
    }

    const dailyTimes = Array.isArray(data.daily.time) ? data.daily.time : [];
    const forecast = dailyTimes
      .map((localDate, index) => {
        if (typeof localDate !== 'string') return null;
        return {
          localDate,
          weatherCode: arrayNumber(data.daily?.weather_code, index),
          minimumC: arrayNumber(data.daily?.temperature_2m_min, index),
          maximumC: arrayNumber(data.daily?.temperature_2m_max, index),
        };
      })
      .filter((day) => day !== null);

    return {
      city,
      timezone: data.timezone,
      current: {
        referenceTime: normalizeReferenceTime(data.current.time, data.utc_offset_seconds),
        temperatureC: finiteNumber(data.current.temperature_2m),
        apparentTemperatureC: finiteNumber(data.current.apparent_temperature),
        humidityPercent: finiteNumber(data.current.relative_humidity_2m),
        windKmh: finiteNumber(data.current.wind_speed_10m),
        precipitationMm: finiteNumber(data.current.precipitation),
        weatherCode: finiteNumber(data.current.weather_code),
        modelRunAt: null,
      },
      forecast,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError(
      getWeatherErrorMessage(error, 'Não foi possível consultar a previsão. Tente novamente.'),
      undefined,
      { cause: error },
    );
  }
}
