import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predominantemente limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Nublado'],
    [45, 'Nevoeiro'],
    [48, 'Nevoeiro com geada'],
    [51, 'Garoa leve'],
    [53, 'Garoa moderada'],
    [55, 'Garoa intensa'],
    [56, 'Garoa congelante leve'],
    [57, 'Garoa congelante intensa'],
    [61, 'Chuva leve'],
    [63, 'Chuva moderada'],
    [65, 'Chuva forte'],
    [66, 'Chuva congelante leve'],
    [67, 'Chuva congelante forte'],
    [71, 'Neve leve'],
    [73, 'Neve moderada'],
    [75, 'Neve intensa'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva leves'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva fortes'],
    [85, 'Pancadas de neve leves'],
    [86, 'Pancadas de neve fortes'],
    [95, 'Trovoada'],
    [96, 'Trovoada com granizo leve'],
    [99, 'Trovoada com granizo forte'],
  ] as const)('traduz o código WMO %s para %s', (code, label) => {
    expect(getWeatherCondition(code).label).toBe(label);
    expect(getWeatherCondition(code).icon).not.toBeNull();
  });

  it.each([null, -1, 100, Number.NaN])('não inventa condição nem ícone para %s', (code) => {
    expect(getWeatherCondition(code)).toEqual({ label: 'Indisponível', icon: null });
  });
});
