import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

afterEach(cleanup);

describe('SearchBar', () => {
  it('expõe um formulário de busca e um campo com label acessível', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBe(screen.getByLabelText('Cidade'));
  });

  it.each(['', '   ', '\t\n'])('não busca com entrada vazia %j', (city) => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: city } });
    fireEvent.submit(screen.getByRole('search'));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
  });

  it('busca pelo botão removendo apenas os espaços das extremidades', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), "  São João d'Aliança  ");
    expect(onSearch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith("São João d'Aliança");
  });

  it('permite focar e enviar a busca por teclado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.tab();
    expect(screen.getByLabelText('Cidade')).toHaveFocus();
    await user.type(screen.getByLabelText('Cidade'), 'Belo Horizonte{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Belo Horizonte');
  });

  it('desabilita campo e botão e bloqueia submissões quando disabled é true', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByLabelText('Cidade'), 'Recife');

    rerender(<SearchBar onSearch={onSearch} disabled />);
    expect(screen.getByLabelText('Cidade')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });
});
