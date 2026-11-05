import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Snowflake,
  Sun,
} from 'lucide-react';
import { getWeatherCondition, type WeatherIcon as WeatherIconName } from '../lib/weatherCodes';

interface WeatherIconProps {
  code: number | null;
  className?: string;
}

const weatherIcons: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  snowflake: Snowflake,
  thunderstorm: CloudLightning,
};

export default function WeatherIcon({ code, className }: WeatherIconProps) {
  const { icon } = getWeatherCondition(code);
  if (icon === null) return null;
  const Icon = weatherIcons[icon];
  return <Icon aria-hidden="true" className={className} />;
}
