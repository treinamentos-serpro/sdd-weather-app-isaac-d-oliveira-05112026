import { useEffect, useRef, useState } from 'react';
import { getWeatherErrorMessage, WEATHER_TIMEOUT_MS } from '../services/weatherService';
import type { WeatherData } from '../types/weather';

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; message: string }
  | { status: 'success'; data: WeatherData };

interface UseWeatherOptions {
  initialState: AppState;
  loadWeather: (city: string) => Promise<WeatherData | null>;
}

export default function useWeather({ initialState, loadWeather }: UseWeatherOptions) {
  const [state, setState] = useState<AppState>(initialState);
  const busyRef = useRef(initialState.status === 'loading');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function search(city: string) {
    const query = city.trim();
    if (!query || busyRef.current) return;
    busyRef.current = true;
    setState({ status: 'loading' });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new DOMException('Timeout', 'TimeoutError')),
          WEATHER_TIMEOUT_MS,
        );
      });
      const data = await Promise.race([loadWeather(query), deadline]);
      if (mountedRef.current) {
        setState(data ? { status: 'success', data } : { status: 'empty', query });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({ status: 'error', query, message: getWeatherErrorMessage(error) });
      }
    } finally {
      clearTimeout(timer);
      busyRef.current = false;
    }
  }

  function retry() {
    if (state.status === 'error') return search(state.query);
  }

  return { state, search, retry };
}
