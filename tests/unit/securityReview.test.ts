import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import {
  getWeather,
  getWeatherByName,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import {
  readWeatherCache,
  readWeatherPreferences,
  saveWeatherCache,
  updateWeatherPreferences,
} from '../../src/services/weatherStorage';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('validação do provedor', () => {
  it.each([null, [], { results: {} }])('rejeita estrutura inválida de busca: %j', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(searchCities('cidade')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('descarta resultados malformados e normaliza contexto inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          results: [null, 1, { name: 'Cidade', latitude: 0, longitude: 0, admin1: 1 }],
        }),
      ),
    );
    await expect(searchCities('cidade')).resolves.toMatchObject([{ name: 'Cidade', admin1: null }]);
  });

  it.each([
    null,
    [],
    { current: [], daily: {}, timezone: 'UTC' },
  ])('rejeita estrutura inválida de previsão: %j', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(getWeather(mockWeatherData.city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('não chama a rede com coordenadas fora dos limites', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(getWeather({ ...mockWeatherData.city, latitude: 91 })).rejects.toThrow(
      'Coordenadas',
    );
    await expect(getWeather({ ...mockWeatherData.city, longitude: Number.NaN })).rejects.toThrow(
      'Coordenadas',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('limite temporário', () => {
  it.each([
    ['10', 10_000],
    ['Thu, 05 Nov 2026 13:01:30 GMT', 90_000],
    [undefined, 60_000],
    ['inválido', 60_000],
    ['-1', 60_000],
    ['0.5', 60_000],
  ])('interpreta Retry-After %s', async (header, expectedDelay) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T13:00:00Z'));
    const headers = header ? { 'Retry-After': header } : undefined;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429, headers })));
    await expect(searchCities('cidade')).rejects.toMatchObject({
      status: 429,
      retryAt: Date.now() + expectedDelay,
    });
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      status: 429,
      retryAt: Date.now() + expectedDelay,
    });
  });

  it('bloqueia retry até o prazo, inclusive ao submeter a mesma busca', async () => {
    vi.useFakeTimers();
    const loadWeather = vi
      .fn()
      .mockRejectedValue(
        new WeatherServiceError('Limite temporário', 429, { retryAt: Date.now() + 60_000 }),
      );
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );
    await act(async () => {
      await result.current.search('Cidade');
    });
    expect(result.current.retryBlocked).toBe(true);
    await act(async () => {
      await result.current.retry();
      await result.current.search('Cidade');
      await vi.advanceTimersByTimeAsync(59_999);
    });
    expect(loadWeather).toHaveBeenCalledTimes(1);
    expect(result.current.retryBlocked).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.retryBlocked).toBe(false);
    await act(async () => {
      await result.current.retry();
    });
    expect(loadWeather).toHaveBeenCalledTimes(2);
  });

  it('mantém o bloqueio da consulta original após pesquisar outra cidade', async () => {
    vi.useFakeTimers();
    const loadWeather = vi
      .fn()
      .mockRejectedValueOnce(
        new WeatherServiceError('Limite temporário', 429, { retryAt: Date.now() + 60_000 }),
      )
      .mockResolvedValueOnce(null);
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );
    await act(async () => {
      await result.current.search('Cidade A');
      await result.current.search('Cidade B');
    });
    await act(async () => {
      await result.current.search('Cidade A');
    });
    expect(loadWeather).toHaveBeenCalledTimes(2);
    expect(result.current.state).toMatchObject({ status: 'error', query: 'Cidade A' });
    expect(result.current.retryBlocked).toBe(true);
  });
});

describe('cancelamento', () => {
  it('aceita resposta válida exatamente no limite de cinco segundos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T13:05:00Z'));
    const loadWeather = () =>
      new Promise<typeof mockWeatherData>((resolve) => {
        setTimeout(() => resolve(mockWeatherData), 5_000);
      });
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );
    act(() => {
      void result.current.search('São Paulo');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(result.current.state.status).toBe('success');
  });

  it('aborta o forecast no prazo total após geocoding e não usa resposta tardia', async () => {
    vi.useFakeTimers();
    let forecastSignal: AbortSignal | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        return Response.json({ results: [mockWeatherData.city] });
      })
      .mockImplementationOnce((_url: string, options: RequestInit) => {
        forecastSignal = options.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          forecastSignal?.addEventListener('abort', () => reject(forecastSignal?.reason));
        });
      });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather: getWeatherByName }),
    );
    act(() => {
      void result.current.search('São Paulo');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(forecastSignal?.aborted).toBe(true);
    expect(result.current.state).toMatchObject({
      status: 'error',
      message: expect.stringContaining('5 segundos'),
    });
  });

  it('aborta a requisição ao desmontar', async () => {
    let signal: AbortSignal | undefined;
    const loadWeather = vi.fn((_city: string, supplied?: AbortSignal) => {
      signal = supplied;
      return new Promise<null>(() => {});
    });
    const { result, unmount } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );
    act(() => {
      void result.current.search('Cidade');
    });
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});

describe('cache de fallback', () => {
  it('aceita a mesma cidade até três horas e rejeita idade negativa ou superior', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T13:05:00Z'));
    saveWeatherCache(mockWeatherData);
    const now = Date.now();
    expect(readWeatherCache(mockWeatherData.city, now)).toEqual(mockWeatherData);
    expect(readWeatherCache(mockWeatherData.city, now + 3 * 60 * 60 * 1000)).toEqual(
      mockWeatherData,
    );
    expect(readWeatherCache(mockWeatherData.city, now + 3 * 60 * 60 * 1000 + 1)).toBeUndefined();
    expect(readWeatherCache(mockWeatherData.city, now - 1)).toBeUndefined();
    expect(readWeatherCache({ ...mockWeatherData.city, id: 'outra' }, now)).toBeUndefined();
  });

  it('rejeita cache corrompido e timestamp futuro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T13:05:00Z'));
    localStorage.setItem('weather-app-cache', '{');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readWeatherCache(mockWeatherData.city)).toBeUndefined();
    expect(warning).toHaveBeenCalled();
    saveWeatherCache({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, referenceTime: '2026-11-06T00:00:00Z' },
    });
    expect(readWeatherCache(mockWeatherData.city)).toBeUndefined();
  });

  it('mantém o erro e mostra somente fallback elegível da cidade consultada', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T13:05:00Z'));
    saveWeatherCache(mockWeatherData);
    const loadWeather = vi
      .fn()
      .mockRejectedValue(
        new WeatherServiceError('Indisponível', 503, { city: mockWeatherData.city }),
      );
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );
    await act(async () => {
      await result.current.search('São Paulo');
    });
    expect(result.current.state).toMatchObject({ status: 'error', fallback: mockWeatherData });
  });
});

describe('preferências locais', () => {
  it('usa Celsius e nenhuma cidade quando não há dados salvos', () => {
    expect(readWeatherPreferences()).toEqual({ lastCity: null, temperatureUnit: 'celsius' });
  });

  it('persiste cidade e unidade e valida valores inválidos', () => {
    updateWeatherPreferences({ lastCity: mockWeatherData.city, temperatureUnit: 'fahrenheit' });
    expect(readWeatherPreferences()).toEqual({
      lastCity: mockWeatherData.city,
      temperatureUnit: 'fahrenheit',
    });

    localStorage.setItem(
      'weather-app-preferences',
      JSON.stringify({ lastCity: { ...mockWeatherData.city, latitude: 91 }, temperatureUnit: 'kelvin' }),
    );
    expect(readWeatherPreferences()).toEqual({ lastCity: null, temperatureUnit: 'celsius' });
  });

  it('não impede o uso quando localStorage está indisponível ou corrompido', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('weather-app-preferences', '{');
    expect(readWeatherPreferences()).toEqual({ lastCity: null, temperatureUnit: 'celsius' });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    expect(() => updateWeatherPreferences({ temperatureUnit: 'fahrenheit' })).not.toThrow();
    expect(warning).toHaveBeenCalled();
  });
});
