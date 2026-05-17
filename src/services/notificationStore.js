import { backendApi } from "@/api/client";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getAuthSession } from "@/utils/session";

const OK_CODE = "1000";
const EMPTY_CODE = "9994";

let notificationBadge = 0;
let notificationBadgeLastUpdate = "";
let notificationCache = {
  items: [],
  badge: 0,
  lastUpdate: "",
  hasLoaded: false,
  hasMore: false,
};

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

function asString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asBooleanRead(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function getNotificationArray(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.notifications)) return responseData.notifications;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
}

function pickBadge(response) {
  const value = response?.badge ?? response?.data?.badge ?? response?.data?.unread;
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return numeric;
}

function pickLastUpdate(response) {
  return asString(
    response?.last_update ??
      response?.data?.last_update ??
      response?.data?.lastUpdate,
  );
}

export function formatBadge(value) {
  const numeric = Number(value) || 0;
  return numeric > 99 ? "99+" : String(numeric);
}

function isValidDate(value) {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function isUsableNotification(item) {
  if (!item.notificationId) return false;
  if (!item.title) return false;
  if (!isValidDate(item.created)) return false;

  if (item.group === "1" && (!item.objectId || item.objectId === "0")) {
    return false;
  }

  return true;
}

function mergeNotifications(oldItems, newItems) {
  const existingIds = new Set(oldItems.map((item) => item.id));

  const uniqueItems = newItems.filter((item) => {
    if (!item.id) return false;
    if (existingIds.has(item.id)) return false;
    existingIds.add(item.id);
    return true;
  });

  return [...oldItems, ...uniqueItems];
}

function isNewerLastUpdate(nextValue, currentValue) {
  if (!nextValue) return false;
  if (!currentValue) return true;

  const nextTime = new Date(nextValue).getTime();
  const currentTime = new Date(currentValue).getTime();

  if (Number.isNaN(nextTime)) return false;
  if (Number.isNaN(currentTime)) return true;

  return nextTime >= currentTime;
}

function resolveBadgeFromResponse(response, items) {
  const lastUpdate = pickLastUpdate(response);
  const fallbackBadge = items.filter((item) => !item.read).length;

  // Yêu cầu thầy: badge không có last_update thì bỏ qua badge đó.
  if (!lastUpdate) {
    return fallbackBadge;
  }

  if (!isNewerLastUpdate(lastUpdate, notificationBadgeLastUpdate)) {
    return notificationBadge;
  }

  notificationBadgeLastUpdate = lastUpdate;
  return pickBadge(response);
}

export function normalizeNotification(item = {}) {
  const id = asString(item.notification_id ?? item.id ?? item._id);
  const rawType = asString(item.type);
  const type = rawType || "home";
  const group = asString(item.group ?? "0") === "1" ? "1" : "0";
  const title = asString(item.title ?? item.message ?? "");
  const objectId = asString(item.object_id ?? item.objectId ?? "0");
  const created = asString(item.created ?? item.created_at ?? item.createdAt);

  return {
    id,
    notificationId: id,
    type,
    objectId,
    title,
    avatar: asString(item.avatar),
    created,
    group,
    read: asBooleanRead(item.read),
    raw: item,
  };
}

export async function getNotificationsPage({ index = 0, count = 20 } = {}) {
  const session = await getAuthSession();
  const token = session?.token;

  if (!token) {
    throw new Error("Bạn cần đăng nhập để xem thông báo.");
  }

  const payload = {
    token,
    index: String(index),
    count: String(count),
  };

  const response = await backendApi.getNotification(payload);
  const code = asString(response?.code);

  if (code === EMPTY_CODE) {
    if (Number(index) === 0) {
      notificationCache = {
        items: [],
        badge: 0,
        lastUpdate: "",
        hasLoaded: true,
        hasMore: false,
      };

      setNotificationBadge(0);
    }

    return {
      items: [],
      badge: 0,
      lastUpdate: "",
      hasMore: false,
    };
  }

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Không tải được thông báo.",
  });

  let items = getNotificationArray(response.data)
    .map(normalizeNotification)
    .filter(isUsableNotification);

  const badgeValue = resolveBadgeFromResponse(response, items);
  const lastUpdate = pickLastUpdate(response);
  const hasMore = items.length >= Number(count);

  if (Number(index) === 0) {
    notificationCache = {
      items,
      badge: badgeValue,
      lastUpdate,
      hasLoaded: true,
      hasMore,
    };
  } else {
    notificationCache = {
      items: mergeNotifications(notificationCache.items, items),
      badge: badgeValue,
      lastUpdate: lastUpdate || notificationCache.lastUpdate,
      hasLoaded: true,
      hasMore,
    };
  }

  setNotificationBadge(badgeValue);

  return {
    items,
    badge: badgeValue,
    lastUpdate,
    hasMore,
  };
}

export function markNotificationReadLocal(notificationId) {
  if (!notificationId) return notificationCache;

  let changed = false;

  const nextItems = notificationCache.items.map((item) => {
    if (item.notificationId !== notificationId || item.read) {
      return item;
    }

    changed = true;
    return {
      ...item,
      read: true,
    };
  });

  if (!changed) {
    return notificationCache;
  }

  const nextBadge = Math.max(0, notificationBadge - 1);

  notificationCache = {
    ...notificationCache,
    items: nextItems,
    badge: nextBadge,
  };

  setNotificationBadge(nextBadge);

  return notificationCache;
}

export async function markNotificationRead(notificationId) {
  const session = await getAuthSession();
  const token = session?.token;

  if (!token || !notificationId) {
    return {
      badge: undefined,
      lastUpdate: "",
    };
  }

  const response = await backendApi.setReadNotification({
    token,
    notification_id: String(notificationId),
  });

  await assertBackendOk(response, {
    message: "Không đánh dấu đọc được thông báo.",
  });

  const lastUpdate = pickLastUpdate(response);

  if (!lastUpdate) {
    return {
      badge: undefined,
      lastUpdate: "",
    };
  }

  const badge = pickBadge(response);

  if (isNewerLastUpdate(lastUpdate, notificationBadgeLastUpdate)) {
    notificationBadgeLastUpdate = lastUpdate;
    setNotificationBadge(badge);
  }

  return {
    badge,
    lastUpdate,
  };
}
