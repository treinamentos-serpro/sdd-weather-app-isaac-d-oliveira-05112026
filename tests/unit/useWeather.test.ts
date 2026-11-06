import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { WeatherData } from '../../src/types/weather';

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
    expect(loadWeather).toHaveBeenLastCalledWith('São Paulo');
    await act(async () => {
      resolveFirst(null);
    });
    expect(result.current.state.status).toBe('loading');
    await act(async () => {
      resolveRetry(mockWeatherData);
    });
    expect(result.current.state).toEqual({ status: 'success', data: mockWeatherData });
    expect(vi.getTimerCount()).toBe(0);
  });
});
