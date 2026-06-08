import { backendApi } from "@/api/client";
import { API_BASE_URL, API_TYPE, API_TYPES } from "@/config/env";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

function isNotificationSessionExpired(error) {
  const code = String(
    error?.code || error?.data?.code || error?.response?.data?.code || "",
  );

  const status = Number(error?.status || error?.response?.status || 0);

  return code === "9998" || status === 401;
}

export function isNotificationAuthError(error) {
  return isNotificationSessionExpired(error);
}

function createEmptyNotificationCache() {
  return {
    items: [],
    unreadCount: 0,
    lastUpdate: "",
    hasMore: false,
    hasLoaded: false,
    source: ACTIVE_SOURCES.LOCAL,
  };
}

let notificationCache = createEmptyNotificationCache();

let notificationBadge = 0;
const notificationBadgeListeners = new Set();
const notificationCacheListeners = new Set();

export function getNotificationCache() {
  return notificationCache;
}

export function getNotificationBadge() {
  return notificationBadge;
}

export function resetNotificationCache() {
  notificationCache = createEmptyNotificationCache();
  setNotificationBadge(0);
  emitNotificationCache();
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

export function subscribeNotificationCache(listener) {
  notificationCacheListeners.add(listener);
  listener(notificationCache);

  return () => {
    notificationCacheListeners.delete(listener);
  };
}

function emitNotificationCache() {
  notificationCacheListeners.forEach((listener) => {
    try {
      listener(notificationCache);
    } catch {
      // Ignore listener errors.
    }
  });
}

export function formatNotificationBadge(value) {
  const numeric = Number(value) || 0;
  return numeric > 99 ? "99+" : String(numeric);
}

function toBoolFlag(value, fallback = false) {
  if (value === undefined || value === null) return fallback;

  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "true" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "no") return false;

  return fallback;
}

function toNumberOrUndefined(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function isNotificationUnread(item = {}) {
  if (item.unread !== undefined) return toBoolFlag(item.unread, true);
  if (item.read !== undefined) return !toBoolFlag(item.read, false);
  if (item.isRead !== undefined) return !toBoolFlag(item.isRead, false);
  if (item.is_read !== undefined) return !toBoolFlag(item.is_read, false);

  if (item.raw?.unread !== undefined) return toBoolFlag(item.raw.unread, true);
  if (item.raw?.read !== undefined) return !toBoolFlag(item.raw.read, false);
  if (item.raw?.is_read !== undefined)
    return !toBoolFlag(item.raw.is_read, false);

  return true;
}

function getNotificationIds(item = {}) {
  return [
    item.notificationId,
    item.id,
    item.raw?.notificationId,
    item.raw?.notification_id,
    item.raw?.id,
  ]
    .filter(Boolean)
    .map(String);
}

function getNotificationCreatedTime(item) {
  const time = new Date(item?.created || item?.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortNotifications(items = []) {
  return [...items].sort(
    (a, b) => getNotificationCreatedTime(b) - getNotificationCreatedTime(a),
  );
}

function mergeNotifications(oldItems = [], newItems = []) {
  const map = new Map();

  [...oldItems, ...newItems].forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, item);
  });

  return sortNotifications(Array.from(map.values()));
}

function saveNotificationCache(
  page,
  { append = false, mergeWithExisting = false } = {},
) {
  const shouldMerge = append || mergeWithExisting;

  const nextItems = shouldMerge
    ? mergeNotifications(notificationCache.items, page.items)
    : sortNotifications(page.items);

  const pageUnreadCount = toNumberOrUndefined(page.unreadCount);

  const unreadCount =
    pageUnreadCount !== undefined
      ? Math.max(0, pageUnreadCount)
      : nextItems.filter(isNotificationUnread).length;

  notificationCache = {
    ...page,
    items: nextItems,
    unreadCount,
    hasLoaded: true,
  };

  setNotificationBadge(unreadCount);
  emitNotificationCache();

  return notificationCache;
}

export function markNotificationReadLocal(notificationId) {
  const targetId = String(notificationId || "").trim();

  if (!targetId) {
    return notificationCache;
  }

  let changed = false;

  const nextItems = notificationCache.items.map((item) => {
    const ids = getNotificationIds(item);

    if (!ids.includes(targetId) || !isNotificationUnread(item)) {
      return item;
    }

    changed = true;

    return {
      ...item,
      read: true,
      unread: false,
      isRead: true,
      is_read: "1",
      raw: {
        ...item.raw,
        read: "1",
        unread: false,
        is_read: "1",
      },
    };
  });

  if (!changed) {
    return notificationCache;
  }

  // Badge là tổng unread toàn hệ thống, không phải số unread trong page hiện tại.
  const unreadCount = Math.max(
    0,
    Number(notificationCache.unreadCount || 0) - 1,
  );

  notificationCache = {
    ...notificationCache,
    items: nextItems,
    unreadCount,
  };

  setNotificationBadge(unreadCount);
  emitNotificationCache();

  return notificationCache;
}

function firstNonEmpty(...values) {
  return values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );
}

function normalizeImageUrl(value = "") {
  const url = String(value || "").trim();

  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const baseUrl = API_BASE_URL.replace(/\/it4788\/?$/, "").replace(/\/+$/, "");
  const cleanPath = url.replace(/^\/+/, "");

  return `${baseUrl}/${cleanPath}`;
}

function getNotificationAvatar(raw = {}) {
  const sender =
    raw.sender ||
    raw.actor ||
    raw.user ||
    raw.from ||
    raw.from_user ||
    raw.fromUser ||
    raw.author ||
    raw.poster ||
    raw.owner ||
    {};

  return normalizeImageUrl(
    firstNonEmpty(
      raw.sender_avatar,
      raw.senderAvatar,
      raw.sender_avatar_url,
      raw.senderAvatarUrl,

      raw.actor_avatar,
      raw.actorAvatar,
      raw.actor_avatar_url,
      raw.actorAvatarUrl,

      raw.user_avatar,
      raw.userAvatar,
      raw.user_avatar_url,
      raw.userAvatarUrl,

      raw.from_avatar,
      raw.fromAvatar,
      raw.from_avatar_url,
      raw.fromAvatarUrl,

      raw.author_avatar,
      raw.authorAvatar,
      raw.author_avatar_url,
      raw.authorAvatarUrl,

      sender.avatar,
      sender.avatar_url,
      sender.avatarUrl,
      sender.image,
      sender.image_url,
      sender.imageUrl,
      sender.photo,

      raw.avatar,
      raw.avatar_url,
      raw.avatarUrl,
      raw.image,
      raw.image_url,
      raw.imageUrl,
      raw.photo,
    ),
  );
}

function normalizeNotification(
  raw = {},
  index = 0,
  source = ACTIVE_SOURCES.SERVER,
) {
  const type = raw.type || raw.notification_type || "info";

  const notificationId = String(
    raw.notificationId ||
      raw.notification_id ||
      raw.id ||
      `notification_${type}_${raw.title || ""}_${raw.created || index}_${index}`,
  );

  const objectId = String(
    raw.objectId ||
      raw.object_id ||
      raw.targetId ||
      raw.target_id ||
      raw.postId ||
      raw.post_id ||
      raw.course_id ||
      "",
  );

  const readValue = raw.read ?? raw.is_read;

  const unread =
    raw.unread !== undefined
      ? toBoolFlag(raw.unread, true)
      : readValue !== undefined
        ? !toBoolFlag(readValue, false)
        : true;

  const notificationData = {
    id: notificationId,
    notificationId,
    source,
    type,
    title: raw.title || raw.message || raw.content || "Thông báo",
    body: raw.description || raw.body || raw.content || raw.message || "",
    avatar: getNotificationAvatar(raw),
    group: raw.group || raw.group_type || "",
    badge: Number(raw.badge || raw.badge_count || 0),
    created:
      raw.created ||
      raw.createdAt ||
      raw.created_at ||
      raw.time ||
      new Date().toISOString(),
    createdAt:
      raw.createdAt ||
      raw.created_at ||
      raw.created ||
      raw.time ||
      new Date().toISOString(),
    lastUpdate: raw.last_update || raw.lastUpdate || "",
    read: !unread,
    unread,
    isRead: !unread,
    is_read: unread ? "0" : "1",
    targetType:
      raw.targetType ||
      raw.target_type ||
      (type.includes("post") ||
      type.includes("comment") ||
      type.includes("like") ||
      objectId
        ? "post"
        : type.includes("course")
          ? "course"
          : "info"),
    targetId: objectId,
    objectId,
    raw,
  };

  return notificationData;
}

function normalizeNotificationPage(response, source) {
  const items = extractList(response).map((item, index) =>
    normalizeNotification(item, index, source),
  );

  const data =
    response?.data && !Array.isArray(response.data) ? response.data : {};

  const badgeValue =
    data.badge ?? data.unread ?? response?.badge ?? response?.unread;

  const badgeNumber = toNumberOrUndefined(badgeValue);

  const unreadCount =
    badgeNumber !== undefined
      ? Math.max(0, badgeNumber)
      : items.filter(isNotificationUnread).length;

  return {
    items,
    hasMore: toBoolFlag(
      data.has_more ?? data.hasMore ?? response?.has_more ?? response?.hasMore,
      items.length >= 20,
    ),
    lastUpdate:
      data.last_update ||
      data.lastUpdate ||
      response?.last_update ||
      response?.lastUpdate ||
      items[0]?.lastUpdate ||
      "",
    unreadCount,
    badgeLabel: formatNotificationBadge(unreadCount),
    source,
  };
}

export async function getNotifications() {
  const page = await getNotificationPage({ index: 0, count: 20 });
  return page.items;
}

export async function getNotificationPage(params = {}) {
  if (API_TYPE === API_TYPES.MOCK) {
    const response = await backendApi.getNotification({
      index: String(params.index || 0),
      count: String(params.count || 20),
      // last_update: params.lastUpdate || params.last_update || "",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Mock notification failed",
    });

    const page = normalizeNotificationPage(response, ACTIVE_SOURCES.LOCAL);

    return saveNotificationCache(page, {
      append: Number(params.index || 0) > 0,
      mergeWithExisting: Boolean(params.mergeWithExisting),
    });
  }

  const session = await getCurrentSession();

  if (!session?.token) {
    const error = new Error("Bạn cần đăng nhập để xem thông báo.");
    error.code = "9998";
    throw error;
  }

  try {
    const response = await backendApi.getNotification({
      token: session.token,
      index: String(params.index || 0),
      count: String(params.count || 20),
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend notification failed",
    });

    const page = normalizeNotificationPage(response, ACTIVE_SOURCES.SERVER);

    return saveNotificationCache(page, {
      append: Number(params.index || 0) > 0,
      mergeWithExisting: Boolean(params.mergeWithExisting),
    });
  } catch (error) {
    console.info("[DATA] Server notification fallback", {
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
  const session = await getCurrentSession();

  if (!session?.token) {
    throw new Error("Bạn cần đăng nhập để đọc thông báo.");
  }

  const id = String(notificationId || "").trim();

  if (!id) {
    throw new Error("Thiếu notificationId.");
  }

  console.log("SET_READ_NOTIFICATION_BODY", {
    token: session.token,
    notificationId: id,
  });

  const response = await backendApi.setReadNotification({
    token: session.token,
    notificationId: id,
  });

  await assertBackendOk(response, {
    message: "Backend set_read_notification failed",
  });

  const backendBadge = toNumberOrUndefined(response?.data?.badge);

  if (backendBadge !== undefined) {
    notificationCache = {
      ...notificationCache,
      unreadCount: Math.max(0, backendBadge),
      lastUpdate: response?.data?.lastUpdate || notificationCache.lastUpdate,
    };

    setNotificationBadge(notificationCache.unreadCount);
    emitNotificationCache();
  }

  return {
    badge: backendBadge,
    lastUpdate: response?.data?.lastUpdate || "",
    response,
  };
}
