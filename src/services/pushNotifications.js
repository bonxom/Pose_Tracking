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
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";

const VOICE_SOUND = "voice_notification.wav";
const SMS_SOUND = "sms_notification.wav";

function getNotificationSound(settings = {}) {
  return toBool(settings.soundOn, true) ? VOICE_SOUND : SMS_SOUND;
}

function getNotificationChannelId(settings = {}) {
  return toBool(settings.soundOn, true) ? "push-voice" : "push-sms";
}

let currentSettings = normalizePushSettings({});
let pollingTimer = null;
let appStateSubscription = null;
let receivedSubscription = null;
let responseSubscription = null;
let lastUnreadCount = null;

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  return String(value) === "1" || String(value).toLowerCase() === "true";
}

async function applyAndroidChannel(settings = currentSettings) {
  if (Platform.OS !== "android") return;

  const vibrateOn = toBool(settings.vibrantOn, true);
  const ledOn = toBool(settings.ledOn, true);

  await Notifications.setNotificationChannelAsync("push-voice", {
    name: "Thông báo giọng nói",
    importance: Notifications.AndroidImportance.HIGH,
    sound: VOICE_SOUND,
    enableVibrate: vibrateOn,
    vibrationPattern: vibrateOn ? [0, 250, 250, 250] : [0],
    lightColor: ledOn ? "#1877F2" : undefined,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync("push-sms", {
    name: "Thông báo SMS",
    importance: Notifications.AndroidImportance.HIGH,
    sound: SMS_SOUND,
    enableVibrate: vibrateOn,
    vibrationPattern: vibrateOn ? [0, 250, 250, 250] : [0],
    lightColor: ledOn ? "#1877F2" : undefined,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function loadAndApplyPushSettings() {
  try {
    const data = await getPushSettings();
    currentSettings = normalizePushSettings(data);
  } catch (error) {
    console.log("LOAD_PUSH_SETTINGS_ERROR", error?.message);
  }

  await applyAndroidChannel(currentSettings);

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const notificationOn = toBool(currentSettings.notificationOn, true);

      return {
        shouldShowBanner: notificationOn,
        shouldShowList: notificationOn,
        shouldPlaySound: notificationOn,
        shouldSetBadge: notificationOn,
      };
    },
  });

  return currentSettings;
}

export async function registerDeviceForPush() {
  const session = await getCurrentSession();

  if (!session?.token) {
    return null;
  }

  await loadAndApplyPushSettings();

  if (Platform.OS === "web") {
    return null;
  }

  const devtype = Platform.OS === "ios" ? "0" : "1";
  const isExpoGo = Constants.appOwnership === "expo";

  if (Platform.OS === "android" && isExpoGo) {
    console.warn(
      "Skip remote push registration: Expo Go Android SDK 53+ does not support remote push notifications.",
    );

    await setDeviceToken(DEFAULT_DEVICE_TOKEN, devtype);
    return DEFAULT_DEVICE_TOKEN;
  }

  if (!Device.isDevice) {
    await setDeviceToken(DEFAULT_DEVICE_TOKEN, devtype);
    return DEFAULT_DEVICE_TOKEN;
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync();
  const devtoken = tokenResult.data;

  await setDeviceToken(devtoken, devtype);

  return devtoken;
}

async function showLocalNotificationForNewItems(unreadCount) {
  if (!toBool(currentSettings.notificationOn, true)) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Bạn có thông báo mới",
      body: `Bạn có ${unreadCount} thông báo chưa đọc.`,
      sound: getNotificationSound(currentSettings),
      data: {
        screen: "notifications",
      },
    },
    trigger:
      Platform.OS === "android"
        ? {
            seconds: 1,
            channelId: getNotificationChannelId(currentSettings),
          }
        : null,
  });
}

export async function refreshNotificationBadge({
  notifyIfNew = false,
  getCurrentPath,
  onNewInAppNotification,
} = {}) {
  const page = await getNotificationPage({
    index: 0,
    count: 20,
    mergeWithExisting: true,
  });

  const unreadCount = Number(page?.unreadCount || 0);

  setNotificationBadge(unreadCount);

  const currentPath = String(getCurrentPath?.() || "");
  const isInNotificationsScreen =
    currentPath === "/notifications" ||
    currentPath === "/(tabs)/notifications" ||
    currentPath.endsWith("/notifications");

  if (
    notifyIfNew &&
    lastUnreadCount !== null &&
    unreadCount > lastUnreadCount &&
    !isInNotificationsScreen
  ) {
    console.log("NEW_IN_APP_NOTIFICATION", {
      currentPath,
      lastUnreadCount,
      unreadCount,
    });

    onNewInAppNotification?.({
      unreadCount,
      previousUnreadCount: lastUnreadCount,
      page,
    });

    await showLocalNotificationForNewItems(unreadCount);
  }

  lastUnreadCount = unreadCount;

  return page;
}

export function startInAppNotificationRuntime({
  onOpen,
  getCurrentPath,
  onNewInAppNotification,
} = {}) {
  stopInAppNotificationRuntime();

  loadAndApplyPushSettings().catch((error) => {
    console.log("START_PUSH_SETTINGS_ERROR", error?.message);
  });

  refreshNotificationBadge({
    notifyIfNew: false,
    getCurrentPath,
    onNewInAppNotification,
  }).catch((error) => {
    console.log("LOAD_NOTIFICATION_BADGE_ERROR", error?.message);
  });

  pollingTimer = setInterval(() => {
    if (AppState.currentState !== "active") return;

    refreshNotificationBadge({
      notifyIfNew: true,
      getCurrentPath,
      onNewInAppNotification,
    }).catch((error) => {
      console.log("POLL_NOTIFICATION_ERROR", error?.message);
    });
  }, 30000);

  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      refreshNotificationBadge({
        notifyIfNew: true,
        getCurrentPath,
        onNewInAppNotification,
      }).catch((error) => {
        console.log("RESUME_NOTIFICATION_ERROR", error?.message);
      });
    }
  });

  receivedSubscription = Notifications.addNotificationReceivedListener(() => {
    refreshNotificationBadge({
      notifyIfNew: false,
      getCurrentPath,
      onNewInAppNotification,
    }).catch((error) => {
      console.log("RECEIVE_PUSH_REFRESH_ERROR", error?.message);
    });
  });

  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    () => {
      onOpen?.();
    },
  );

  return stopInAppNotificationRuntime;
}

export function stopInAppNotificationRuntime() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }

  appStateSubscription?.remove?.();
  appStateSubscription = null;

  receivedSubscription?.remove?.();
  receivedSubscription = null;

  responseSubscription?.remove?.();
  responseSubscription = null;
}
