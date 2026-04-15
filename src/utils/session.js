import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_SESSION_KEY = "pose_tracking.auth_session.v1";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof localStorage !== "undefined";
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveAuthSession(session) {
  const value = JSON.stringify(session);

  if (canUseWebStorage()) {
    localStorage.setItem(AUTH_SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, value);
}

export async function getAuthSession() {
  if (canUseWebStorage()) {
    return safeParse(localStorage.getItem(AUTH_SESSION_KEY));
  }

  const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
  return safeParse(raw);
}

export async function clearAuthSession() {
  if (canUseWebStorage()) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}