import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Cache keys ────────────────────────────────────────────────────────────────
export const CACHE_KEY_HOME_FEED = "cache.home.feed";
export const CACHE_KEY_COURSES_FEED = "cache.courses.feed";
export const CACHE_KEY_PROFILE = "cache.profile"; // only used for the current user (me)

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
