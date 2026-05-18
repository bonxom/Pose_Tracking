export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://group1.it4788.sukkaito.id.vn/it4788";

export const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 4500);

export const API_TYPES = {
  BACKEND: "backend",
  MOCK: "mock",
};

const requestedApiType = process.env.EXPO_PUBLIC_API_TYPE || process.env.API_TYPE || "";
const requestedSource = process.env.EXPO_PUBLIC_DATA_SOURCE || "";
const normalizedRequestedApiType = [API_TYPES.BACKEND, API_TYPES.MOCK].includes(requestedApiType)
  ? requestedApiType
  : "";
const normalizedLegacySource = ["auto", "server", "local"].includes(requestedSource)
  ? requestedSource
  : "";

function apiTypeFromLegacySource(source) {
  return source === "local" ? API_TYPES.MOCK : API_TYPES.BACKEND;
}

export const API_TYPE =
  normalizedRequestedApiType ||
  apiTypeFromLegacySource(normalizedLegacySource) ||
  API_TYPES.BACKEND;

export const DATA_SOURCE_MODE = normalizedRequestedApiType
  ? API_TYPE === API_TYPES.MOCK
    ? "local"
    : "server"
  : normalizedLegacySource || (API_TYPE === API_TYPES.MOCK ? "local" : "server");

export const API_DEBUG =
  process.env.EXPO_PUBLIC_API_DEBUG === "1" ||
  process.env.EXPO_PUBLIC_API_DEBUG === "true";

export const DEFAULT_DEVICE_TOKEN =
  process.env.EXPO_PUBLIC_DEVICE_TOKEN || "expo-web-demo";
