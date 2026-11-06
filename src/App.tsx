import { CloudSun } from 'lucide-react';
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
import type { Unit, WeatherData } from './types/weather';

export type { AppState } from './hooks/useWeather';

interface AppProps {
  initialState?: AppState;
  loadWeather?: (city: string) => Promise<WeatherData | null>;
}

export default function App({
  initialState = { status: 'success', data: mockWeatherData },
  loadWeather = getMockWeather,
}: AppProps) {
  const { state, search, retry } = useWeather({ initialState, loadWeather });
  const [unit, setUnit] = useState<Unit>('celsius');
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
    if (!city.trim() || state.status === 'loading') return;
    submittedControlRef.current = document.activeElement;
    return search(city);
  }

  function handleRetry() {
    submittedControlRef.current = document.activeElement;
    return retry();
  }

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
            <SearchBar onSearch={handleSearch} disabled={state.status === 'loading'} />
          </div>
          <div className="flex justify-end lg:pb-1">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <main
        ref={contentRef}
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 sm:px-6"
      >
        {state.status === 'idle' && <EmptyState onSearch={focusSearch} />}
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint={`Nenhum resultado para “${state.query}”. Tente outro nome de cidade.`}
            onSearch={focusSearch}
          />
        )}
        {state.status === 'error' && <ErrorState message={state.message} onRetry={handleRetry} />}
        {state.status === 'success' && (
          <>
            <CurrentWeather city={state.data.city} current={state.data.current} unit={unit} />
            <ForecastList
              forecast={state.data.forecast}
              unit={unit}
              timezone={state.data.timezone}
              referenceTime={state.data.fetchedAt}
            />
          </>
        )}
      </main>
      <footer className="border-t border-white/10 px-4 py-5 text-sm text-white/70 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-between sm:gap-6">
          <p>Dados de demonstração. Previsões podem mudar. Não oferecemos alertas de emergência.</p>
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
