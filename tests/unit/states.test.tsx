import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia carregamento com role status e texto padrão', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados do clima...');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('aceita uma mensagem específica', () => {
    render(<LoadingState message="Buscando cidades..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades...');
  });

  it('remove o indicador quando deixa de ser renderizado', () => {
    const { rerender } = render(<LoadingState />);
    rerender(<EmptyState />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Carregando dados do clima...')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('anuncia a mensagem de erro e chama retry uma vez ao clicar', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha de conexão." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de conexão.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('permite tentar novamente com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha de conexão." onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('bloqueia retry quando disabled e permite após atualização da prop', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <ErrorState message="Limite temporário." onRetry={onRetry} disabled />,
    );

    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).not.toHaveBeenCalled();

    rerender(<ErrorState message="Limite temporário." onRetry={onRetry} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('não submete um formulário ao acionar retry', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Falha de conexão." onRetry={vi.fn()} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('mostra título e dica do estado inicial', () => {
    render(<EmptyState />);

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade selecionada' })).toBeInTheDocument();
    expect(screen.getByText('Busque uma cidade para consultar o clima.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('permite distinguir cidade não encontrada do estado inicial', () => {
    render(<EmptyState title="Cidade não encontrada" hint="Tente outro nome de cidade." />);

    expect(screen.getByRole('region', { name: 'Cidade não encontrada' })).toBeInTheDocument();
    expect(screen.getByText('Tente outro nome de cidade.')).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma cidade selecionada')).not.toBeInTheDocument();
  });

  it('oferece ação opcional de busca acessível por teclado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<EmptyState onSearch={onSearch} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Buscar cidade' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
