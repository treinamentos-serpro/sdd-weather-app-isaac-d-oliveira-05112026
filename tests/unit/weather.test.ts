import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  TemperatureUnit,
  Unit,
  WeatherData,
  WeatherSnapshot,
} from '../../src/types/weather';

describe('contratos de clima', () => {
  it('mantém os aliases compatíveis com os nomes do plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<TemperatureUnit>();
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<WeatherData>().toEqualTypeOf<WeatherSnapshot>();
  });

  it('aceita contexto geográfico e campos meteorológicos ausentes', () => {
    const city: City = { ...mockWeatherData.city, admin1: null, country: null };
    const current: CurrentWeather = {
      referenceTime: null,
      temperatureC: null,
      apparentTemperatureC: null,
      humidityPercent: null,
      windKmh: null,
      precipitationMm: null,
      weatherCode: null,
      modelRunAt: null,
    };
    const day: ForecastDay = {
      localDate: '2026-11-05',
      weatherCode: null,
      minimumC: null,
      maximumC: null,
    };
    const data: WeatherData = {
      ...mockWeatherData,
      city,
      current,
      forecast: [day],
    };

    expect(data.city.admin1).toBeNull();
    expect(data.city.country).toBeNull();
    expect(Object.values(data.current).every((value) => value === null)).toBe(true);
    expect(data.forecast[0].minimumC).toBeNull();
    expect(data.forecast[0].maximumC).toBeNull();
    expect(data.forecast[0].weatherCode).toBeNull();
    expectTypeOf<CurrentWeather[keyof CurrentWeather]>().extract<undefined>().toBeNever();
  });
});

describe('mockWeatherData', () => {
  it('contém uma cidade válida e clima atual nas unidades do domínio', () => {
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.city.id).not.toBe('');
    expect(Math.abs(mockWeatherData.city.latitude)).toBeLessThanOrEqual(90);
    expect(Math.abs(mockWeatherData.city.longitude)).toBeLessThanOrEqual(180);
    expect(mockWeatherData.current.temperatureC).toBe(23.4);
    expect(mockWeatherData.current.windKmh).toBe(12.6);
    expect(mockWeatherData.current.precipitationMm).toBe(0);
    expect(mockWeatherData.current.modelRunAt).toBeNull();
  });

  it('contém hoje no fuso da cidade e os quatro dias seguintes', () => {
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: mockWeatherData.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(mockWeatherData.fetchedAt));

    expect(mockWeatherData.forecast).toHaveLength(5);
    expect(mockWeatherData.forecast[0].localDate).toBe(localDate);
    expect(mockWeatherData.forecast.map((day) => day.localDate)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
    ]);
    for (const day of mockWeatherData.forecast) {
      expect(day.minimumC).toBeLessThanOrEqual(day.maximumC as number);
      expect(day.weatherCode).not.toBeNull();
    }
  });

  it('mantém horários UTC coerentes sem inventar a execução do modelo', () => {
    expect(mockWeatherData.current.referenceTime).toBe('2026-11-05T13:00:00.000Z');
    const age =
      Date.parse(mockWeatherData.fetchedAt) -
      Date.parse(mockWeatherData.current.referenceTime as string);

    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});
