import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

const props = {
  day: { ...mockWeatherData.forecast[0], precipitationProbabilityPercent: 35 },
  timezone: mockWeatherData.timezone,
  referenceTime: mockWeatherData.fetchedAt,
};

describe('ForecastCard', () => {
  it('mostra o dia, condição, temperaturas e probabilidade de chuva', () => {
    render(<ForecastCard {...props} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toHaveAttribute('datetime', '2026-11-05');
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('Máxima').nextElementSibling).toHaveTextContent('25 °C');
    expect(screen.getByText('Mínima').nextElementSibling).toHaveTextContent('16 °C');
    expect(screen.getByText('Probabilidade de chuva').nextElementSibling).toHaveTextContent('35 %');
  });

  it('atualiza as temperaturas sem alterar a probabilidade', () => {
    const { rerender } = render(<ForecastCard {...props} unit="celsius" />);
    rerender(<ForecastCard {...props} unit="fahrenheit" />);

    expect(screen.getByText('Máxima').nextElementSibling).toHaveTextContent('77 °F');
    expect(screen.getByText('Mínima').nextElementSibling).toHaveTextContent('61 °F');
    expect(screen.getByText('35 %')).toBeInTheDocument();
  });

  it.each([0, 100])('preserva a probabilidade válida de %s %%', (probability) => {
    render(
      <ForecastCard
        {...props}
        day={{ ...props.day, precipitationProbabilityPercent: probability }}
        unit="celsius"
      />,
    );
    expect(screen.getByText(`${probability} %`)).toBeInTheDocument();
  });

  it.each([
    undefined,
    null,
    -1,
    101,
    Number.NaN,
  ])('não inventa probabilidade para %s', (probability) => {
    render(
      <ForecastCard
        {...props}
        day={{ ...props.day, precipitationProbabilityPercent: probability }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Probabilidade de chuva').nextElementSibling).toHaveTextContent(
      'Indisponível',
    );
  });

  it('identifica valores ausentes e condição desconhecida', () => {
    render(
      <ForecastCard
        {...props}
        day={{ ...props.day, maximumC: null, minimumC: null, weatherCode: 999 }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(3);
    expect(screen.queryByText('32 °F')).not.toBeInTheDocument();
  });

  it('usa o calendário da cidade na virada do dia', () => {
    render(<ForecastCard {...props} unit="celsius" referenceTime="2026-11-05T01:00:00Z" />);

    expect(screen.getByRole('heading', { name: 'qui.' })).toBeInTheDocument();
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });
});
