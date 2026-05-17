export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://group1.it4788.sukkaito.id.vn/it4788";

export const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 4500);

const requestedSource = process.env.EXPO_PUBLIC_DATA_SOURCE || "server";
export const DATA_SOURCE_MODE = ["auto", "server", "local"].includes(requestedSource)
  ? requestedSource
  : "auto";

export const API_DEBUG =
  process.env.EXPO_PUBLIC_API_DEBUG === "1" ||
  process.env.EXPO_PUBLIC_API_DEBUG === "true";

export const DEFAULT_DEVICE_TOKEN =
  process.env.EXPO_PUBLIC_DEVICE_TOKEN || "expo-web-demo";
