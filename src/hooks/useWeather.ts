import { useEffect, useRef, useState } from 'react';
import {
  getWeather,
  getWeatherErrorMessage,
  WEATHER_TIMEOUT_MS,
  type WeatherLookupResult,
  WeatherServiceError,
} from '../services/weatherService';
import {
  readWeatherCache,
  saveWeatherCache,
  updateWeatherPreferences,
} from '../services/weatherStorage';
import type { City, WeatherData } from '../types/weather';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty'; query: string }
  | { status: 'choices'; query: string; cities: City[] }
  | { status: 'error'; query: string; message: string; retryAt?: number; fallback?: WeatherData }
  | { status: 'success'; data: WeatherData };

interface UseWeatherOptions {
  initialState: AppState;
  initialCity?: City | null;
  loadWeather: (
    city: string,
    signal?: AbortSignal,
    onCity?: (city: City) => void,
  ) => Promise<WeatherLookupResult>;
  loadCityWeather?: (city: City, signal?: AbortSignal) => Promise<WeatherData>;
}

interface ActiveRequest {
  query: string;
  kind: 'search' | 'forecast';
  controller: AbortController;
  promise: Promise<void>;
}

export default function useWeather({
  initialState,
  initialCity,
  loadWeather,
  loadCityWeather,
}: UseWeatherOptions) {
  const fetchCityWeather = loadCityWeather ?? getWeather;
  const initialData = initialState.status === 'success' ? initialState.data : undefined;
  const [state, setState] = useState<AppState>(initialState);
  const [weatherData, setWeatherData] = useState<WeatherData | undefined>(initialData);
  const [selectedCity, setSelectedCity] = useState<City | null>(
    initialCity ?? initialData?.city ?? null,
  );
  const [lastWeatherAttemptAt, setLastWeatherAttemptAt] = useState<number | null>(
    initialData ? Date.now() : null,
  );
  const mountedRef = useRef(true);
  const activeRef = useRef<ActiveRequest | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weatherDataRef = useRef(initialData);
  const selectedCityRef = useRef(selectedCity);
  const lastCityRef = useRef<{ query: string; city: City } | null>(
    selectedCity ? { query: selectedCity.name, city: selectedCity } : null,
  );
  const lastAttemptAtRef = useRef(lastWeatherAttemptAt);
  const completedSearchQueryRef = useRef<string | null>(null);
  const lastFailedKindRef = useRef<ActiveRequest['kind'] | null>(null);
  const rateLimitsRef = useRef(new Map<string, number>());
  const refreshRef = useRef<(() => Promise<void> | undefined) | null>(null);
  const initializeRef = useRef<() => void>(() => undefined);

  function recordWeatherAttempt(at: number) {
    lastAttemptAtRef.current = at;
    setLastWeatherAttemptAt(at);
  }

  function setDisplayedWeather(data: WeatherData | undefined) {
    weatherDataRef.current = data;
    setWeatherData(data);
  }

  function rememberCity(city: City, query = city.name) {
    lastCityRef.current = { query, city };
    selectedCityRef.current = city;
    setSelectedCity(city);
    updateWeatherPreferences({ lastCity: city });
    if (weatherDataRef.current?.city.id !== city.id) setDisplayedWeather(undefined);
  }

  function runQuery(
    query: string,
    load: (signal: AbortSignal, onCity: (city: City) => void) => Promise<WeatherLookupResult>,
    initialCityForQuery?: City,
    kind: ActiveRequest['kind'] = 'search',
  ): Promise<void> | undefined {
    if (!query) return;
    const active = activeRef.current;
    if (active?.query === query) return active.promise;
    if (active) {
      activeRef.current = null;
      active.controller.abort(new DOMException('Busca substituída.', 'AbortError'));
    }

    const blockedUntil = rateLimitsRef.current.get(query);
    if (blockedUntil !== undefined && Date.now() < blockedUntil) {
      const city = lastCityRef.current?.query === query ? lastCityRef.current.city : undefined;
      const fallback = city ? readWeatherCache(city) : undefined;
      if (fallback) setDisplayedWeather(fallback);
      setState({
        status: 'error',
        query,
        message: 'O serviço recebeu muitas consultas. Aguarde um momento antes de tentar novamente.',
        retryAt: blockedUntil,
        ...(fallback ? { fallback } : {}),
      });
      return;
    }
    rateLimitsRef.current.delete(query);

    const controller = new AbortController();
    const startedAt = Date.now();
    if (kind === 'forecast') recordWeatherAttempt(startedAt);
    setState({ status: 'loading' });
    let selected =
      initialCityForQuery ??
      (lastCityRef.current?.query === query ? lastCityRef.current.city : undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;

    let request: Promise<WeatherLookupResult>;
    try {
      request = load(controller.signal, (city) => {
        selected = city;
        recordWeatherAttempt(startedAt);
        rememberCity(city, query);
      });
    } catch (error) {
      request = Promise.reject(error);
    }
    const deadline = new Promise<never>((_resolve, reject) => {
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
        once: true,
      });
    });
    timer = setTimeout(
      () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
      Math.max(0, WEATHER_TIMEOUT_MS - (Date.now() - startedAt)),
    );

    const promise = Promise.race([request, deadline])
      .then((result) => {
        if (Date.now() - startedAt > WEATHER_TIMEOUT_MS) {
          controller.abort(new DOMException('Timeout', 'TimeoutError'));
          throw controller.signal.reason;
        }
        if (!mountedRef.current || activeRef.current?.controller !== controller) return;
        activeRef.current = null;
        if (Array.isArray(result)) {
          lastFailedKindRef.current = null;
          if (kind === 'search') completedSearchQueryRef.current = query;
          setState({ status: 'choices', query, cities: result.slice(0, 10) });
          return;
        }
        if (!result) {
          lastFailedKindRef.current = null;
          if (kind === 'search') completedSearchQueryRef.current = query;
          setDisplayedWeather(undefined);
          setState({ status: 'empty', query });
          return;
        }
        rememberCity(result.city, query);
        if (kind === 'search') recordWeatherAttempt(startedAt);
        lastFailedKindRef.current = null;
        if (kind === 'search') completedSearchQueryRef.current = query;
        saveWeatherCache(result);
        setDisplayedWeather(result);
        setState({ status: 'success', data: result });
      })
      .catch((error: unknown) => {
        if (!mountedRef.current || activeRef.current?.controller !== controller) return;
        activeRef.current = null;
        const serviceError = error instanceof WeatherServiceError ? error : undefined;
        lastFailedKindRef.current = kind;
        if (serviceError?.status === 429 && serviceError.retryAt !== undefined) {
          rateLimitsRef.current.set(query, serviceError.retryAt);
        }
        const fallbackCity = serviceError?.city ?? selected;
        const fallback = fallbackCity ? readWeatherCache(fallbackCity) : undefined;
        if (fallbackCity) setDisplayedWeather(fallback);
        setState({
          status: 'error',
          query,
          message: getWeatherErrorMessage(error),
          ...(serviceError?.retryAt !== undefined ? { retryAt: serviceError.retryAt } : {}),
          ...(fallback ? { fallback } : {}),
        });
      })
      .finally(() => {
        clearTimeout(timer);
        if (activeRef.current?.controller === controller) activeRef.current = null;
      });

    activeRef.current = { query, kind, controller, promise };
    return promise;
  }

  function search(city: string): Promise<void> | undefined {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = null;
    const query = city.trim();
    if (
      query &&
      (completedSearchQueryRef.current === query ||
        (state.status === 'choices' && state.query === query) ||
        (state.status === 'error' && state.query === query))
    ) {
      return;
    }
    if (!query) {
      completedSearchQueryRef.current = null;
      const active = activeRef.current;
      if (active?.kind === 'search') {
        activeRef.current = null;
        active.controller.abort(new DOMException('Busca limpa.', 'AbortError'));
      }
      setState(
        weatherDataRef.current
          ? { status: 'success', data: weatherDataRef.current }
          : { status: 'idle' },
      );
      return;
    }
    return runQuery(query, (signal, onCity) => loadWeather(query, signal, onCity));
  }

  function scheduleSearch(city: string): void {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const query = city.trim();
    if (!query) {
      void search('');
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      void search(query);
    }, 300);
  }

  function selectCity(city: City): Promise<void> | undefined {
    rememberCity(city);
    return runQuery(city.name, (signal) => fetchCityWeather(city, signal), city, 'forecast');
  }

  function refresh(): Promise<void> | undefined {
    const city = selectedCityRef.current;
    if (!city) return;
    return runQuery(city.name, (signal) => fetchCityWeather(city, signal), city, 'forecast');
  }

  function retry(): Promise<void> | undefined {
    if (state.status !== 'error' || (state.retryAt && Date.now() < state.retryAt)) return;
    const city = lastCityRef.current?.query === state.query ? lastCityRef.current.city : undefined;
    if (city && lastFailedKindRef.current === 'forecast') {
      return runQuery(state.query, (signal) => fetchCityWeather(city, signal), city, 'forecast');
    }
    return runQuery(state.query, (signal, onCity) => loadWeather(state.query, signal, onCity));
  }

  refreshRef.current = refresh;
  initializeRef.current = () => {
    const city = initialCity;
    if (initialState.status !== 'idle' || !city) return;
    rememberCity(city);
    void runQuery(city.name, (signal) => fetchCityWeather(city, signal), city, 'forecast');
  };

  useEffect(() => {
    mountedRef.current = true;
    initializeRef.current();
    return () => {
      mountedRef.current = false;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      activeRef.current?.controller.abort();
      activeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedCity || typeof document === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function scheduleRefresh() {
      if (timer) clearTimeout(timer);
      if (document.visibilityState === 'hidden') return;
      const lastAttemptAt = lastWeatherAttemptAt;
      if (lastAttemptAt === null) return;
      const remaining = REFRESH_INTERVAL_MS - (Date.now() - lastAttemptAt);
      if (remaining <= 0) {
        void refreshRef.current?.();
      } else {
        timer = setTimeout(scheduleRefresh, remaining);
      }
    }
    document.addEventListener('visibilitychange', scheduleRefresh);
    scheduleRefresh();
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', scheduleRefresh);
    };
  }, [selectedCity, lastWeatherAttemptAt]);

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

  return {
    state,
    weatherData,
    search,
    scheduleSearch,
    selectCity,
    refresh,
    retry,
    retryBlocked: retryAt !== undefined && Date.now() < retryAt,
  };
}