import { backendApi } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
    ACTIVE_SOURCES,
    getCurrentSession,
    sourceFromResponse,
} from "@/repositories/source";

function isNotificationSessionExpired(error) {
  const code = String(
    error?.code ||
      error?.data?.code ||
      error?.response?.data?.code ||
      "",
  );

  const status = Number(error?.status || error?.response?.status || 0);

  return code === "9998" || status === 401;
}

export function isNotificationAuthError(error) {
  return isNotificationSessionExpired(error);
}

let notificationCache = {
  items: [],
  unreadCount: 0,
  lastUpdate: "",
  hasMore: false,
  hasLoaded: false,
  source: ACTIVE_SOURCES.LOCAL,
};

let notificationBadge = 0;
const notificationBadgeListeners = new Set();

export function getNotificationCache() {
  return notificationCache;
}

export function getNotificationBadge() {
  return notificationBadge;
}

export function setNotificationBadge(value) {
  const nextValue = Math.max(0, Number(value) || 0);
  notificationBadge = nextValue;

  notificationBadgeListeners.forEach((listener) => {
    listener(nextValue);
  });
}

export function subscribeNotificationBadge(listener) {
  notificationBadgeListeners.add(listener);
  listener(notificationBadge);

  return () => {
    notificationBadgeListeners.delete(listener);
  };
}

export function formatNotificationBadge(value) {
  const numeric = Number(value) || 0;
  return numeric > 99 ? "99+" : String(numeric);
}

function getNotificationCreatedTime(item) {
  const time = new Date(item?.created).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortNotifications(items = []) {
  return [...items].sort((a, b) => getNotificationCreatedTime(b) - getNotificationCreatedTime(a));
}

function mergeNotifications(oldItems = [], newItems = []) {
  const map = new Map();

  [...oldItems, ...newItems].forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, item);
  });

  return sortNotifications(Array.from(map.values()));
}

function saveNotificationCache(page, { append = false } = {}) {
  const nextItems = append
    ? mergeNotifications(notificationCache.items, page.items)
    : sortNotifications(page.items);

  const unreadCount = Number.isFinite(Number(page.unreadCount))
    ? Math.max(0, Number(page.unreadCount))
    : nextItems.filter((item) => item.unread).length;

  notificationCache = {
    ...page,
    items: nextItems,
    unreadCount,
    hasLoaded: true,
  };

  setNotificationBadge(unreadCount);

  return notificationCache;
}

export function markNotificationReadLocal(notificationId) {
  if (!notificationId) {
    return notificationCache;
  }

  let changed = false;

  const nextItems = notificationCache.items.map((item) => {
    if (item.notificationId !== notificationId || !item.unread) {
      return item;
    }

    changed = true;

    return {
      ...item,
      unread: false,
      raw: {
        ...item.raw,
        read: "1",
      },
    };
  });

  if (!changed) {
    return notificationCache;
  }

  const unreadCount = Math.max(0, notificationCache.unreadCount - 1);

  notificationCache = {
    ...notificationCache,
    items: nextItems,
    unreadCount,
  };

  setNotificationBadge(unreadCount);

  return notificationCache;
}

function normalizeNotification(raw = {}, source = ACTIVE_SOURCES.SERVER, index = 0) {
  const type = raw.type || raw.notification_type || "info";
  const objectId =
    raw.object_id ||
    raw.objectId ||
    raw.target_id ||
    raw.post_id ||
    raw.course_id ||
    "";
  const group = raw.group || raw.group_type || "";
  const readValue = raw.read ?? raw.is_read;

  function buildNotificationId(raw = {}, index = 0) {
    return String(
      raw.notification_id ||
        raw.id ||
        (raw.object_id && `${raw.type || "notification"}_${raw.object_id}_${raw.created || index}`) ||
        `notification_${raw.type || "unknown"}_${raw.title || ""}_${raw.created || index}_${index}`,
    );
  }

  const id = buildNotificationId(raw, index);

  return {
    id,
    notificationId: String(raw.notification_id || raw.id || ""),
    source,
    type,
    title: raw.title || raw.message || raw.content || "Thông báo",
    body: raw.body || raw.description || raw.content || raw.message || "",
    avatar: raw.avatar || "",
    group,
    badge: Number(raw.badge || raw.badge_count || 0),
    createdAt:
      raw.createdAt ||
      raw.created_at ||
      raw.created ||
      raw.time ||
      new Date().toISOString(),
    lastUpdate: raw.last_update || raw.lastUpdate || "",
    unread:
      raw.unread !== undefined
        ? raw.unread
        : readValue !== undefined
          ? !Boolean(Number(readValue))
          : true,
    targetType:
      raw.targetType ||
      raw.target_type ||
      (type.includes("post") || raw.post_id
        ? "post"
        : type.includes("course")
          ? "course"
          : "info"),
    targetId: String(raw.targetId || objectId),
    objectId: String(objectId),
    raw,
  };
}

function normalizeNotificationPage(response, source) {
  const items = extractList(response).map((item, index) =>
    normalizeNotification(item, source, index),
  );
  const data =
    response?.data && !Array.isArray(response.data) ? response.data : {};

  const unreadCount = Number(
    data.badge ||
      data.unread ||
      response?.badge ||
      items.filter((item) => item.unread).length,
  );

  return {
    items,
    hasMore: Boolean(data.has_more || response?.has_more || items.length >= 20),
    lastUpdate:
      data.last_update || response?.last_update || items[0]?.lastUpdate || "",
    unreadCount,
    badgeLabel: unreadCount > 99 ? "99+" : String(unreadCount),
    source,
  };
}

export async function getNotifications() {
  const page = await getNotificationPage({ index: 0, count: 20 });
  return page.items;
}

export async function getNotificationPage(params = {}) {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getNotification({
      token: session?.token || "",
      index: String(params.index || 0),
      count: String(params.count || 20),
      // last_update: params.lastUpdate || params.last_update || "",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend notification failed",
    });

    const page = normalizeNotificationPage(response, sourceFromResponse(response));
    return saveNotificationCache(page, {
      append: Number(params.index || 0) > 0,
    });
  } catch (error) {
    console.info("[DATA] Notification unavailable", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      data: error?.data,
    });

    if (isNotificationSessionExpired(error)) {
      setNotificationBadge(0);
      throw error;
    }

    throw error;
  }
}

export async function markNotificationRead(notificationId) {
  markNotificationReadLocal(notificationId);

  const session = await getCurrentSession();

  const response = await backendApi.setReadNotification({
    token: session?.token || "",
    notification_id: String(notificationId),
  });

  await assertBackendOk(response, {
    message: "Backend set_read_notification failed",
  });
  return {
    read: true,
    source: sourceFromResponse(response),
  };
}
