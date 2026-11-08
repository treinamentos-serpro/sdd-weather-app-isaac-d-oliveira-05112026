import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

const props = {
  day: mockWeatherData.forecast[0],
  timezone: mockWeatherData.timezone,
  referenceTime: mockWeatherData.fetchedAt,
};

describe('ForecastCard', () => {
  it('mostra o dia, condição e temperaturas sem métricas sem suporte', () => {
    render(<ForecastCard {...props} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toHaveAttribute('datetime', '2026-11-05');
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('Máxima').nextElementSibling).toHaveTextContent('25 °C');
    expect(screen.getByText('Mínima').nextElementSibling).toHaveTextContent('16 °C');
    expect(screen.queryByText('Probabilidade de chuva')).not.toBeInTheDocument();
  });

  it('atualiza as temperaturas entre unidades', () => {
    const { rerender } = render(<ForecastCard {...props} unit="celsius" />);
    rerender(<ForecastCard {...props} unit="fahrenheit" />);

    expect(screen.getByText('Máxima').nextElementSibling).toHaveTextContent('77 °F');
    expect(screen.getByText('Mínima').nextElementSibling).toHaveTextContent('61 °F');
    expect(screen.queryByText('Probabilidade de chuva')).not.toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Amanhã' })).toBeInTheDocument();
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });
});
