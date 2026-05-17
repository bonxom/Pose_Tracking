import { backendApi } from "@/api/client";
import { getAuthSession } from "@/utils/session";

const OK_CODE = "1000";
const EMPTY_CODE = "9994";

let notificationBadge = 0;
const notificationBadgeListeners = new Set();

const mockReadIds = new Set();

function buildMockNotifications() {
  const mockItems = [
    {
      notification_id: "mock-like-1",
      type: "like",
      object_id: "post-101",
      title: "Nguyen Van B đã thích bài viết của bạn",
      created: new Date().toISOString(),
      avatar: "",
      read: "0",
    },
    {
      notification_id: "mock-comment-1",
      type: "comment",
      object_id: "post-102",
      comment_id: "comment-201",
      title: "Tran Thi C đã bình luận về bài viết của bạn",
      created: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      avatar: "",
      read: "0",
    },
    {
      notification_id: "mock-post-1",
      type: "post",
      object_id: "post-103",
      title: "Hệ thống đã cập nhật trạng thái bài tập của bạn",
      created: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      avatar: "",
      read: "1",
    },
  ];

  return mockItems.map((item) =>
    normalizeNotification({
      ...item,
      read: mockReadIds.has(item.notification_id) ? "1" : item.read,
    }),
  );
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
  const value = response?.badge ?? response?.data?.badge ?? response?.data?.unread ?? 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
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

export function normalizeNotification(item = {}) {
  const id = asString(item.notification_id ?? item.id ?? item._id);
  const type = asString(item.type || "notification");
  const group = asString(item.group ?? "0");
  const title = asString(item.title || item.message || "Bạn có thông báo mới");

  return {
    id,
    notificationId: id,
    type,
    objectId: asString(item.object_id ?? item.objectId),
    commentId: asString(item.comment_id ?? item.commentId),
    title,
    avatar: asString(item.avatar),
    created: asString(item.created ?? item.created_at ?? item.createdAt),
    group,
    read: asBooleanRead(item.read),
    raw: item,
  };
}

export async function getNotificationsPage({ index = 0, count = 20 } = {}) {
  const session = await getAuthSession();
  const token = session?.token;

  console.log("NOTIFICATION_SESSION", session);

  if (!token) {
    throw new Error("Bạn cần đăng nhập để xem thông báo.");
  }

  const payload = {
    token,
    index: String(index),
    count: String(count),
  };

  console.log("GET_NOTIFICATION_PAYLOAD", payload);

  const response = await backendApi.getNotification(payload);

  console.log("GET_NOTIFICATION_RESPONSE", response);

  const code = asString(response?.code);

  if (code === EMPTY_CODE) {
    return {
      items: [],
      badge: 0,
      lastUpdate: "",
      hasMore: false,
    };
  }

  if (code !== OK_CODE) {
    throw new Error(response?.message || "Không tải được thông báo.");
  }

  let items = getNotificationArray(response.data).map(normalizeNotification);

  // Mock để demo UI + điều hướng khi backend chưa sinh notification thật
  if (items.length === 0) {
    items = buildMockNotifications();
  }

  const unreadCount = items.filter((item) => !item.read).length;

  setNotificationBadge(unreadCount);

  return {
    items,
    badge: unreadCount,
    lastUpdate: pickLastUpdate(response),
    hasMore: false,
  };
}

export async function markNotificationRead(notificationId) {
  const session = await getAuthSession();
  const token = session?.token;

  if (String(notificationId).startsWith("mock-")) {
    mockReadIds.add(String(notificationId));

    const unreadCount = buildMockNotifications().filter((item) => !item.read).length;

    setNotificationBadge(unreadCount);

    return {
      badge: unreadCount,
      lastUpdate: new Date().toISOString(),
    };
  }

  if (!token || !notificationId) {
    return {
      badge: 0,
      lastUpdate: "",
    };
  }

  const response = await backendApi.setReadNotification({
    token,
    notification_id: String(notificationId),
  });

  const code = asString(response?.code);

  if (code !== OK_CODE) {
    throw new Error(response?.message || "Không đánh dấu đọc được thông báo.");
  }

  return {
    badge: pickBadge(response),
    lastUpdate: pickLastUpdate(response),
  };
}
