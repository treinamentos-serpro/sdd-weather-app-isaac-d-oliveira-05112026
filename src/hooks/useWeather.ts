import { useEffect, useRef, useState } from 'react';
import {
  getWeather,
  getWeatherErrorMessage,
  WEATHER_TIMEOUT_MS,
  type WeatherLookupResult,
  WeatherServiceError,
} from '../services/weatherService';
import { readWeatherCache, saveWeatherCache } from '../services/weatherStorage';
import type { City, WeatherData } from '../types/weather';

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty'; query: string }
  | { status: 'choices'; query: string; cities: City[] }
  | { status: 'error'; query: string; message: string; retryAt?: number; fallback?: WeatherData }
  | { status: 'success'; data: WeatherData };

interface UseWeatherOptions {
  initialState: AppState;
  loadWeather: (
    city: string,
    signal?: AbortSignal,
    onCity?: (city: City) => void,
  ) => Promise<WeatherLookupResult>;
  loadCityWeather?: (city: City, signal?: AbortSignal) => Promise<WeatherData>;
}

export default function useWeather({
  initialState,
  loadWeather,
  loadCityWeather,
}: UseWeatherOptions) {
  const fetchCityWeather = loadCityWeather ?? getWeather;
  const [state, setState] = useState<AppState>(initialState);
  const busyRef = useRef(initialState.status === 'loading');
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  const lastCityRef = useRef<{ query: string; city: City } | null>(null);
  const rateLimitsRef = useRef(new Map<string, number>());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const retryAt = state.status === 'error' ? state.retryAt : undefined;
  useEffect(() => {
    if (retryAt === undefined) return;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const remaining = retryAt! - Date.now();
      if (remaining <= 0) {
        setState((previous) => (previous.status === 'error' ? { ...previous } : previous));
      } else {
        timer = setTimeout(schedule, Math.min(remaining, 2_147_483_647));
      }
    }
    schedule();
    return () => clearTimeout(timer);
  }, [retryAt]);

  async function runQuery(
    query: string,
    load: (signal: AbortSignal, onCity: (city: City) => void) => Promise<WeatherLookupResult>,
    initialCity?: City,
  ) {
    if (!query || busyRef.current) return;
    const blockedUntil =
      rateLimitsRef.current.get(query) ??
      (state.status === 'error' && state.query === query ? state.retryAt : undefined);
    if (blockedUntil !== undefined && Date.now() < blockedUntil) {
      const previousCity =
        lastCityRef.current?.query === query ? lastCityRef.current.city : undefined;
      const fallback = previousCity ? readWeatherCache(previousCity) : undefined;
      setState({
        status: 'error',
        query,
        message:
          'O serviço recebeu muitas consultas. Aguarde um momento antes de tentar novamente.',
        retryAt: blockedUntil,
        ...(fallback ? { fallback } : {}),
      });
      return;
    }
    rateLimitsRef.current.delete(query);
    busyRef.current = true;
    setState({ status: 'loading' });
    const controller = new AbortController();
    controllerRef.current = controller;
    let selectedCity =
      initialCity ?? (lastCityRef.current?.query === query ? lastCityRef.current.city : undefined);
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
          once: true,
        });
      });
      const request = load(controller.signal, (selected) => {
        selectedCity = selected;
      });
      timer = setTimeout(
        () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
        Math.max(0, WEATHER_TIMEOUT_MS - (Date.now() - startedAt)),
      );
      const result = await Promise.race([request, deadline]);
      if (Date.now() - startedAt > WEATHER_TIMEOUT_MS) {
        controller.abort(new DOMException('Timeout', 'TimeoutError'));
        throw controller.signal.reason;
      }
      if (Array.isArray(result)) {
        if (mountedRef.current) setState({ status: 'choices', query, cities: result });
        return;
      }
      const data = result;
      if (mountedRef.current) {
        if (data) {
          lastCityRef.current = { query, city: data.city };
          saveWeatherCache(data);
        }
        setState(data ? { status: 'success', data } : { status: 'empty', query });
      }
    } catch (error) {
      if (mountedRef.current) {
        const serviceError = error instanceof WeatherServiceError ? error : undefined;
        if (serviceError?.status === 429 && serviceError.retryAt !== undefined) {
          rateLimitsRef.current.set(query, serviceError.retryAt);
        }
        const fallbackCity = serviceError?.city ?? selectedCity;
        const fallback = fallbackCity ? readWeatherCache(fallbackCity) : undefined;
        setState({
          status: 'error',
          query,
          message: getWeatherErrorMessage(error),
          ...(serviceError?.retryAt !== undefined ? { retryAt: serviceError.retryAt } : {}),
          ...(fallback ? { fallback } : {}),
        });
      }
    } finally {
      clearTimeout(timer);
      if (controllerRef.current === controller) controllerRef.current = null;
      busyRef.current = false;
    }
  }

  function search(city: string) {
    const query = city.trim();
    return runQuery(query, (signal, onCity) => loadWeather(query, signal, onCity));
  }

  function selectCity(city: City) {
    lastCityRef.current = { query: city.name, city };
    return runQuery(city.name, (signal) => fetchCityWeather(city, signal), city);
  }

  function retry() {
    if (state.status !== 'error' || (state.retryAt && Date.now() < state.retryAt)) return;
    const city = lastCityRef.current?.query === state.query ? lastCityRef.current.city : undefined;
    if (city) return runQuery(state.query, (signal) => fetchCityWeather(city, signal), city);
    return search(state.query);
  }

  return {
    state,
    search,
    selectCity,
    retry,
    retryBlocked: retryAt !== undefined && Date.now() < retryAt,
  };
}
