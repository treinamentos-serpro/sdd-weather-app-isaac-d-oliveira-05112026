import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

const props = {
  forecast: mockWeatherData.forecast,
  timezone: mockWeatherData.timezone,
  referenceTime: mockWeatherData.fetchedAt,
};

describe('ForecastList', () => {
  it('renderiza exatamente cinco dias em lista acessível', () => {
    render(<ForecastList {...props} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'sex.' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('exibe estado vazio sem criar cards', () => {
    render(<ForecastList {...props} forecast={[]} unit="celsius" />);

    expect(screen.getByRole('status')).toHaveTextContent('Previsão indisponível.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('preserva os dias disponíveis e sinaliza previsão curta', () => {
    render(<ForecastList {...props} forecast={props.forecast.slice(0, 2)} unit="celsius" />);

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('Previsão incompleta.');
  });

  it('sinaliza campos ausentes sem preenchê-los com zero', () => {
    const forecast = props.forecast.map((day) => ({ ...day, minimumC: null }));
    render(<ForecastList {...props} forecast={forecast} unit="celsius" />);

    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent('Previsão incompleta.');
    expect(screen.queryByText('0 °C')).not.toBeInTheDocument();
  });

  it('sinaliza datas não consecutivas sem fabricar o dia ausente', () => {
    const forecast = props.forecast.map((day, index) =>
      index === 4 ? { ...day, localDate: '2026-11-10' } : day,
    );
    render(<ForecastList {...props} forecast={forecast} unit="celsius" />);

    expect(screen.getByRole('status')).toHaveTextContent('Previsão incompleta.');
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('não chama um dia antigo de hoje', () => {
    render(<ForecastList {...props} unit="celsius" referenceTime="2026-11-06T13:00:00Z" />);

    expect(screen.getByRole('status')).toHaveTextContent('Previsão incompleta.');
    expect(screen.getByRole('article', { name: 'Hoje' })).toHaveTextContent('Chuva leve');
  });

  it('atualiza a unidade em todos os cards', () => {
    const { rerender } = render(<ForecastList {...props} unit="celsius" />);
    expect(screen.getByText('25 °C')).toBeInTheDocument();

    rerender(<ForecastList {...props} unit="fahrenheit" />);

    expect(screen.getByText('77 °F')).toBeInTheDocument();
    expect(screen.queryByText('25 °C')).not.toBeInTheDocument();
  });
});
