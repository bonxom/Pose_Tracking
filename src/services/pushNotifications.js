import {
  getNotificationPage,
  resetNotificationCache,
  setNotificationBadge,
} from "@/repositories/notificationRepository";
import {
  getPushSettings,
  normalizePushSettings,
  setDeviceToken,
} from "@/repositories/settingsRepository";
import { getCurrentSession } from "@/repositories/source";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";

const VOICE_SOUND = "voice_notification.wav";
const SMS_SOUND = "sms_notification.wav";

let currentSettings = normalizePushSettings({});
let pollingTimer = null;
let appStateSubscription = null;
let receivedSubscription = null;
let responseSubscription = null;
let lastUnreadCount = null;
let lastNotificationIds = new Set();

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

function getNotificationSound(settings = {}) {
  return toBool(settings.soundOn, true) ? VOICE_SOUND : undefined;
}

function getNotificationChannelId(settings = {}) {
  return toBool(settings.soundOn, true) ? "push-voice" : "push-sms";
}

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    Constants?.manifest2?.extra?.eas?.projectId ||
    null
  );
}

function isNotificationsPath(path = "") {
  const currentPath = String(path || "");

  return (
    currentPath === "/notifications" ||
    currentPath === "/(tabs)/notifications" ||
    currentPath.endsWith("/notifications")
  );
}

function getNotificationId(item = {}) {
  return String(
    item.notificationId ||
      item.id ||
      item.raw?.notificationId ||
      item.raw?.notification_id ||
      item.raw?.id ||
      "",
  ).trim();
}

function getNotificationTime(item = {}) {
  const time = new Date(
    item.created ||
      item.createdAt ||
      item.raw?.created ||
      item.raw?.created_at ||
      item.raw?.time ||
      0,
  ).getTime();

  return Number.isFinite(time) ? time : 0;
}

function isGenericNotificationBody(value = "") {
  const text = String(value || "").trim();

  return (
    !text ||
    text === "Có thông báo mới." ||
    text === "Có thông báo mới" ||
    text === "Bạn có thông báo mới." ||
    text === "Bạn có thông báo mới"
  );
}

function firstUsefulBody(...values) {
  return (
    values.find((value) => {
      const text = String(value || "").trim();
      return text && !isGenericNotificationBody(text);
    }) || ""
  );
}

function normalizeNotificationPreview(item = {}) {
  const raw = item.raw || {};

  const title = String(
    item.title ||
      raw.title ||
      raw.message ||
      raw.content ||
      "Báº¡n cÃ³ thÃ´ng bÃ¡o má»›i",
  ).trim();

  const body = String(
    firstUsefulBody(
      item.description,
      raw.description,

      raw.comment_content,
      raw.commentContent,

      raw.post_content,
      raw.postContent,
      raw.post_description,
      raw.postDescription,

      raw.content,
      raw.message,

      raw.post_title,
      raw.postTitle,

      item.body,
    ),
  ).trim();

  const avatar = String(
    item.avatar ||
      raw.avatar ||
      raw.user_avatar ||
      raw.sender_avatar ||
      raw.image ||
      raw.image_url ||
      raw.imageUrl ||
      raw.photo ||
      raw.actor?.avatar ||
      raw.user?.avatar ||
      "",
  ).trim();

  return {
    ...item,
    id: getNotificationId(item),
    title,
    body,
    avatar,
    targetType: item.targetType || raw.targetType || raw.target_type || "",
    targetId:
      item.targetId ||
      item.objectId ||
      raw.targetId ||
      raw.target_id ||
      raw.objectId ||
      raw.object_id ||
      raw.postId ||
      raw.post_id ||
      "",
    raw,
  };
}

function getLatestNewNotification(items = []) {
  const newItems = items
    .filter((item) => {
      const id = getNotificationId(item);
      return id && !lastNotificationIds.has(id);
    })
    .sort((a, b) => getNotificationTime(b) - getNotificationTime(a));

  return newItems[0] ? normalizeNotificationPreview(newItems[0]) : null;
}

function rememberNotificationIds(items = []) {
  lastNotificationIds = new Set(items.map(getNotificationId).filter(Boolean));
}

function normalizeReceivedPushNotification(notification = {}) {
  const content = notification?.request?.content || {};
  const data = content.data || {};

  console.log("PUSH_TOAST_BODY_DEBUG", {
    contentBody: content.body,
    data,
  });

  return normalizeNotificationPreview({
    id:
      data.notificationId ||
      data.notification_id ||
      data.id ||
      `push_${Date.now()}`,
    notificationId: data.notificationId || data.notification_id || data.id,
    title: content.title || data.title || data.message,
    body:
      data.description ||
      data.described ||
      data.post_described ||
      data.postDescription ||
      data.post_content ||
      data.postContent ||
      data.content ||
      data.message ||
      data.body ||
      content.body,
    avatar:
      data.avatar ||
      data.user_avatar ||
      data.sender_avatar ||
      data.image ||
      data.image_url ||
      data.imageUrl,
    targetType: data.targetType || data.target_type,
    targetId:
      data.targetId ||
      data.target_id ||
      data.objectId ||
      data.object_id ||
      data.postId ||
      data.post_id,
    raw: data,
  });
}

async function applyAndroidChannel(settings = currentSettings) {
  if (Platform.OS !== "android") return;

  const vibrateOn = toBool(settings.vibrantOn, true);
  const ledOn = toBool(settings.ledOn, true);

  await Notifications.setNotificationChannelAsync("push-voice", {
    name: "ThÃ´ng bÃ¡o giá»ng nÃ³i",
    importance: Notifications.AndroidImportance.HIGH,
    sound: VOICE_SOUND,
    enableVibrate: vibrateOn,
    vibrationPattern: vibrateOn ? [0, 250, 250, 250] : [0],
    lightColor: ledOn ? "#1877F2" : undefined,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync("push-sms", {
    name: "ThÃ´ng bÃ¡o SMS",
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
        shouldPlaySound: notificationOn && toBool(currentSettings.soundOn, true),
        shouldSetBadge: notificationOn,
      };
    },
  });

  return currentSettings;
}

export async function registerDeviceForPush() {
  const session = await getCurrentSession();

  if (!session?.token) {
    console.log("PUSH_REGISTER_SKIP_NO_SESSION");
    return null;
  }

  await loadAndApplyPushSettings();

  const devtype = Platform.OS === "ios" ? 0 : 1;

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    console.log("PUSH_PERMISSION_DENIED");
    return null;
  }

  try {
    const projectId = getProjectId();

    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const devtoken = tokenResult?.data;

    if (!devtoken) {
      console.log("GET_EXPO_PUSH_TOKEN_EMPTY");
      return null;
    }

    console.log("====================================");
    console.log("EXPO_PUSH_TOKEN:", devtoken);
    console.log("DEVICE_TYPE:", devtype);
    console.log("====================================");

    await setDeviceToken(devtoken, devtype);

    console.log("SET_DEV_TOKEN_OK", {
      devtoken,
      devtype,
    });

    return devtoken;
  } catch (error) {
    console.log("GET_EXPO_PUSH_TOKEN_ERROR", {
      message: error?.message,
      stack: error?.stack,
    });

    return null;
  }
}

async function showLocalNotificationForNewItems(notification) {
  if (!toBool(currentSettings.notificationOn, true)) return;

  const preview = normalizeNotificationPreview(notification);
  const channelId = getNotificationChannelId(currentSettings);
  const sound = getNotificationSound(currentSettings);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: preview.title,
      body: preview.body,
      sound,
      data: {
        screen: "notifications",
        notificationId: preview.id,
        targetType: preview.targetType,
        targetId: preview.targetId,
        avatar: preview.avatar,
      },
    },
    trigger:
      Platform.OS === "android"
        ? {
            seconds: 1,
            channelId,
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

  const items = Array.isArray(page?.items) ? page.items : [];
  const unreadCount = Number(page?.unreadCount || 0);
  const hasBaseline = lastUnreadCount !== null;
  const latestNewNotification = hasBaseline
    ? getLatestNewNotification(items)
    : null;

  setNotificationBadge(unreadCount);

  const currentPath = String(getCurrentPath?.() || "");
  const isInNotificationsScreen = isNotificationsPath(currentPath);

  if (
    notifyIfNew &&
    hasBaseline &&
    !isInNotificationsScreen &&
    (latestNewNotification || unreadCount > lastUnreadCount)
  ) {
    const preview =
      latestNewNotification ||
      normalizeNotificationPreview({
        title: "Báº¡n cÃ³ thÃ´ng bÃ¡o má»›i",
        body: "CÃ³ thÃ´ng bÃ¡o má»›i. Nháº¥n Ä‘á»ƒ xem chi tiáº¿t.",
      });

    onNewInAppNotification?.({
      notification: preview,
      unreadCount,
      previousUnreadCount: lastUnreadCount,
      page,
    });

    // KhÃ´ng báº­t dÃ²ng dÆ°á»›i náº¿u backend/Expo Ä‘Ã£ gá»­i push tháº­t,
    // vÃ¬ sáº½ bá»‹ double notification trong Android drawer.
    // await showLocalNotificationForNewItems(preview);
  }

  lastUnreadCount = unreadCount;
  rememberNotificationIds(items);

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

  receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const currentPath = String(getCurrentPath?.() || "");

      if (!isNotificationsPath(currentPath)) {
        const preview = normalizeReceivedPushNotification(notification);

        onNewInAppNotification?.({
          notification: preview,
          unreadCount: lastUnreadCount,
          previousUnreadCount: lastUnreadCount,
          page: null,
        });
      }

      refreshNotificationBadge({
        notifyIfNew: false,
        getCurrentPath,
        onNewInAppNotification,
      }).catch((error) => {
        console.log("RECEIVE_PUSH_REFRESH_ERROR", error?.message);
      });
    },
  );

  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      try {
        const data = response?.notification?.request?.content?.data || {};
        onOpen?.(data);
      } catch (error) {
        console.log("PUSH_NOTIFICATION_PRESS_ERROR", error?.message);
        onOpen?.({});
      }
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

export function resetInAppNotificationRuntime() {
  stopInAppNotificationRuntime();

  lastUnreadCount = null;
  lastNotificationIds = new Set();

  resetNotificationCache();

  Notifications.dismissAllNotificationsAsync().catch(() => {});
  Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
