// Open-Meteo weather API helper — Ridderkerk coordinates
const LAT = 51.8728;
const LON = 4.6022;

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  hourlyForecast: {
    time: string;
    temperature: number;
    weatherCode: number;
  }[];
}

// WMO Weather interpretation codes → Dutch labels + emoji
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Onbewolkt", icon: "☀️" },
  1: { label: "Overwegend helder", icon: "🌤️" },
  2: { label: "Halfbewolkt", icon: "⛅" },
  3: { label: "Bewolkt", icon: "☁️" },
  45: { label: "Mist", icon: "🌫️" },
  48: { label: "Rijpmist", icon: "🌫️" },
  51: { label: "Lichte motregen", icon: "🌦️" },
  53: { label: "Motregen", icon: "🌦️" },
  55: { label: "Zware motregen", icon: "🌧️" },
  56: { label: "IJzige motregen", icon: "🌧️" },
  57: { label: "Zware ijzige motregen", icon: "🌧️" },
  61: { label: "Lichte regen", icon: "🌧️" },
  63: { label: "Regen", icon: "🌧️" },
  65: { label: "Zware regen", icon: "🌧️" },
  66: { label: "IJzige regen", icon: "🌧️" },
  67: { label: "Zware ijzige regen", icon: "🌧️" },
  71: { label: "Lichte sneeuw", icon: "🌨️" },
  73: { label: "Sneeuw", icon: "🌨️" },
  75: { label: "Zware sneeuw", icon: "❄️" },
  77: { label: "Korrelsneeuw", icon: "🌨️" },
  80: { label: "Lichte buien", icon: "🌦️" },
  81: { label: "Buien", icon: "🌧️" },
  82: { label: "Zware buien", icon: "⛈️" },
  85: { label: "Lichte sneeuwbuien", icon: "🌨️" },
  86: { label: "Zware sneeuwbuien", icon: "❄️" },
  95: { label: "Onweer", icon: "⛈️" },
  96: { label: "Onweer met hagel", icon: "⛈️" },
  99: { label: "Zwaar onweer met hagel", icon: "⛈️" },
};

export function getWeatherInfo(code: number): { label: string; icon: string } {
  return WEATHER_CODES[code] ?? { label: "Onbekend", icon: "❓" };
}

export async function fetchWeather(): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m,precipitation"
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const c = data.current;

  // Pick next 6 hours of hourly forecast from now
  const nowHour = new Date().getHours();
  const hourly = (data.hourly?.time as string[])
    .map((time: string, i: number) => ({
      time,
      temperature: data.hourly.temperature_2m[i] as number,
      weatherCode: data.hourly.weather_code[i] as number,
    }))
    .filter((_: unknown, i: number) => i >= nowHour && i < nowHour + 6);

  return {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    weatherCode: c.weather_code,
    isDay: c.is_day === 1,
    windSpeed: c.wind_speed_10m,
    humidity: c.relative_humidity_2m,
    precipitation: c.precipitation,
    hourlyForecast: hourly,
  };
}
