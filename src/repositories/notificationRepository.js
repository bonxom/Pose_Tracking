import { backendApi } from "@/api/client";
import { DEMO_NOTIFICATIONS } from "@/constants/demo";
import { extractList, isBackendOk } from "@/repositories/normalizers";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

function normalizeNotification(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: String(raw.id || raw.notification_id || `${source}_notification_${Date.now()}`),
    source,
    type: raw.type || raw.notification_type || "info",
    title: raw.title || raw.message || raw.content || "Thông báo",
    body: raw.body || raw.description || raw.content || raw.message || "",
    createdAt: raw.createdAt || raw.created_at || raw.time || new Date().toISOString(),
    unread: raw.unread !== undefined ? raw.unread : raw.is_read !== undefined ? !raw.is_read : true,
    targetType: raw.targetType || raw.target_type || (raw.post_id ? "post" : "info"),
    targetId: String(raw.targetId || raw.target_id || raw.post_id || raw.course_id || ""),
  };
}

export async function getNotifications() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return DEMO_NOTIFICATIONS.map((item) => normalizeNotification(item, ACTIVE_SOURCES.LOCAL));
  }

  try {
    const response = await backendApi.getNotification({
      token: session.token,
      index: "0",
      count: "20",
    });

    if (!isBackendOk(response) && response?.code !== "9994") {
      throw new Error(response?.message || "Backend notification failed");
    }

    return extractList(response).map((item) => normalizeNotification(item, ACTIVE_SOURCES.SERVER));
  } catch (error) {
    console.info("[DATA] Server notification fallback", error.message);

    if (canFallbackToLocal()) {
      return DEMO_NOTIFICATIONS.map((item) => normalizeNotification(item, ACTIVE_SOURCES.LOCAL_FALLBACK));
    }

    throw error;
  }
}

export async function markNotificationRead(notificationId) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { read: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setReadNotification({
    token: session.token,
    id: notificationId,
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend set_read_notification failed");
  }

  return { read: true, source: ACTIVE_SOURCES.SERVER };
}
