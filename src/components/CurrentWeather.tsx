import { CloudRain, Droplets, Wind } from 'lucide-react';
import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, Unit, CurrentWeather as WeatherCurrent } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface CurrentWeatherProps {
  city: City;
  current: WeatherCurrent;
  unit: Unit;
  timezone: string;
}

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatMetric(value: number | null | undefined, suffix: string): string {
  if (value == null || !Number.isFinite(value)) return 'Indisponível';
  return `${numberFormat.format(value)} ${suffix}`;
}

function formatReferenceTime(value: string | null, timezone: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Indisponível';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(value));
  } catch {
    return 'Indisponível';
  }
}

function formatModelRunAge(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Indisponível';
  const ageMinutes = Math.floor((Date.now() - Date.parse(value)) / 60_000);
  if (ageMinutes < 0) return 'Indisponível';
  if (ageMinutes < 60) return `${ageMinutes} min`;
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

export default function CurrentWeather({ city, current, unit, timezone }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);
  const temperature = formatTemperature(current.temperatureC, unit);
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%'), Icon: Droplets },
    { label: 'Vento', value: formatMetric(current.windKmh, 'km/h'), Icon: Wind },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm'), Icon: CloudRain },
  ];

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 py-6 text-white sm:py-8">
      <h2 id={headingId} className="text-2xl font-semibold [overflow-wrap:anywhere]">
        {city.name}
      </h2>
      <p className="mt-1 break-words text-sm text-white/70">
        {[city.admin1, city.country].filter(Boolean).join(', ')}
      </p>
      <p className="mt-2 text-sm text-white/70">
        Dados referentes a {formatReferenceTime(current.referenceTime, timezone)}
      </p>
      <p className="mt-1 text-sm text-white/70">
        Idade da execução do modelo: {formatModelRunAge(current.modelRunAt)}
      </p>
      <div className="my-6 flex min-w-0 flex-wrap items-center gap-5 sm:gap-8">
        <WeatherIcon
          code={current.weatherCode}
          className="h-20 w-20 shrink-0 text-sun sm:h-24 sm:w-24"
        />
        <div className="min-w-0 max-w-full">
          <p
            className={`font-semibold [overflow-wrap:anywhere] ${temperature === 'Indisponível' ? 'text-2xl sm:text-3xl' : 'text-5xl sm:text-7xl'}`}
          >
            <span className="sr-only">Temperatura: </span>
            {temperature}
          </p>
          <p className="mt-3 text-lg">{condition.label}</p>
          <p className="mt-1 text-sm text-white/70">
            Sensação térmica: {formatTemperature(current.apparentTemperatureC, unit)}
          </p>
        </div>
      </div>
      <dl className="grid min-w-0 grid-cols-2 gap-5 border-y border-white/10 bg-white/5 px-3 py-5 backdrop-blur-md sm:grid-cols-3 sm:px-4">
        {metrics.map(({ label, value, Icon }) => (
          <div key={label} className="min-w-0">
            <dt className="flex flex-wrap items-center gap-2 break-words text-sm text-white/70">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {label}
            </dt>
            <dd className="mt-2 text-base font-medium [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
