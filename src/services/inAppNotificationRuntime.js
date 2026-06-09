import {
  getNotificationPage,
  resetNotificationCache,
  setNotificationBadge,
} from "@/repositories/notificationRepository";
import { getNotificationPollInterval } from "@/utils/notification";
import { AppState } from "react-native";

let pollingTimer = null;
let appStateSubscription = null;
let lastUnreadCount = null;
let lastNotificationIds = new Set();
let activeRuntimeConfig = null;
let isRuntimeActive = false;

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
      "Bạn có thông báo mới",
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
        title: "Bạn có thông báo mới",
        body: "Có thông báo mới. Nhấn để xem chi tiết.",
      });

    onNewInAppNotification?.({
      notification: preview,
      unreadCount,
      previousUnreadCount: lastUnreadCount,
      page,
    });
  }

  lastUnreadCount = unreadCount;
  rememberNotificationIds(items);

  return page;
}

export function startInAppNotificationRuntime({
  getCurrentPath,
  onNewInAppNotification,
} = {}) {
  stopInAppNotificationRuntime();
  isRuntimeActive = true;
  activeRuntimeConfig = { getCurrentPath, onNewInAppNotification };

  refreshNotificationBadge({
    notifyIfNew: false,
    getCurrentPath,
    onNewInAppNotification,
  }).catch((error) => {
    console.log("LOAD_NOTIFICATION_BADGE_ERROR", error?.message);
  });

  getNotificationPollInterval().then((interval) => {
    if (!isRuntimeActive) return;

    pollingTimer = setInterval(() => {
      if (AppState.currentState !== "active") return;

      refreshNotificationBadge({
        notifyIfNew: true,
        getCurrentPath,
        onNewInAppNotification,
      }).catch((error) => {
        console.log("POLL_NOTIFICATION_ERROR", error?.message);
      });
    }, interval);
  }).catch((error) => {
    console.log("GET_POLL_INTERVAL_ERROR", error?.message);
  });

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

  return stopInAppNotificationRuntime;
}

export function stopInAppNotificationRuntime() {
  isRuntimeActive = false;
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }

  appStateSubscription?.remove?.();
  appStateSubscription = null;
}

export function restartInAppNotificationRuntime() {
  if (isRuntimeActive && activeRuntimeConfig) {
    startInAppNotificationRuntime(activeRuntimeConfig);
  }
}

export function resetInAppNotificationRuntime() {
  stopInAppNotificationRuntime();
  lastUnreadCount = null;
  lastNotificationIds = new Set();
  resetNotificationCache();
}
