import { resetNotificationCache } from "@/repositories/notificationRepository";
import { clearTransientPostData } from "@/services/postStore";
import {
  resetCoursesFeedCache,
  resetHomeFeedCache,
} from "@/state/feedCacheState";
import { resetProfileScreenCache } from "@/state/profileCacheState";
import { clearUserScopedDiskCaches } from "@/utils/cacheStore";
import { clearAuthSession } from "@/utils/session";

export async function clearCurrentUserSessionArtifacts() {
  try {
    resetProfileScreenCache();
  } catch (error) {
    console.warn("resetProfileScreenCache failed:", error?.message);
  }

  try {
    resetHomeFeedCache();
  } catch (error) {
    console.warn("resetHomeFeedCache failed:", error?.message);
  }

  try {
    resetCoursesFeedCache();
  } catch (error) {
    console.warn("resetCoursesFeedCache failed:", error?.message);
  }

  try {
    resetNotificationCache();
  } catch (error) {
    console.warn("resetNotificationCache failed:", error?.message);
  }

  const cleanDisk = clearUserScopedDiskCaches().catch((error) => {
    console.warn("clearUserScopedDiskCaches failed:", error?.message);
  });

  const cleanPosts = clearTransientPostData().catch((error) => {
    console.warn("clearTransientPostData failed:", error?.message);
  });

  await Promise.all([cleanDisk, cleanPosts]);
}

export async function clearCurrentUserSession() {
  try {
    await clearCurrentUserSessionArtifacts();
  } catch (error) {
    console.warn("clearCurrentUserSessionArtifacts failed:", error?.message);
  }

  try {
    await clearAuthSession();
  } catch (error) {
    console.warn("clearAuthSession failed:", error?.message);
  }
}
