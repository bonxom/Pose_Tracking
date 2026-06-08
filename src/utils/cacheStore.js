import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Cache keys ────────────────────────────────────────────────────────────────
export const CACHE_KEY_HOME_FEED = "cache.home.feed";
export const CACHE_KEY_COURSES_FEED = "cache.courses.feed";
export const CACHE_KEY_PROFILE = "cache.profile"; // only used for the current user (me)
export const CACHE_KEY_CREATEPOST_DRAFT = "cache.createpost.draft";
export const USER_SCOPED_CACHE_KEYS = [
  CACHE_KEY_PROFILE,
  CACHE_KEY_HOME_FEED,
  CACHE_KEY_COURSES_FEED,
  CACHE_KEY_CREATEPOST_DRAFT,
];

export function getProfileCacheOwnerKey(session = {}) {
  return String(
    session?.id ||
      session?.user_id ||
      session?.identifier ||
      session?.phonenumber ||
      session?.username ||
      "",
  ).trim();
}

export function isProfileCacheValidForSession(cacheValue, session = {}) {
  if (!cacheValue?.profile) return false;

  const ownerKey = getProfileCacheOwnerKey(session);
  if (!ownerKey) return false;

  const cachedOwnerKey = String(cacheValue?.ownerKey || "").trim();
  if (!cachedOwnerKey) return false;

  return cachedOwnerKey === ownerKey;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read a cached value from disk.
 * @param {string} key
 * @returns {Promise<any | null>} parsed value or null on miss/error
 */
export async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write a value to disk cache. Fire-and-forget — errors are silently ignored.
 * @param {string} key
 * @param {any} value  Must be JSON-serializable.
 */
export function writeCache(key, value) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

/**
 * Remove a single cache entry.
 * @param {string} key
 */
export function clearCache(key) {
  AsyncStorage.removeItem(key).catch(() => {});
}

export async function removeCache(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function clearUserScopedDiskCaches() {
  try {
    await AsyncStorage.multiRemove(USER_SCOPED_CACHE_KEYS);
  } catch {
    await Promise.all(USER_SCOPED_CACHE_KEYS.map((key) => removeCache(key)));
  }
}
