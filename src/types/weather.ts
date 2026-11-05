export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type Unit = TemperatureUnit;

export interface City {
  id: string;
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  referenceTime: string | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  windKmh: number | null;
  precipitationMm: number | null;
  weatherCode: number | null;
  modelRunAt: string | null;
}

export interface ForecastDay {
  localDate: string;
  weatherCode: number | null;
  minimumC: number | null;
  maximumC: number | null;
}

export interface WeatherSnapshot {
  city: City;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: string;
}

export type WeatherData = WeatherSnapshot;
