import { MapPin, Search } from 'lucide-react';
import { useId } from 'react';

interface EmptyStateProps {
  title?: string;
  hint?: string;
  onSearch?: () => void;
}

export default function EmptyState({
  title = 'Nenhuma cidade selecionada',
  hint = 'Busque uma cidade para consultar o clima.',
  onSearch,
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 py-8 text-white">
      <MapPin aria-hidden="true" className="mb-3 h-8 w-8 text-accent-400" />
      <h2 id={headingId} className="text-lg font-semibold [overflow-wrap:anywhere]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-white/70 [overflow-wrap:anywhere]">{hint}</p>
      {onSearch && (
        <button
          type="button"
          onClick={onSearch}
          className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-3 text-sm font-medium text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">Buscar cidade</span>
        </button>
      )}
    </section>
  );
}
