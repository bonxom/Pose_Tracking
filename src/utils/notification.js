import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATION_POLL_INTERVAL_KEY = "notification_poll_interval";
export const DEFAULT_POLL_INTERVAL = 30000; // 30s

export async function getNotificationPollInterval() {
  try {
    const saved = await AsyncStorage.getItem(NOTIFICATION_POLL_INTERVAL_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (Number.isInteger(parsed) && parsed >= 5000) {
        return parsed;
      }
    }
  } catch (error) {
    console.log("Failed to load poll interval from storage:", error?.message);
  }

  return DEFAULT_POLL_INTERVAL;
}

export async function setNotificationPollInterval(ms) {
  try {
    const value = parseInt(ms, 10);
    if (Number.isInteger(value) && value >= 5000) {
      await AsyncStorage.setItem(NOTIFICATION_POLL_INTERVAL_KEY, String(value));
      return true;
    }
  } catch (error) {
    console.log("Failed to save poll interval to storage:", error?.message);
  }
  return false;
}
