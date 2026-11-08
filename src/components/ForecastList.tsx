import { useId, useMemo } from 'react';
import { formatDayLabel } from '../lib/format';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { Unit } from '../types/weather';
import ForecastCard, { type ForecastDisplayDay } from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDisplayDay[];
  unit: Unit;
  timezone: string;
  referenceTime?: string;
}

export default function ForecastList({
  forecast,
  unit,
  timezone,
  referenceTime = new Date().toISOString(),
}: ForecastListProps) {
  const headingId = useId();
  const incomplete = useMemo(() => {
    const firstDate = forecast[0]?.localDate;
    const firstDayTime = firstDate ? Date.parse(`${firstDate}T00:00:00Z`) : Number.NaN;
    return (
      forecast.length !== 5 ||
      !firstDate ||
      formatDayLabel(firstDate, timezone, referenceTime) !== 'Hoje' ||
      forecast.some(
        (day, index) =>
          day.minimumC === null ||
          day.maximumC === null ||
          !Number.isFinite(day.minimumC) ||
          !Number.isFinite(day.maximumC) ||
          day.minimumC > day.maximumC ||
          getWeatherCondition(day.weatherCode).icon === null ||
          formatDayLabel(day.localDate, timezone, referenceTime) === 'Indisponível' ||
          Date.parse(`${day.localDate}T00:00:00Z`) !== firstDayTime + index * 86_400_000,
      )
    );
  }, [forecast, timezone, referenceTime]);

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 py-6 text-white">
      <h2 id={headingId} className="mb-4 text-xl font-semibold">
        Previsão de 5 dias
      </h2>
      {forecast.length === 0 ? (
        <p role="status" className="text-sm text-white/70">
          Previsão indisponível.
        </p>
      ) : (
        <>
          {incomplete && (
            <p role="status" className="mb-4 text-sm text-white/70">
              Previsão incompleta.
            </p>
          )}
          <ul className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {forecast.map((day) => (
              <li key={day.localDate} className="min-w-0">
                <ForecastCard
                  day={day}
                  unit={unit}
                  timezone={timezone}
                  referenceTime={referenceTime}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
