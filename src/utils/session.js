import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const AUTH_SESSION_KEY = "pose_tracking.auth_session.v1";
const SESSION_FILENAME = "pose_tracking.auth_session.v1.json";
const STORAGE_TIMEOUT_MS = 1500;
const SESSION_FILE_PATH = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}${SESSION_FILENAME}`
  : null;

function timeoutFallback(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), STORAGE_TIMEOUT_MS);
  });
}

function withTimeout(promise, fallbackValue) {
  return Promise.race([promise, timeoutFallback(fallbackValue)]);
}

function canUseWebStorage() {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") {
    return false;
  }

  try {
    localStorage.setItem("__session_probe__", "1");
    localStorage.removeItem("__session_probe__");
    return true;
  } catch {
    return false;
  }
}

function safeParseSession(rawSession) {
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

async function setNativeRawSession(value) {
  if (!SESSION_FILE_PATH) return;
  await withTimeout(FileSystem.writeAsStringAsync(SESSION_FILE_PATH, value), null);
}

async function getNativeRawSession() {
  if (!SESSION_FILE_PATH) return null;

  try {
    return await withTimeout(FileSystem.readAsStringAsync(SESSION_FILE_PATH), null);
  } catch {
    return null;
  }
}

async function clearNativeRawSession() {
  if (!SESSION_FILE_PATH) return;

  try {
    await withTimeout(FileSystem.deleteAsync(SESSION_FILE_PATH, { idempotent: true }), null);
  } catch {
    // Ignore cleanup errors.
  }
}

export async function saveAuthSession(session) {
  const serializedSession = JSON.stringify(session);

  if (canUseWebStorage()) {
    try {
      localStorage.setItem(AUTH_SESSION_KEY, serializedSession);
    } catch {
      // Do not break login flow when persistence fails.
    }
    return;
  }

  try {
    await setNativeRawSession(serializedSession);
  } catch {
    // Do not break login flow when persistence fails.
  }
}

export async function getAuthSession() {
  if (canUseWebStorage()) {
    try {
      const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
      const parsedSession = safeParseSession(rawSession);

      if (!rawSession || parsedSession) {
        return parsedSession;
      }

      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    } catch {
      return null;
    }
  }

  try {
    const rawSession = await getNativeRawSession();
    const parsedSession = safeParseSession(rawSession);

    if (!rawSession || parsedSession) {
      return parsedSession;
    }

    await clearNativeRawSession();
    return null;
  } catch {
    return null;
  }
}

export async function clearAuthSession() {
  if (canUseWebStorage()) {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Ignore cleanup errors.
    }
    return;
  }

  try {
    await clearNativeRawSession();
  } catch {
    // Ignore cleanup errors.
  }
}
