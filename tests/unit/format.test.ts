import { describe, expect, it } from 'vitest';
import { formatDayLabel, getShortDate } from '../../src/lib/format';

describe('formatDayLabel', () => {
  it('identifica hoje e amanhã pelo calendário local de São Paulo, não pela data UTC', () => {
    expect(formatDayLabel('2026-11-04', 'America/Sao_Paulo', '2026-11-05T01:00:00Z')).toBe('Hoje');
    expect(formatDayLabel('2026-11-05', 'America/Sao_Paulo', '2026-11-05T01:00:00Z')).toBe(
      'Amanhã',
    );
  });

  it('identifica hoje no calendário de Tóquio quando a data UTC ainda é anterior', () => {
    expect(formatDayLabel('2026-11-06', 'Asia/Tokyo', '2026-11-05T18:00:00Z')).toBe('Hoje');
    expect(formatDayLabel('2026-11-05', 'Asia/Tokyo', '2026-11-05T18:00:00Z')).toBe('qui.');
  });

  it('formata o dia local em pt-BR sem deslocá-lo pelo offset do fuso', () => {
    expect(formatDayLabel('2026-11-06', 'America/Sao_Paulo', '2026-11-05T13:00:00Z')).toBe(
      'Amanhã',
    );
    expect(formatDayLabel('2026-11-07', 'Pacific/Kiritimati', '2026-11-04T13:00:00Z')).toBe(
      'sáb.',
    );
  });

  it.each(['', 'invalid', '2026-02-30', '2026-13-01', '2026-11-5'])('rejeita a data %s', (date) => {
    expect(formatDayLabel(date, 'America/Sao_Paulo', '2026-11-05T13:00:00Z')).toBe('Indisponível');
  });

  it('rejeita fuso e referência inválidos', () => {
    expect(formatDayLabel('2026-11-05', 'Invalid/Timezone', '2026-11-05T13:00:00Z')).toBe(
      'Indisponível',
    );
    expect(formatDayLabel('2026-11-05', 'America/Sao_Paulo', 'invalid')).toBe('Indisponível');
  });
});

describe('getShortDate', () => {
  it('formata a data como dia/mês sem deslocamento de fuso', () => {
    expect(getShortDate('2026-11-06')).toBe('06/11');
  });

  it.each(['', 'invalid', '2026-02-30', '2026-13-01', '2026-11-6'])(
    'retorna indisponível para a data inválida %s',
    (date) => {
      expect(getShortDate(date)).toBe('Indisponível');
    },
  );
});
