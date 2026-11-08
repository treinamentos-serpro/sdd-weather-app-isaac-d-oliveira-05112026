import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const units = [
  { value: 'celsius', label: '°C' },
  { value: 'fahrenheit', label: '°F' },
] as const;

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex max-w-full gap-1 rounded-lg border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md"
    >
      {units.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={unit === option.value}
          onClick={() => {
            if (unit !== option.value) onChange(option.value);
          }}
          className="h-11 w-12 shrink-0 rounded-md font-medium text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-pressed:bg-accent-500 aria-pressed:hover:bg-accent-600"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
