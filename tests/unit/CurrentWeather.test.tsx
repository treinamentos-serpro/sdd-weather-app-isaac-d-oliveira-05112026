import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('CurrentWeather', () => {
  it('exibe cidade, condição e métricas em pt-BR', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...mockWeatherData.current, pressureHpa: 1013.2 }}
        unit="celsius"
      />,
    );

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 24 °C')).toBeInTheDocument();
    expect(screen.getByText('72 %')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('1.013,2 hPa')).toBeInTheDocument();
    for (const label of ['Umidade', 'Vento', 'Precipitação', 'Pressão']) {
      expect(screen.getByText(label).tagName).toBe('DT');
    }
  });

  it('atualiza temperaturas pela prop unit sem alterar as outras unidades', () => {
    const props = { city: mockWeatherData.city, current: mockWeatherData.current };
    const { rerender } = render(<CurrentWeather {...props} unit="celsius" />);
    expect(screen.getByText('23 °C')).toBeInTheDocument();

    rerender(<CurrentWeather {...props} unit="fahrenheit" />);

    expect(screen.getByText('74 °F')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 75 °F')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.queryByText('23 °C')).not.toBeInTheDocument();
  });

  it.each<Unit>(['celsius', 'fahrenheit'])('indica todos os valores ausentes em %s', (unit) => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          ...mockWeatherData.current,
          temperatureC: null,
          apparentTemperatureC: null,
          weatherCode: null,
          humidityPercent: null,
          windKmh: null,
          precipitationMm: null,
          pressureHpa: null,
        }}
        unit={unit}
      />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.getByText('Sensação térmica: Indisponível')).toBeInTheDocument();
    expect(screen.queryByText('0 mm')).not.toBeInTheDocument();
    expect(screen.queryByText('0 °C')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('aceita o mock original sem inventar pressão nem condição desconhecida', () => {
    render(
      <CurrentWeather
        city={{ ...mockWeatherData.city, admin1: null, country: null }}
        current={{ ...mockWeatherData.current, weatherCode: 999 }}
        unit="celsius"
      />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(2);
    expect(screen.getByText('Pressão').nextElementSibling).toHaveTextContent('Indisponível');
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('converte antes de arredondar e trata empates negativos', () => {
    const props = {
      city: mockWeatherData.city,
      current: { ...mockWeatherData.current, temperatureC: 18.4, apparentTemperatureC: -2.5 },
    };
    const { rerender } = render(<CurrentWeather {...props} unit="celsius" />);

    expect(screen.getByText('Sensação térmica: -3 °C')).toBeInTheDocument();
    rerender(<CurrentWeather {...props} unit="fahrenheit" />);
    expect(screen.getByText('65 °F')).toBeInTheDocument();
  });
});
