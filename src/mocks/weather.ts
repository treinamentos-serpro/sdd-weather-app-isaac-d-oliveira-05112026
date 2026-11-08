import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 'sao-paulo:-23.5475:-46.63611',
    name: 'São Paulo',
    admin1: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5475,
    longitude: -46.63611,
  },
  timezone: 'America/Sao_Paulo',
  current: {
    referenceTime: '2026-11-05T13:00:00.000Z',
    temperatureC: 23.4,
    apparentTemperatureC: 24.1,
    humidityPercent: 72,
    windKmh: 12.6,
    precipitationMm: 0,
    weatherCode: 2,
    modelRunAt: null,
  },
  forecast: [
    { localDate: '2026-11-05', weatherCode: 2, minimumC: 16.2, maximumC: 25.1 },
    { localDate: '2026-11-06', weatherCode: 61, minimumC: 17, maximumC: 23.8 },
    { localDate: '2026-11-07', weatherCode: 3, minimumC: 16.5, maximumC: 24.2 },
    { localDate: '2026-11-08', weatherCode: 1, minimumC: 18.1, maximumC: 27.6 },
    { localDate: '2026-11-09', weatherCode: 0, minimumC: 19.3, maximumC: 29.4 },
  ],
  fetchedAt: '2026-11-05T13:05:00.000Z',
};
