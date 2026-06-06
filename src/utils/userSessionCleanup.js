import { clearNotificationCache } from "@/repositories/notificationRepository";
import { clearNotificationState } from "@/services/notificationStore";
import { clearTransientPostData } from "@/services/postStore";
import {
  clearUserScopedDiskCaches,
} from "@/utils/cacheStore";
import { clearAuthSession } from "@/utils/session";
import { resetCoursesFeedCache, resetHomeFeedCache } from "@/state/feedCacheState";
import { resetProfileScreenCache } from "@/state/profileCacheState";

export async function clearCurrentUserSessionArtifacts() {
  resetProfileScreenCache();
  resetHomeFeedCache();
  resetCoursesFeedCache();
  clearNotificationState();
  clearNotificationCache();

  await Promise.all([
    clearUserScopedDiskCaches(),
    clearTransientPostData(),
  ]);
}

export async function clearCurrentUserSession() {
  await clearCurrentUserSessionArtifacts();
  await clearAuthSession();
}
