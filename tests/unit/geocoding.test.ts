import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => vi.unstubAllGlobals());

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('não chama a rede para entrada vazia %j', async (query) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(query)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('apara e codifica o nome, mantendo acentos e pontuação', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const query = "São João-d'Aliança & região";

    await searchCities(`  ${query}  `);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('mapeia resultados para City com contexto opcional e ID interno estável', async () => {
    const results = [
      {
        id: 123,
        name: 'São Paulo',
        admin1: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5,
        longitude: -46.6,
      },
      { name: 'Lisboa', latitude: 38.7, longitude: -9.1 },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(Response.json({ results }))),
    );

    const cities = await searchCities('cidade');

    expect(cities).toEqual([
      {
        id: expect.any(String),
        name: 'São Paulo',
        admin1: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5,
        longitude: -46.6,
      },
      {
        id: expect.any(String),
        name: 'Lisboa',
        admin1: null,
        country: null,
        latitude: 38.7,
        longitude: -9.1,
      },
    ]);
    expect(cities[0].id).not.toBe(cities[1].id);
    await expect(searchCities('cidade')).resolves.toEqual(cities);
  });

  it('descarta resultados sem nome ou coordenadas válidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          results: [
            { name: ' ', latitude: 0, longitude: 0 },
            { name: 'Inválida', latitude: 91, longitude: 0 },
            { name: 'Inválida', latitude: 0, longitude: -181 },
            { name: 'Inválida', longitude: 0 },
          ],
        }),
      ),
    );

    await expect(searchCities('cidade')).resolves.toEqual([]);
  });

  it.each([{}, { results: [] }])('retorna lista vazia sem resultados: %j', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));

    await expect(searchCities('cidade')).resolves.toEqual([]);
  });

  it.each([404, 429, 500])('lança erro tipado para HTTP %s sem retry', async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('cidade')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('encapsula falhas de rede em WeatherServiceError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Falha de rede')));

    await expect(searchCities('cidade')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('aborta a chamada após cinco segundos com erro tipado', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const timeoutMock = vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      setTimeout(() => controller.abort(), delay);
      return controller.signal;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () =>
              reject(new DOMException('Timeout', 'TimeoutError')),
            );
          }),
      ),
    );

    try {
      const assertion = expect(searchCities('cidade')).rejects.toBeInstanceOf(WeatherServiceError);
      await vi.advanceTimersByTimeAsync(5000);
      await assertion;
      expect(timeoutMock).toHaveBeenCalledWith(5000);
    } finally {
      timeoutMock.mockRestore();
      vi.useRealTimers();
    }
  });
});
