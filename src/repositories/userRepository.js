import { backendApi } from "@/api/client";
import { DEMO_STUDENT } from "@/constants/demo";
import { extractObject, normalizeSession } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";
import { saveAuthSession } from "@/utils/session";

function normalizeUser(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  const sessionLike = normalizeSession({ data: raw });

  return {
    ...sessionLike,
    source,
    username: raw.username || raw.name || sessionLike.username,
    displayName: raw.displayName || raw.fullname || raw.username || sessionLike.displayName,
    height: raw.height || "",
    coverImage: raw.cover_image || raw.coverImage || "",
    raw,
  };
}

function localUser(session) {
  return normalizeUser(session || DEMO_STUDENT, ACTIVE_SOURCES.LOCAL);
}

export async function getUserInfo(userId = "") {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return localUser(session);
  }

  try {
    const response = await backendApi.getUserInfo({
      token: session.token,
      user_id: userId,
    });

    await assertBackendOk(response, { message: "Backend get_user_info failed" });

    return normalizeUser(extractObject(response), ACTIVE_SOURCES.SERVER);
  } catch (error) {
    console.info("[DATA] Server get_user_info fallback", error.message);

    if (!error.sessionExpired && canFallbackToLocal()) {
      return normalizeUser(session, ACTIVE_SOURCES.LOCAL_FALLBACK);
    }

    throw error;
  }
}

export async function updateUserInfo(params = {}) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    const updated = {
      ...session,
      ...params,
      username: params.username || session?.username,
      displayName: params.username || session?.displayName || session?.username,
      source: ACTIVE_SOURCES.LOCAL,
    };
    await saveAuthSession(updated);
    return updated;
  }

  const response = await backendApi.setUserInfo({
    token: session.token,
    user_name: params.userName || params.user_name || params.username || "",
    avatar: params.avatar || "",
    cover_image: params.coverImage || params.cover_image || "",
  });

  await assertBackendOk(response, { message: "Backend set_user_info failed" });

  const updated = {
    ...session,
    ...normalizeUser(extractObject(response), ACTIVE_SOURCES.SERVER),
  };
  await saveAuthSession(updated);
  return updated;
}
