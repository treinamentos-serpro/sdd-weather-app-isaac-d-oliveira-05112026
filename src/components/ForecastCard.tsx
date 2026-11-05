import { useId } from 'react';
import { formatDayLabel } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';
import WeatherIcon from './WeatherIcon';

export type ForecastDisplayDay = ForecastDay & {
  precipitationProbabilityPercent?: number | null;
};

interface ForecastCardProps {
  day: ForecastDisplayDay;
  unit: Unit;
  timezone: string;
  referenceTime?: string;
}

function formatRainProbability(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 100) {
    return 'Indisponível';
  }
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} %`;
}

export default function ForecastCard({
  day,
  unit,
  timezone,
  referenceTime = new Date().toISOString(),
}: ForecastCardProps) {
  const headingId = useId();
  const condition = getWeatherCondition(day.weatherCode);
  const temperatures = [
    { label: 'Máxima', value: formatTemperature(day.maximumC, unit) },
    { label: 'Mínima', value: formatTemperature(day.minimumC, unit) },
  ];

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full min-w-0 flex-col rounded-lg border border-white/10 bg-white/5 p-3 text-white shadow-glass backdrop-blur-md sm:p-4"
    >
      <h3 id={headingId} className="break-words text-base font-semibold">
        <time dateTime={day.localDate}>
          {formatDayLabel(day.localDate, timezone, referenceTime)}
        </time>
      </h3>
      <div className="my-3 flex h-12 items-center">
        <WeatherIcon code={day.weatherCode} className="h-10 w-10 shrink-0 text-sun" />
      </div>
      <p className="mb-4 min-h-10 text-sm text-white/70 [overflow-wrap:anywhere]">
        {condition.label}
      </p>
      <dl className="mt-auto grid gap-3">
        {temperatures.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-1">
            <dt className="text-xs text-white/70">{label}</dt>
            <dd className="text-sm font-medium [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
        <div className="min-w-0 border-t border-white/10 pt-3">
          <dt className="break-words text-xs text-white/70">Probabilidade de chuva</dt>
          <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere]">
            {formatRainProbability(day.precipitationProbabilityPercent)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
