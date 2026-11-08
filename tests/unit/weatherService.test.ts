import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  getWeatherByName,
  searchCities,
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
const referenceNow = Date.parse('2026-11-05T13:00:00.000Z');

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

    const weather = await getWeather(city, undefined, referenceNow);

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

      const weather = await getWeatherByName('São Paulo', undefined, undefined, referenceNow);

      if (!weather || Array.isArray(weather))
        throw new Error('Era esperado o retorno da previsão.');
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

    it('limita resultados de geocoding a dez mesmo se o provedor enviar mais', async () => {
      const results = Array.from({ length: 12 }, (_, index) => ({
        ...city,
        id: index,
        name: `Cidade ${index}`,
      }));
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ results })));

      await expect(searchCities('Cidade')).resolves.toHaveLength(10);
    });

    it.each([
      [city, { ...city, name: 'Outra cidade' }],
      [{ ...city, admin1: null }],
      [{ ...city, country: ' ' }],
    ])('retorna opções quando há ambiguidade ou contexto incompleto: %j', async (...results) => {
      const fetchMock = vi.fn().mockResolvedValue(Response.json({ results }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getWeatherByName('cidade')).resolves.toMatchObject(
        results.map((result) => ({ name: result.name })),
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('ordena correspondência exata antes de prefixo e parcial, mantendo empates estáveis', async () => {
      const exact = { ...city, name: 'Pinhais' };
      const prefix = { ...city, id: 'prefix', name: 'Pinhais do Sul' };
      const partial = { ...city, id: 'partial', name: 'São Pinhais' };
      const otherExact = { ...city, id: 'other-exact', name: 'Pinhais' };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ results: [partial, exact, prefix, otherExact] }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getWeatherByName('Pinhais')).resolves.toMatchObject([
        { name: exact.name },
        { name: otherExact.name },
        { name: prefix.name },
        { name: partial.name },
      ]);
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

    const weather = await getWeather(city, undefined, referenceNow);

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

  it('limita o forecast a cinco registros mesmo se o provedor enviar mais', async () => {
    const extendedResponse = {
      ...forecastResponse,
      daily: {
        ...forecastResponse.daily,
        time: [...forecastResponse.daily.time, '2026-11-10', '2026-11-11'],
        weather_code: [...forecastResponse.daily.weather_code, 2, 3],
        temperature_2m_min: [...forecastResponse.daily.temperature_2m_min, 12, 13],
        temperature_2m_max: [...forecastResponse.daily.temperature_2m_max, 20, 21],
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(extendedResponse)));

    const result = await getWeather(city, undefined, referenceNow);

    expect(result.forecast).toHaveLength(5);
    expect(result.forecast.map((day) => day.localDate)).toEqual(forecastResponse.daily.time);
  });

  it('aceita timestamp com exatamente 60 minutos e rejeita dados antigos ou futuros', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(Response.json(forecastResponse))));
    await expect(getWeather(city, undefined, referenceNow + 60 * 60 * 1000)).resolves.toBeDefined();
    await expect(getWeather(city, undefined, referenceNow + 60 * 60 * 1000 + 1)).rejects.toMatchObject(
      { city, message: expect.stringContaining('desatualizados') },
    );
    await expect(getWeather(city, undefined, referenceNow - 1)).rejects.toMatchObject({
      city,
      message: expect.stringContaining('desatualizados'),
    });
  });

  it('avalia a atualidade quando a resposta chega, não no início da chamada', async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchMock = vi.fn(
      () => new Promise<Response>((resolve) => (resolveResponse = resolve)),
    );
    vi.stubGlobal('fetch', fetchMock);
    let now = referenceNow + 60 * 60 * 1000;
    const request = getWeather(city, undefined, () => now);

    now += 1;
    resolveResponse(Response.json(forecastResponse));

    await expect(request).rejects.toMatchObject({
      message: expect.stringContaining('desatualizados'),
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

  it('aplica timeout de cinco segundos mesmo com sinal externo sem prazo', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const timeoutController = new AbortController();
    const timeoutMock = vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      setTimeout(
        () => timeoutController.abort(new DOMException('Timeout', 'TimeoutError')),
        delay,
      );
      return timeoutController.signal;
    });
    const fetchMock = vi.fn((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
          once: true,
        });
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      const geocoding = expect(searchCities('São Paulo', controller.signal)).rejects.toMatchObject({
        message: expect.stringContaining('5 segundos'),
      });
      const forecast = expect(getWeather(city, controller.signal)).rejects.toMatchObject({
        message: expect.stringContaining('5 segundos'),
      });
      await vi.advanceTimersByTimeAsync(5000);
      await Promise.all([geocoding, forecast]);

      expect(timeoutMock).toHaveBeenCalledTimes(2);
      expect(controller.signal.aborted).toBe(false);
    } finally {
      timeoutMock.mockRestore();
      vi.useRealTimers();
    }
  });
});
