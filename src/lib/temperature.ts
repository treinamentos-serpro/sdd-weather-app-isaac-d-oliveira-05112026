import type { Unit } from '../types/weather';

export function convertTemperature(temperatureC: number | null, unit: Unit): number | null {
  if (temperatureC === null || !Number.isFinite(temperatureC)) return null;
  return unit === 'fahrenheit' ? (temperatureC * 9) / 5 + 32 : temperatureC;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function roundTemperature(temperature: number | null): number | null {
  if (temperature === null || !Number.isFinite(temperature)) return null;
  const rounded = Math.sign(temperature) * Math.round(Math.abs(temperature));
  return rounded === 0 ? 0 : rounded;
}

export function formatTemperature(temperatureC: number | null, unit: Unit): string {
  const temperature = roundTemperature(convertTemperature(temperatureC, unit));
  if (temperature === null) return 'Indisponível';
  return `${temperature.toLocaleString('pt-BR')} ${unitLabel(unit)}`;
}
