export type WeatherIcon =
  | 'sun'
  | 'cloud-sun'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'snowflake'
  | 'thunderstorm';

interface WeatherCondition {
  label: string;
  icon: WeatherIcon | null;
}

const conditions: Record<number, WeatherCondition> = {
  0: { label: 'Céu limpo', icon: 'sun' },
  1: { label: 'Predominantemente limpo', icon: 'cloud-sun' },
  2: { label: 'Parcialmente nublado', icon: 'cloud-sun' },
  3: { label: 'Nublado', icon: 'cloud' },
  45: { label: 'Nevoeiro', icon: 'fog' },
  48: { label: 'Nevoeiro com geada', icon: 'fog' },
  51: { label: 'Garoa leve', icon: 'drizzle' },
  53: { label: 'Garoa moderada', icon: 'drizzle' },
  55: { label: 'Garoa intensa', icon: 'drizzle' },
  56: { label: 'Garoa congelante leve', icon: 'drizzle' },
  57: { label: 'Garoa congelante intensa', icon: 'drizzle' },
  61: { label: 'Chuva leve', icon: 'rain' },
  63: { label: 'Chuva moderada', icon: 'rain' },
  65: { label: 'Chuva forte', icon: 'rain' },
  66: { label: 'Chuva congelante leve', icon: 'rain' },
  67: { label: 'Chuva congelante forte', icon: 'rain' },
  71: { label: 'Neve leve', icon: 'snow' },
  73: { label: 'Neve moderada', icon: 'snow' },
  75: { label: 'Neve intensa', icon: 'snow' },
  77: { label: 'Grãos de neve', icon: 'snowflake' },
  80: { label: 'Pancadas de chuva leves', icon: 'rain' },
  81: { label: 'Pancadas de chuva moderadas', icon: 'rain' },
  82: { label: 'Pancadas de chuva fortes', icon: 'rain' },
  85: { label: 'Pancadas de neve leves', icon: 'snow' },
  86: { label: 'Pancadas de neve fortes', icon: 'snow' },
  95: { label: 'Trovoada', icon: 'thunderstorm' },
  96: { label: 'Trovoada com granizo leve', icon: 'thunderstorm' },
  99: { label: 'Trovoada com granizo forte', icon: 'thunderstorm' },
};

export function getWeatherCondition(code: number | null): WeatherCondition {
  return (
    (code === null ? undefined : conditions[code]) ?? {
      label: 'Indisponível',
      icon: null,
    }
  );
}
