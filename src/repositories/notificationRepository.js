import { backendApi } from "@/api/client";
import { DEMO_NOTIFICATIONS } from "@/constants/demo";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

let localNotifications = DEMO_NOTIFICATIONS.map((item) => ({ ...item }));

function normalizeNotification(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  const type = raw.type || raw.notification_type || "info";
  const objectId = raw.object_id || raw.objectId || raw.target_id || raw.post_id || raw.course_id || "";
  const group = raw.group || raw.group_type || "";
  const readValue = raw.read ?? raw.is_read;

  return {
    id: String(raw.id || raw.notification_id || `${source}_notification_${Date.now()}`),
    notificationId: String(raw.notification_id || raw.id || ""),
    source,
    type,
    title: raw.title || raw.message || raw.content || "Thông báo",
    body: raw.body || raw.description || raw.content || raw.message || "",
    avatar: raw.avatar || "",
    group,
    badge: Number(raw.badge || raw.badge_count || 0),
    createdAt: raw.createdAt || raw.created_at || raw.created || raw.time || new Date().toISOString(),
    lastUpdate: raw.last_update || raw.lastUpdate || "",
    unread: raw.unread !== undefined ? raw.unread : readValue !== undefined ? !Boolean(Number(readValue)) : true,
    targetType: raw.targetType || raw.target_type || (type.includes("post") || raw.post_id ? "post" : type.includes("course") ? "course" : "info"),
    targetId: String(raw.targetId || objectId),
    objectId: String(objectId),
    raw,
  };
}

function normalizeNotificationPage(response, source) {
  const items = extractList(response).map((item) => normalizeNotification(item, source));
  const data = response?.data && !Array.isArray(response.data) ? response.data : {};

  return {
    items,
    hasMore: Boolean(data.has_more || response?.has_more || items.length >= 20),
    lastUpdate: data.last_update || response?.last_update || items[0]?.lastUpdate || "",
    unreadCount: Number(data.badge || data.unread || response?.badge || items.filter((item) => item.unread).length),
    source,
  };
}

export async function getNotifications() {
  const page = await getNotificationPage({ index: 0, count: 20 });
  return page.items;
}

export async function getNotificationPage(params = {}) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return normalizeNotificationPage({ data: localNotifications }, ACTIVE_SOURCES.LOCAL);
  }

  try {
    let response = await backendApi.getNotification({
      token: session.token,
      index: String(params.index || 0),
      count: String(params.count || 20),
      last_update: params.lastUpdate || params.last_update || "",
    });

    if (String(response?.message || "").includes("property last_update should not exist")) {
      console.info("[DATA] get_notification deployed compatibility: retrying without last_update");
      response = await backendApi.getNotification({
        token: session.token,
        index: String(params.index || 0),
        count: String(params.count || 20),
      });
    }

    await assertBackendOk(response, { allowNoData: true, message: "Backend notification failed" });

    return normalizeNotificationPage(response, ACTIVE_SOURCES.SERVER);
  } catch (error) {
    console.info("[DATA] Server notification fallback", error.message);

    if (!error.sessionExpired && canFallbackToLocal()) {
      return normalizeNotificationPage({ data: DEMO_NOTIFICATIONS }, ACTIVE_SOURCES.LOCAL_FALLBACK);
    }

    throw error;
  }
}

export async function markNotificationRead(notificationId) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    localNotifications = localNotifications.map((item) =>
      item.id === notificationId || item.notification_id === notificationId
        ? { ...item, unread: false, read: 1, badge: 0 }
        : item,
    );
    return { read: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setReadNotification({
    token: session.token,
    notification_id: notificationId,
  });

  await assertBackendOk(response, { message: "Backend set_read_notification failed" });

  return { read: true, source: ACTIVE_SOURCES.SERVER };
}
