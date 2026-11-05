import { mockWeatherData } from '../mocks/weather';
import type { WeatherData } from '../types/weather';

function normalizeCity(name: string): string {
  return name
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export async function getMockWeather(city: string): Promise<WeatherData | null> {
  const query = normalizeCity(city);
  if (!query) return null;
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  return normalizeCity(mockWeatherData.city.name).includes(query) ? mockWeatherData : null;
}
