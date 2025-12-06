// frontend/src/types.ts

export const API_BASE_URL = "http://localhost:3000";
export const AUTH_STORAGE_KEY = "gdash_auth";

export type AuthUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

export type AuthState = {
  token: string;
  user: AuthUser;
};

export type WeatherLog = {
  id?: string;
  _id?: string;
  timestamp?: string | Date | null;
  location?: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
  source?: string;
};

export type TemperatureTrend = "subindo" | "caindo" | "estavel" | null;

export type WeatherInsights = {
  count: number;
  averageTemperature: number | null;
  averageHumidity: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  trend: TemperatureTrend;
  comfortIndex: number | null;
  summary: string;
};

export type MaybeDate = string | Date | null | undefined;

export type UserListItem = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

const parseDate = (value: MaybeDate): Date | null => {
  if (!value) {
    return null;
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const formatDateTime = (value: MaybeDate): string => {
  const date = parseDate(value);
  if (!date) {
    return "—";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatNumber = (
  value: number | null | undefined,
  digits: number,
): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toFixed(digits).replace(".", ",");
};
