import { LoaderCircle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Carregando dados do clima...',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex w-full min-w-0 items-center gap-3 py-8 text-white"
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-6 w-6 shrink-0 text-accent-400 motion-safe:animate-spin"
      />
      <p className="min-w-0 text-sm [overflow-wrap:anywhere]">{message}</p>
    </div>
  );
}
