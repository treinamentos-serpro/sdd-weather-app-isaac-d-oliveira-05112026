import { type FormEvent, useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const [city, setCity] = useState('');
  const query = city.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || !query) return;
    onSearch(query);
  }

  return (
    <form role="search" aria-label="Buscar cidade" onSubmit={handleSubmit} className="w-full">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-white">
        Cidade
      </label>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="search"
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={disabled}
          className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-white/40 bg-white/5 px-4 py-3 text-white shadow-glass backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !query}
          className="min-h-11 shrink-0 rounded-lg bg-accent-500 px-5 py-3 font-medium text-white enabled:hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
