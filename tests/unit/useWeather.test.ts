import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { City, WeatherData } from '../../src/types/weather';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useWeather', () => {
  it('ignora entrada vazia e retry sem erro', async () => {
    const loadWeather = vi.fn();
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );

    await act(async () => {
      await result.current.search('  ');
      await result.current.retry();
    });

    expect(loadWeather).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('idle');
  });

  it('mantém a cidade escolhida para retry do forecast sem repetir a busca ambígua', async () => {
    const city: City = {
      ...mockWeatherData.city,
      id: 'pinhais-parana',
      name: 'Pinhais',
      admin1: 'Paraná',
    };
    const loadWeather = vi.fn().mockResolvedValue([city, { ...city, id: 'pinhais-other' }]);
    const loadCityWeather = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValue({ ...mockWeatherData, city });
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather, loadCityWeather }),
    );

    await act(async () => {
      await result.current.search('Pinhais');
    });
    expect(result.current.state.status).toBe('choices');
    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(result.current.state.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(loadWeather).toHaveBeenCalledTimes(1);
    expect(loadCityWeather).toHaveBeenCalledTimes(2);
    expect(loadCityWeather).toHaveBeenLastCalledWith(city, expect.any(AbortSignal));
    expect(result.current.state).toMatchObject({ status: 'success', data: { city } });
  });

  it('encerra loading no prazo, permite retry e ignora resposta tardia da tentativa anterior', async () => {
    vi.useFakeTimers();
    let resolveFirst!: (data: WeatherData | null) => void;
    let resolveRetry!: (data: WeatherData | null) => void;
    const loadWeather = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<WeatherData | null>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<WeatherData | null>((resolve) => {
            resolveRetry = resolve;
          }),
      );
    const { result } = renderHook(() =>
      useWeather({ initialState: { status: 'idle' }, loadWeather }),
    );

    act(() => {
      void result.current.search('  São Paulo  ');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });
    expect(result.current.state.status).toBe('loading');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.state).toEqual({
      status: 'error',
      query: 'São Paulo',
      message: 'A consulta demorou mais de 5 segundos. Tente novamente.',
    });
    expect(loadWeather).toHaveBeenCalledTimes(1);

    act(() => {
      void result.current.retry();
      void result.current.retry();
    });
    expect(loadWeather).toHaveBeenCalledTimes(2);
    expect(loadWeather).toHaveBeenLastCalledWith(
      'São Paulo',
      expect.any(AbortSignal),
      expect.any(Function),
    );
    await act(async () => {
      resolveFirst(null);
    });
    expect(result.current.state.status).toBe('loading');
    await act(async () => {
      resolveRetry(mockWeatherData);
    });
    expect(result.current.state).toEqual({ status: 'success', data: mockWeatherData });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
