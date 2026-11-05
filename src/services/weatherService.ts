import type { City } from '../types/weather';

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

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new WeatherServiceError('Não foi possível buscar cidades.', response.status);
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
    throw new WeatherServiceError('Não foi possível buscar cidades.', undefined, { cause: error });
  }
}
