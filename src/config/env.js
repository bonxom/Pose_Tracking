export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://group1.it4788.sukkaito.id.vn/it4788";

export const API_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 4500,
);

export const API_TYPES = {
  BACKEND: "backend",
  MOCK: "mock",
};

const requestedApiType =
  process.env.EXPO_PUBLIC_API_TYPE || process.env.API_TYPE;

export const API_TYPE =
  requestedApiType === API_TYPES.MOCK ? API_TYPES.MOCK : API_TYPES.BACKEND;

export const API_DEBUG =
  process.env.EXPO_PUBLIC_API_DEBUG === "1" ||
  process.env.EXPO_PUBLIC_API_DEBUG === "true";

export const DEFAULT_DEVICE_TOKEN =
  process.env.EXPO_PUBLIC_DEVICE_TOKEN || "123456";
