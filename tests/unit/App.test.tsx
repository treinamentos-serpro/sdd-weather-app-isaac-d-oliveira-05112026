import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getMockWeather } from '../../src/services/mockWeatherService';
import type { WeatherData } from '../../src/types/weather';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('App', () => {
  it('monta header, clima, previsão e avisos usando o mock', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Weather App', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByText(/Dados de demonstração/)).toHaveTextContent(
      'Não oferecemos alertas de emergência.',
    );
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
  });

  it('mantém a unidade na UI e converte clima e previsão sem consultar dados', async () => {
    const user = userEvent.setup();
    const loadWeather = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App loadWeather={loadWeather} />);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('74 °F')).toBeInTheDocument();
    expect(screen.getByText('77 °F')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(mockWeatherData.current.temperatureC).toBe(23.4);
    expect(mockWeatherData.forecast[0].maximumC).toBe(25.1);
    expect(loadWeather).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('mostra idle e leva o foco ao campo pela ação de busca', async () => {
    const user = userEvent.setup();
    render(<App initialState={{ status: 'idle' }} />);

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade selecionada' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Buscar cidade' }));

    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toHaveFocus();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('mostra loading sem clima antigo e desabilita a busca', () => {
    render(<App initialState={{ status: 'loading' }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados do clima...');
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeDisabled();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('passa por loading e success mantendo a unidade escolhida', async () => {
    const user = userEvent.setup();
    let resolveWeather!: (data: WeatherData | null) => void;
    const pending = new Promise<WeatherData | null>((resolve) => {
      resolveWeather = resolve;
    });
    const loadWeather = vi.fn(() => pending);
    render(<App initialState={{ status: 'idle' }} loadWeather={loadWeather} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), '  São Paulo  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeDisabled();
    expect(loadWeather).toHaveBeenCalledExactlyOnceWith('São Paulo');
    await user.click(screen.getByRole('button', { name: '°F' }));
    await act(async () => {
      resolveWeather(mockWeatherData);
      await pending;
    });

    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('74 °F')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
  });

  it('recupera o foco no conteúdo após uma busca por teclado', async () => {
    const user = userEvent.setup();
    let resolveWeather!: (data: WeatherData | null) => void;
    const pending = new Promise<WeatherData | null>((resolve) => {
      resolveWeather = resolve;
    });
    render(<App loadWeather={() => pending} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'São Paulo{Enter}');
    await act(async () => {
      resolveWeather(mockWeatherData);
      await pending;
    });

    expect(screen.getByRole('main')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveFocus();
  });

  it('mostra empty quando a busca não tem correspondência', async () => {
    const user = userEvent.setup();
    render(<App loadWeather={vi.fn().mockResolvedValue(null)} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Curitiba');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(
      await screen.findByRole('heading', { name: 'Cidade não encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nenhum resultado para/)).toHaveTextContent('Curitiba');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('mostra error e repete a mesma consulta ao tentar novamente', async () => {
    const user = userEvent.setup();
    const loadWeather = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha simulada'))
      .mockResolvedValueOnce(mockWeatherData);
    render(<App loadWeather={loadWeather} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'São Paulo');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os dados do clima.',
    );
    expect(screen.getByRole('main')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(loadWeather).toHaveBeenCalledTimes(2);
    expect(loadWeather).toHaveBeenNthCalledWith(2, 'São Paulo');
  });

  it('aceita um estado de erro inicial para demonstração e retry', async () => {
    const user = userEvent.setup();
    const loadWeather = vi.fn().mockResolvedValue(mockWeatherData);
    render(
      <App
        initialState={{ status: 'error', query: 'São Paulo', message: 'Falha simulada.' }}
        loadWeather={loadWeather}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falha simulada.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
  });

  it('não busca com entrada vazia ou apenas espaços', async () => {
    const user = userEvent.setup();
    const loadWeather = vi.fn();
    render(<App loadWeather={loadWeather} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), '   ');
    await user.keyboard('{Enter}');

    expect(loadWeather).not.toHaveBeenCalled();
  });
});

describe('getMockWeather', () => {
  it('encontra o mock com acentos, capitalização e consulta parcial sem rede', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = getMockWeather('  SAO  ');
    await vi.advanceTimersByTimeAsync(600);

    expect(await response).toBe(mockWeatherData);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('retorna vazio para cidade desconhecida sem mudar a identidade do mock', async () => {
    vi.useFakeTimers();
    const response = getMockWeather('Curitiba');
    await vi.advanceTimersByTimeAsync(600);

    expect(await response).toBeNull();
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(await getMockWeather('  ')).toBeNull();
  });
});
