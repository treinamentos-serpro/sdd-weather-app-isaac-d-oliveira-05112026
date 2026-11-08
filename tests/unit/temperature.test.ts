import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  roundTemperature,
  unitLabel,
} from '../../src/lib/temperature';

describe('temperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (temperatureC, fahrenheit) => {
    expect(convertTemperature(temperatureC, 'fahrenheit')).toBe(fahrenheit);
  });

  it('mantém Celsius e converte Fahrenheit por unidade', () => {
    expect(convertTemperature(20, 'celsius')).toBe(20);
    expect(convertTemperature(20, 'fahrenheit')).toBe(68);
  });

  it.each([
    [2.5, 3],
    [-2.5, -3],
    [-0.1, 0],
  ])('arredonda %s para %s com empates afastados de zero', (temperature, expected) => {
    expect(roundTemperature(temperature)).toBe(expected);
  });

  it('converte antes de arredondar e inclui o símbolo da unidade', () => {
    expect(formatTemperature(18.4, 'fahrenheit')).toBe('65 °F');
    expect(formatTemperature(18.4, 'celsius')).toBe('18 °C');
  });

  it('atende AC53 convertendo 18 °C e 19 °C antes de arredondar', () => {
    expect(formatTemperature(18, 'fahrenheit')).toBe('64 °F');
    expect(formatTemperature(19, 'fahrenheit')).toBe('66 °F');
  });

  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna o rótulo de %s', (unit, label) => {
    expect(unitLabel(unit)).toBe(label);
  });

  it.each([
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('preserva ausência e rejeita %s', (value) => {
    expect(convertTemperature(value, 'fahrenheit')).toBeNull();
    expect(roundTemperature(value)).toBeNull();
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
  });
});
