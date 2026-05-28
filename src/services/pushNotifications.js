import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import {
  getNotificationPage,
  setNotificationBadge,
} from "@/repositories/notificationRepository";
import {
  getPushSettings,
  normalizePushSettings,
  setDeviceToken,
} from "@/repositories/settingsRepository";
import { getCurrentSession } from "@/repositories/source";
import { AppState, Platform } from "react-native";

let currentSettings = normalizePushSettings({});
let pollingTimer = null;
let appStateSubscription = null;
let lastUnreadCount = null;

function isNotificationEnabled(settings = currentSettings) {
  return Boolean(normalizePushSettings(settings).notificationOn);
}

export async function loadAndApplyPushSettings() {
  currentSettings = normalizePushSettings(await getPushSettings());
  return currentSettings;
}

export async function registerDeviceForPush() {
  const session = await getCurrentSession();
  if (!session?.token) return null;

  const devtype = Platform.OS === "ios" ? "0" : "1";
  await loadAndApplyPushSettings();

  return setDeviceToken(DEFAULT_DEVICE_TOKEN, devtype);
}

export async function refreshNotificationBadge({ notifyIfNew = false } = {}) {
  const session = await getCurrentSession();
  if (!session?.token) {
    setNotificationBadge(0);
    lastUnreadCount = null;
    return null;
  }

  const page = await getNotificationPage({
    index: 0,
    count: 20,
    mergeWithExisting: true,
  });
  const unreadCount = Number(page?.unreadCount || 0);

  setNotificationBadge(unreadCount);

  if (
    notifyIfNew &&
    isNotificationEnabled() &&
    lastUnreadCount !== null &&
    unreadCount > lastUnreadCount
  ) {
    console.info("[PUSH] Có thông báo mới", { unreadCount });
  }

  lastUnreadCount = unreadCount;
  return page;
}

export function startInAppNotificationRuntime() {
  stopInAppNotificationRuntime();

  loadAndApplyPushSettings().catch((error) => {
    console.info("[PUSH] Không thể tải cài đặt thông báo", error.message);
  });

  refreshNotificationBadge().catch((error) => {
    console.info("[PUSH] Không thể tải badge thông báo", error.message);
  });

  pollingTimer = setInterval(() => {
    if (AppState.currentState !== "active") return;

    refreshNotificationBadge({ notifyIfNew: true }).catch((error) => {
      console.info("[PUSH] Không thể refresh badge", error.message);
    });
  }, 30_000);

  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") return;

    refreshNotificationBadge({ notifyIfNew: true }).catch((error) => {
      console.info("[PUSH] Không thể refresh badge khi resume", error.message);
    });
  });

  return stopInAppNotificationRuntime;
}

export function stopInAppNotificationRuntime() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }

  appStateSubscription?.remove?.();
  appStateSubscription = null;
}
