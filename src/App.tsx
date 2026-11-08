import { CloudSun, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather, { type AppState } from './hooks/useWeather';
import { mockWeatherData } from './mocks/weather';
import { getMockWeather } from './services/mockWeatherService';
import type { WeatherLookupResult } from './services/weatherService';
import { getWeather } from './services/weatherService';
import { readWeatherPreferences, updateWeatherPreferences } from './services/weatherStorage';
import type { City, Unit, WeatherData } from './types/weather';

export type { AppState } from './hooks/useWeather';

interface AppProps {
  initialState?: AppState;
  loadWeather?: (
    city: string,
    signal?: AbortSignal,
    onCity?: (city: City) => void,
  ) => Promise<WeatherLookupResult>;
  loadCityWeather?: (city: City, signal?: AbortSignal) => Promise<WeatherData>;
}

export default function App({
  initialState = { status: 'success', data: mockWeatherData },
  loadWeather = getMockWeather,
  loadCityWeather = getWeather,
}: AppProps) {
  const [preferences] = useState(readWeatherPreferences);
  const [unit, setUnit] = useState<Unit>(preferences.temperatureUnit);
  const initialCity = initialState.status === 'idle' ? preferences.lastCity : undefined;
  const {
    state,
    weatherData,
    search,
    scheduleSearch,
    selectCity,
    refresh,
    retry,
    retryBlocked,
  } = useWeather({
    initialState,
    initialCity,
    loadWeather,
    loadCityWeather,
  });
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const submittedControlRef = useRef<Element | null>(null);

  useEffect(() => {
    if (state.status === 'loading' || submittedControlRef.current === null) return;
    if (
      document.activeElement === document.body ||
      document.activeElement === submittedControlRef.current
    ) {
      contentRef.current?.focus();
    }
    submittedControlRef.current = null;
  }, [state.status]);

  function focusSearch() {
    searchContainerRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }

  function handleSearch(city: string) {
    if (!city.trim()) return;
    if (
      (state.status === 'choices' && state.query === city.trim()) ||
      (state.status === 'error' && state.query === city.trim())
    ) {
      contentRef.current?.focus();
      return;
    }
    submittedControlRef.current = document.activeElement;
    const request = search(city);
    if (!request && state.status !== 'loading') {
      contentRef.current?.focus();
      submittedControlRef.current = null;
    }
    return request;
  }

  function handleUnitChange(nextUnit: Unit) {
    setUnit(nextUnit);
    updateWeatherPreferences({ temperatureUnit: nextUnit });
  }

  function handleRetry() {
    submittedControlRef.current = document.activeElement;
    return retry();
  }

  function handleSelectCity(city: City) {
    submittedControlRef.current = document.activeElement;
    return selectCity(city);
  }

  function handleRefresh() {
    submittedControlRef.current = document.activeElement;
    return refresh();
  }

  const displayedData =
    state.status === 'success'
      ? state.data
      : state.status === 'error'
        ? (state.fallback ?? weatherData)
        : weatherData;

  return (
    <div className="flex min-h-screen flex-col bg-night-900 font-sans text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-night-800 focus:px-4 focus:py-3 focus:outline focus:outline-2 focus:outline-accent-400"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-end lg:gap-8">
          <div className="flex min-w-0 items-center gap-3 lg:pb-3">
            <CloudSun aria-hidden="true" className="h-9 w-9 shrink-0 text-sun" />
            <h1 className="text-2xl font-semibold">Weather App</h1>
          </div>
          <div ref={searchContainerRef} className="min-w-0">
            <SearchBar onSearch={handleSearch} onQueryChange={scheduleSearch} />
          </div>
          <div className="flex justify-end lg:pb-1">
            <UnitToggle unit={unit} onChange={handleUnitChange} />
          </div>
        </div>
      </header>
      <main
        ref={contentRef}
        id="main-content"
        tabIndex={-1}
        aria-busy={state.status === 'loading'}
        className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 sm:px-6"
      >
        {state.status === 'idle' && <EmptyState onSearch={focusSearch} />}
        {state.status === 'loading' && !displayedData && <LoadingState />}
        {state.status === 'loading' && displayedData && (
          <p role="status" className="py-3 text-sm text-white/70">
            Buscando ou atualizando dados...
          </p>
        )}
        {state.status === 'choices' && (
          <section aria-labelledby="city-choices-title" className="space-y-4">
            <div>
              <h2 id="city-choices-title" className="text-xl font-semibold">
                Selecione uma cidade
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Confirme a localização de “{state.query}” para carregar a previsão.
              </p>
            </div>
            <ul className="grid gap-2">
              {state.cities.map((city) => {
                const location = [city.admin1, city.country].filter(Boolean).join(', ');
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      aria-label={`${city.name}, ${location || 'Contexto geográfico indisponível'}`}
                      onClick={() => handleSelectCity(city)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                    >
                      <span className="block font-medium">{city.name}</span>
                      <span className="mt-1 block text-sm text-white/70">
                        {location || 'Contexto geográfico indisponível'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {state.status === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint={`Nenhum resultado para “${state.query}”. Tente outro nome de cidade.`}
            onSearch={focusSearch}
          />
        )}
        {state.status === 'error' && (
          <>
            <ErrorState message={state.message} onRetry={handleRetry} disabled={retryBlocked} />
            {state.fallback && (
              <p role="status">Dados desatualizados; exibindo o último cache elegível.</p>
            )}
          </>
        )}
        {displayedData && (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Atualizar clima"
                title="Atualizar clima"
                disabled={retryBlocked}
                onClick={handleRefresh}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <CurrentWeather
              city={displayedData.city}
              current={displayedData.current}
              unit={unit}
              timezone={displayedData.timezone}
            />
            <ForecastList
              forecast={displayedData.forecast}
              unit={unit}
              timezone={displayedData.timezone}
              referenceTime={displayedData.fetchedAt}
            />
          </>
        )}
      </main>
      <footer className="border-t border-white/10 px-4 py-5 text-sm text-white/70 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-between sm:gap-6">
          <p>
            {loadWeather === getMockWeather && 'Dados de demonstração. '}
            Previsões podem mudar. Não oferecemos alertas de emergência.
          </p>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-accent-400 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Open-Meteo
          </a>
        </div>
      </footer>
    </div>
  );
}
