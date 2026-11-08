import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe.each([
  ['busca', () => searchCities('São Paulo')],
  ['previsão', () => getWeather(mockWeatherData.city)],
] as const)('falhas de %s', (_name, operation) => {
  it('informa falha de conexão, preserva a causa e não repete automaticamente', async () => {
    const cause = new TypeError('Failed to fetch');
    const fetchMock = vi.fn().mockRejectedValue(cause);
    vi.stubGlobal('fetch', fetchMock);

    await expect(operation()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: expect.stringContaining('Verifique sua conexão'),
      cause,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('informa resposta JSON inválida sem confundir com falta de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));

    await expect(operation()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'O serviço de clima enviou uma resposta inválida. Tente novamente.',
      cause: expect.any(SyntaxError),
    });
  });

  it.each([429, 503])('preserva HTTP %s e apresenta ação compreensível', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));

    await expect(operation()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status,
      message: expect.stringContaining(status === 429 ? 'Aguarde' : 'Tente novamente'),
    });
  });

  it.each(['fetch', 'json'])('aborta após cinco segundos, inclusive durante %s', async (phase) => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), delay);
      return controller.signal;
    });
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined;
        const pending = new Promise<never>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal?.reason), { once: true });
        });
        return phase === 'fetch' ? pending : Promise.resolve({ ok: true, json: () => pending });
      }),
    );

    const pending = operation();
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A consulta demorou mais de 5 segundos. Tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(4999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(signal?.aborted).toBe(true);
    await expect(pending).rejects.toBeInstanceOf(WeatherServiceError);
  });
});
