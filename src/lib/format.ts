export function formatDayLabel(localDate: string, timezone: string, referenceTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return 'Indisponível';

  const date = new Date(`${localDate}T12:00:00.000Z`);
  const reference = new Date(referenceTime);
  if (
    !Number.isFinite(date.getTime()) ||
    !Number.isFinite(reference.getTime()) ||
    date.toISOString().slice(0, 10) !== localDate
  ) {
    return 'Indisponível';
  }

  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(reference);
    const calendar = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const today = `${calendar.year}-${calendar.month}-${calendar.day}`;
    if (localDate === today) return 'Hoje';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
      weekday: 'short',
    }).format(date);
  } catch {
    return 'Indisponível';
  }
}
