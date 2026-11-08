import type { City, WeatherData } from '../types/weather';
import { isCurrentReferenceTime } from '../lib/weatherTime';

export const WEATHER_TIMEOUT_MS = 5000;

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions & { retryAt?: number; city?: City },
  ) {
    super(message, options);
    this.name = 'WeatherServiceError';
    this.retryAt = options?.retryAt;
    this.city = options?.city;
  }

  readonly retryAt?: number;
  readonly city?: City;
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

const currentFields =
  'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code';
const dailyFields = 'weather_code,temperature_2m_min,temperature_2m_max';

export type WeatherLookupResult = WeatherData | City[] | null;
type Clock = number | (() => number);

function createRequestSignal(signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(WEATHER_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validCoordinates(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
  );
}

function retryAt(response: Response): number {
  const now = Date.now();
  const header = response.headers?.get('Retry-After')?.trim();
  if (header && /^\d+$/.test(header)) {
    const deadline = now + Number(header) * 1000;
    if (Number.isFinite(deadline)) return deadline;
  }
  const httpDate =
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
  const obsoleteHttpDate =
    /^(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2} \d{2}:\d{2}:\d{2} GMT|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (?: \d|\d{2}) \d{2}:\d{2}:\d{2} \d{4})$/;
  if (header && (httpDate.test(header) || obsoleteHttpDate.test(header))) {
    const deadline = Date.parse(header);
    if (Number.isFinite(deadline)) return Math.max(now, deadline);
  }
  return now + 60_000;
}

function httpError(response: Response, message: string, city?: City): WeatherServiceError {
  return new WeatherServiceError(
    response.status === 429
      ? 'O serviço recebeu muitas consultas. Aguarde um momento antes de tentar novamente.'
      : message,
    response.status,
    { retryAt: response.status === 429 ? retryAt(response) : undefined, city },
  );
}

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
    !Number.isInteger(offsetSeconds) ||
    Math.abs(offsetSeconds) > 86400
  ) {
    throw new WeatherServiceError('Resposta de previsão incompleta ou inválida.');
  }

  const localTime = value.length === 16 ? `${value}:00` : value;
  const utcTime = Date.parse(`${localTime}Z`);
  if (!Number.isFinite(utcTime) || new Date(utcTime).toISOString().slice(0, 19) !== localTime) {
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

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;

  try {
    const response = await fetch(url, {
      signal: createRequestSignal(signal),
    });
    if (!response.ok) {
      throw httpError(
        response,
        'Não foi possível buscar cidades. Tente novamente em alguns instantes.',
      );
    }

    const data: unknown = await response.json();
    if (!isRecord(data) || (data.results !== undefined && !Array.isArray(data.results))) {
      throw new WeatherServiceError('Resposta de busca inválida.');
    }
    const results: unknown[] = (data.results ?? []).slice(0, 10);
    return results.flatMap((result): City[] => {
      if (
        !isRecord(result) ||
        typeof result.name !== 'string' ||
        !result.name.trim() ||
        typeof result.latitude !== 'number' ||
        typeof result.longitude !== 'number' ||
        !validCoordinates(result.latitude, result.longitude)
      )
        return [];
      const { name, latitude, longitude } = result;
      const admin1 = typeof result.admin1 === 'string' ? result.admin1 : null;
      const country = typeof result.country === 'string' ? result.country : null;
      return [
        {
          id: JSON.stringify([name, admin1, country, latitude, longitude]),
          name,
          admin1,
          country,
          latitude,
          longitude,
        },
      ];
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

export async function getWeatherByName(
  name: string,
  signal?: AbortSignal,
  onCity?: (city: City) => void,
  now: Clock = () => Date.now(),
): Promise<WeatherLookupResult> {
  const requestSignal = createRequestSignal(signal);
  const cities = await searchCities(name, requestSignal);
  if (cities.length === 0) return null;
  const query = name.trim().toLocaleLowerCase('pt-BR');
  const orderedCities = cities
    .map((city, index) => ({ city, index }))
    .sort((left, right) => {
      const priority = (city: City) => {
        const cityName = city.name.toLocaleLowerCase('pt-BR');
        if (cityName === query) return 0;
        if (cityName.startsWith(query)) return 1;
        return 2;
      };
      return priority(left.city) - priority(right.city) || left.index - right.index;
    })
    .map(({ city }) => city);
  if (
    orderedCities.length !== 1 ||
    !orderedCities[0].admin1?.trim() ||
    !orderedCities[0].country?.trim()
  ) {
    return orderedCities;
  }
  const city = orderedCities[0];
  requestSignal.throwIfAborted();
  onCity?.(city);
  return getWeather(city, requestSignal, now);
}

export async function getWeather(
  city: City,
  signal?: AbortSignal,
  now: Clock = () => Date.now(),
): Promise<WeatherData> {
  if (!validCoordinates(city.latitude, city.longitude)) {
    throw new WeatherServiceError('Coordenadas da cidade inválidas.', undefined, { city });
  }
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
    const response = await fetch(url, {
      signal: createRequestSignal(signal),
    });
    if (!response.ok) {
      throw httpError(
        response,
        'Não foi possível consultar a previsão. Tente novamente em alguns instantes.',
        city,
      );
    }

    const data: unknown = await response.json();
    if (
      !isRecord(data) ||
      !isRecord(data.current) ||
      !isRecord(data.daily) ||
      !isValidTimezone(data.timezone)
    ) {
      throw new WeatherServiceError('Resposta de previsão incompleta ou inválida.');
    }

    const { current, daily } = data;
    const dailyTimes: unknown[] = Array.isArray(daily.time) ? daily.time.slice(0, 5) : [];
    const forecast = dailyTimes
      .map((localDate, index) => {
        if (typeof localDate !== 'string') return null;
        return {
          localDate,
          weatherCode: arrayNumber(daily.weather_code, index),
          minimumC: arrayNumber(daily.temperature_2m_min, index),
          maximumC: arrayNumber(daily.temperature_2m_max, index),
        };
      })
      .filter((day) => day !== null);

    const referenceTime = normalizeReferenceTime(current.time, data.utc_offset_seconds);
    const evaluatedAt = typeof now === 'function' ? now() : now;
    if (!isCurrentReferenceTime(referenceTime, evaluatedAt)) {
      throw new WeatherServiceError(
        'Os dados do clima estão desatualizados ou não podem ser confirmados.',
        undefined,
        { city },
      );
    }

    return {
      city,
      timezone: data.timezone,
      current: {
        referenceTime,
        temperatureC: finiteNumber(current.temperature_2m),
        apparentTemperatureC: finiteNumber(current.apparent_temperature),
        humidityPercent: finiteNumber(current.relative_humidity_2m),
        windKmh: finiteNumber(current.wind_speed_10m),
        precipitationMm: finiteNumber(current.precipitation),
        weatherCode: finiteNumber(current.weather_code),
        modelRunAt: null,
      },
      forecast,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof WeatherServiceError && error.city) throw error;
    throw new WeatherServiceError(
      getWeatherErrorMessage(error, 'Não foi possível consultar a previsão. Tente novamente.'),
      error instanceof WeatherServiceError ? error.status : undefined,
      {
        cause: error,
        retryAt: error instanceof WeatherServiceError ? error.retryAt : undefined,
        city,
      },
    );
  }
}
