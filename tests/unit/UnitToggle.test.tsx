import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it.each<Unit>(['celsius', 'fahrenheit'])('identifica o grupo e a unidade ativa %s', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: '°C' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'celsius'),
    );
    expect(within(group).getByRole('button', { name: '°F' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'fahrenheit'),
    );
  });

  it.each([
    { unit: 'celsius', target: '°F', expected: 'fahrenheit' },
    { unit: 'fahrenheit', target: '°C', expected: 'celsius' },
  ] as const)('notifica a mudança de $unit para $expected', async ({ unit, target, expected }) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit={unit} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: target }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it('reflete a prop atualizada sem manter seleção interna', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C', pressed: false })).toBeInTheDocument();
  });

  it('não notifica novamente ao ativar a unidade já selecionada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°C' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('permite navegar com Tab e Shift+Tab e ativar com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenNthCalledWith(1, 'fahrenheit');

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(2, 'celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('não submete um formulário ao trocar a unidade', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
