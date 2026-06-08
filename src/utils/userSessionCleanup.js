import { resetNotificationCache } from "@/repositories/notificationRepository";
import { clearNotificationState } from "@/services/notificationStore";
import { clearTransientPostData } from "@/services/postStore";
import {
  resetCoursesFeedCache,
  resetHomeFeedCache,
} from "@/state/feedCacheState";
import { resetProfileScreenCache } from "@/state/profileCacheState";
import { clearUserScopedDiskCaches } from "@/utils/cacheStore";
import { clearAuthSession } from "@/utils/session";

export async function clearCurrentUserSessionArtifacts() {
  resetProfileScreenCache();
  resetHomeFeedCache();
  resetCoursesFeedCache();
  clearNotificationState();
  resetNotificationCache();

  await Promise.all([clearUserScopedDiskCaches(), clearTransientPostData()]);
}

export async function clearCurrentUserSession() {
  await clearCurrentUserSessionArtifacts();
  await clearAuthSession();
}
