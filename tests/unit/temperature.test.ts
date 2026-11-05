import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, roundTemperature } from '../../src/lib/temperature';

describe('temperature', () => {
  it.each([
    [0, 32],
    [20, 68],
    [18, 64],
    [19, 66],
  ])('converte %s °C para %s °F após arredondar', (temperatureC, fahrenheit) => {
    expect(convertTemperature(temperatureC, 'celsius')).toBe(temperatureC);
    expect(roundTemperature(convertTemperature(temperatureC, 'fahrenheit'))).toBe(fahrenheit);
  });

  it.each([
    [2.5, 3],
    [-2.5, -3],
    [-0.1, 0],
  ])('arredonda %s para %s com empates afastados de zero', (temperature, expected) => {
    expect(roundTemperature(temperature)).toBe(expected);
  });

  it('converte antes de arredondar e formata com a unidade escolhida', () => {
    expect(formatTemperature(18.4, 'fahrenheit')).toBe('65 °F');
    expect(formatTemperature(18.4, 'celsius')).toBe('18 °C');
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
