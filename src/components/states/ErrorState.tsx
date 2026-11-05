import { CircleAlert, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}

export default function ErrorState({ message, onRetry, disabled = false }: ErrorStateProps) {
  return (
    <div role="alert" className="w-full min-w-0 py-8 text-white">
      <CircleAlert aria-hidden="true" className="mb-3 h-8 w-8 text-sun" />
      <h2 className="break-words text-lg font-semibold">Erro ao consultar o clima</h2>
      <p className="mt-2 text-sm text-white/70 [overflow-wrap:anywhere]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-3 text-sm font-medium text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCw aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="min-w-0 break-words">Tentar novamente</span>
      </button>
    </div>
  );
}
