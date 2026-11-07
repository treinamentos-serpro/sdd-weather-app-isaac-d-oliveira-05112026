import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  getWeatherByName,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

afterEach(() => vi.unstubAllGlobals());

const city: City = {
  id: 'sao-paulo',
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5,
  longitude: -46.6,
};

const forecastResponse = {
  timezone: 'America/Sao_Paulo',
  utc_offset_seconds: -10_800,
  current: {
    time: '2026-11-05T10:00',
    temperature_2m: 18.4,
    apparent_temperature: 19.1,
    relative_humidity_2m: 72,
    wind_speed_10m: 12.6,
    precipitation: 0,
    weather_code: 2,
  },
  daily: {
    time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
    weather_code: [2, 61, 3, 1, 0],
    temperature_2m_min: [16.2, 17, 16.5, 18.1, 19.3],
    temperature_2m_max: [25.1, 23.8, 24.2, 27.6, 29.4],
  },
};

describe('getWeather', () => {
  it('mapeia clima atual e cinco dias', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(forecastResponse));
    vi.stubGlobal('fetch', fetchMock);

    const weather = await getWeather(city);

    expect(weather.city).toEqual(city);
    expect(weather.timezone).toBe('America/Sao_Paulo');
    expect(weather.current).toEqual({
      referenceTime: '2026-11-05T13:00:00.000Z',
      temperatureC: 18.4,
      apparentTemperatureC: 19.1,
      humidityPercent: 72,
      windKmh: 12.6,
      precipitationMm: 0,
      weatherCode: 2,
      modelRunAt: null,
    });

    expect(weather.forecast).toEqual([
      { localDate: '2026-11-05', weatherCode: 2, minimumC: 16.2, maximumC: 25.1 },
      { localDate: '2026-11-06', weatherCode: 61, minimumC: 17, maximumC: 23.8 },
      { localDate: '2026-11-07', weatherCode: 3, minimumC: 16.5, maximumC: 24.2 },
      { localDate: '2026-11-08', weatherCode: 1, minimumC: 18.1, maximumC: 27.6 },
      { localDate: '2026-11-09', weatherCode: 0, minimumC: 19.3, maximumC: 29.4 },
    ]);
    expect(weather.fetchedAt).toEqual(expect.any(String));
  });

  describe('getWeatherByName', () => {
    it('consulta a previsão para uma correspondência única com contexto completo', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ results: [city] }))
        .mockResolvedValueOnce(Response.json(forecastResponse));
      vi.stubGlobal('fetch', fetchMock);

      const weather = await getWeatherByName('São Paulo');

      expect(weather?.city.name).toBe('São Paulo');
      expect(weather?.current.temperatureC).toBe(18.4);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toContain('latitude=-23.5&longitude=-46.6');
    });

    it('não consulta a previsão se não houver resultados', async () => {
      const fetchMock = vi.fn().mockResolvedValue(Response.json({ results: [] }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getWeatherByName('Inexistente')).resolves.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      [city, { ...city, name: 'Outra cidade' }],
      [{ ...city, admin1: null }],
      [{ ...city, country: ' ' }],
    ])('recusa resultados ambíguos ou incompletos: %j', async (...results) => {
      const fetchMock = vi.fn().mockResolvedValue(Response.json({ results }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getWeatherByName('cidade')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: expect.stringContaining('contexto único'),
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ['current', { ...forecastResponse, current: undefined }],
    ['daily', { ...forecastResponse, daily: undefined }],
  ])('lança WeatherServiceError quando %s está ausente', async (_missing, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('preserva campos ausentes como null sem inventar valores ou dias', async () => {
    const partialResponse = {
      ...forecastResponse,
      current: {
        ...forecastResponse.current,
        temperature_2m: null,
        apparent_temperature: undefined,
        precipitation: null,
      },
      daily: {
        ...forecastResponse.daily,
        weather_code: [2],
        temperature_2m_min: [null, 17],
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(partialResponse)));

    const weather = await getWeather(city);

    expect(weather.current.temperatureC).toBeNull();
    expect(weather.current.apparentTemperatureC).toBeNull();
    expect(weather.current.precipitationMm).toBeNull();
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[0]).toEqual({
      localDate: '2026-11-05',
      weatherCode: 2,
      minimumC: null,
      maximumC: 25.1,
    });
    expect(weather.forecast[1]).toEqual({
      localDate: '2026-11-06',
      weatherCode: null,
      minimumC: 17,
      maximumC: 23.8,
    });
  });

  it.each([429, 500])('lança erro tipado para HTTP %s sem repetir a chamada', async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('encapsula falha de rede em WeatherServiceError', async () => {
    const networkError = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      cause: networkError,
    });
  });

  it('aborta a consulta de forecast após cinco segundos', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const timeoutMock = vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      setTimeout(() => controller.abort(), delay);
      return controller.signal;
    });
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new DOMException('Timeout', 'TimeoutError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      const assertion = expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
      await vi.advanceTimersByTimeAsync(5000);
      await assertion;
      expect(timeoutMock).toHaveBeenCalledWith(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      timeoutMock.mockRestore();
      vi.useRealTimers();
    }
  });
});
