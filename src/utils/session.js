import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_SESSION_KEY = "pose_tracking.auth_session.v1";
const authSessionListeners = new Set();

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

function emitAuthSession(session) {
  authSessionListeners.forEach((listener) => {
    try {
      listener(session);
    } catch (error) {
      console.warn("AUTH_SESSION_LISTENER_ERROR", error);
    }
  });
}

export function subscribeAuthSession(listener) {
  authSessionListeners.add(listener);
  return () => {
    authSessionListeners.delete(listener);
  };
}

export async function saveAuthSession(session) {
  const value = JSON.stringify(session);

  if (canUseWebStorage()) {
    localStorage.setItem(AUTH_SESSION_KEY, value);
    emitAuthSession(session);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, value);
  emitAuthSession(session);
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
    emitAuthSession(null);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
  emitAuthSession(null);
}
