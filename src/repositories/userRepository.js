import { backendApi } from "@/api/client";
import { API_BASE_URL } from "@/config/env";
import { DEMO_STUDENT } from "@/constants/demo";
import {
  getMockProfileById,
  resolveMockProfile,
  saveMockProfile,
} from "@/constants/mocks/profiles";
import * as localPosts from "@/services/postStore";
import {
  extractList,
  extractObject,
  firstValue,
  normalizePost,
  normalizeSession,
  toNumber,
} from "@/repositories/normalizers";
import {
  SessionExpiredError,
  assertBackendOk,
  isInvalidSessionResponse,
} from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";
import { saveAuthSession } from "@/utils/session";

export function normalizeUser(raw = {}, source = ACTIVE_SOURCES.SERVER, options = {}) {
  const sessionLike = normalizeSession({ data: raw });
  const session = options.session || {};
  const isOwnProfile = Boolean(options.isOwnProfile);
  const id = firstValue(raw.id, raw.user_id, raw._id, raw.uuid, isOwnProfile && session.id);
  const username = firstValue(
    raw.user_name,
    raw.username,
    raw.name,
    raw.fullname,
    raw.fullName,
    isOwnProfile && (session.username || session.displayName),
  );

  if (!id || !username) {
    return {
      id: String(id || ""),
      username: username || "",
      displayName: username || "",
      source,
      unavailable: true,
      unavailableReason: "Tài khoản không tồn tại.",
      raw,
    };
  }

  const isBlocked = Boolean(
    raw.blocked ||
      raw.is_blocked ||
      raw.isBlocked ||
      raw.banned ||
      raw.is_banned ||
      raw.locked ||
      raw.is_locked,
  );

  const normalizedOnline = String(firstValue(raw.online, raw.is_online, "0")).toLowerCase();

  return {
    ...sessionLike,
    id: String(id),
    token: sessionLike.token || session.token || "",
    source,
    username,
    displayName: firstValue(raw.displayName, raw.fullname, raw.fullName, raw.name, username),
    avatar: normalizeMediaUrl(firstValue(raw.avatar, raw.avatar_url, raw.image, raw.picture, "")),
    coverImage: normalizeMediaUrl(firstValue(raw.cover_image, raw.coverImage, raw.cover_url, raw.background, "")),
    description: String(firstValue(raw.description, raw.described, raw.bio, raw.about, "")).slice(0, 150),
    address: firstValue(raw.address, raw.location, raw.province, raw.city, ""),
    city: firstValue(raw.city, raw.province, ""),
    country: firstValue(raw.country, ""),
    profileLink: firstValue(raw.link, raw.profile_link, raw.website, raw.url, ""),
    postCount: toNumber(firstValue(raw.post_count, raw.posts_count, raw.total_posts), 0),
    online: ["1", "true", "online", "yes"].includes(normalizedOnline),
    listing: firstValue(raw.listing, raw.is_listing, true),
    createdAt: firstValue(raw.createdAt, raw.created_at, raw.created, raw.create_time, ""),
    isOwnProfile,
    unavailable: isBlocked,
    unavailableReason: isBlocked ? "Tài khoản không tồn tại hoặc bạn không thể xem hồ sơ này." : "",
    height: firstValue(raw.height, session.height, ""),
    raw,
  };
}

function localUser(session) {
  const mockProfile = resolveMockProfile(session);
  const localProfile = buildLocalProfileShape(session, mockProfile);

  return normalizeUser(localProfile || DEMO_STUDENT, ACTIVE_SOURCES.LOCAL, {
    session,
    isOwnProfile: true,
  });
}

export function validateProfileUserName(value = "") {
  const userName = String(value).trim();

  if (!userName) {
    return "Tên người dùng không được bỏ trống.";
  }
  if (userName.length > 40) {
    return "Tên người dùng không được quá 40 ký tự.";
  }
  if (/^\W|^_/.test(userName)) {
    return "Tên người dùng không được bắt đầu bằng ký tự đặc biệt.";
  }
  if (/\d/.test(userName)) {
    return "Tên người dùng không được chứa số.";
  }
  if (!/^[\p{L}_\s]+$/u.test(userName)) {
    return "Tên người dùng chỉ được chứa chữ cái, khoảng trắng và dấu gạch dưới.";
  }

  return "";
}

function mapForbiddenNameError(error) {
  const message = String(error?.message || "").toLowerCase();
  if (
    message.includes("forbidden") ||
    message.includes("banned") ||
    message.includes("not allowed") ||
    message.includes("cấm")
  ) {
    return new Error("Tên người dùng này không được phép sử dụng.");
  }

  return error;
}

function fallbackUserById(userId = "", source = ACTIVE_SOURCES.LOCAL_FALLBACK) {
  const mockProfile = getMockProfileById(userId);
  return normalizeUser(mockProfile || { id: userId }, source, { isOwnProfile: false });
}

function isSameUser(left, right) {
  return Boolean(left && right && String(left) === String(right));
}

function getBackendErrorData(error) {
  return error?.data || null;
}

function getBackendErrorMessage(error) {
  const data = getBackendErrorData(error);
  return String(data?.message || data?.msg || data?.error || error?.message || "");
}

function rejectsField(error, fieldName) {
  return getBackendErrorMessage(error)
    .toLowerCase()
    .includes(`property ${fieldName.toLowerCase()} should not exist`);
}

function hasOwnValue(object = {}, key) {
  return Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined && object[key] !== null;
}

function shouldRetryGetUserInfoWithoutUserId(error) {
  const message = getBackendErrorMessage(error).toLowerCase();
  return (
    message.includes("property user_id should not exist") ||
    rejectsField(error, "user_id") ||
    error?.status === 400
  );
}

function firstParamValue(params = {}, keys = [], fallback = "") {
  const key = keys.find((item) => hasOwnValue(params, item));
  return key ? params[key] : fallback;
}

function buildLocalProfileShape(session = {}, mockProfile = {}) {
  return {
    ...(mockProfile || {}),
    ...(session || {}),
    id: firstValue(
      session?.id,
      session?.user_id,
      session?.identifier,
      mockProfile?.id,
      mockProfile?.identifier,
      DEMO_STUDENT.id,
    ),
    username: firstValue(
      session?.username,
      session?.displayName,
      mockProfile?.username,
      mockProfile?.displayName,
      DEMO_STUDENT.username,
    ),
    displayName: firstValue(
      session?.displayName,
      session?.username,
      mockProfile?.displayName,
      mockProfile?.username,
      DEMO_STUDENT.displayName,
    ),
    avatar: firstValue(session?.avatar, mockProfile?.avatar, ""),
    coverImage: firstValue(session?.coverImage, mockProfile?.coverImage, ""),
    description: firstValue(session?.description, mockProfile?.description, ""),
    address: firstValue(session?.address, mockProfile?.address, ""),
    city: firstValue(session?.city, mockProfile?.city, ""),
    country: firstValue(session?.country, mockProfile?.country, ""),
    profileLink: firstValue(session?.profileLink, mockProfile?.profileLink, ""),
    postCount: firstValue(session?.postCount, mockProfile?.postCount, 0),
    online: firstValue(session?.online, mockProfile?.online, false),
    listing: firstValue(session?.listing, mockProfile?.listing, true),
    role: firstValue(session?.role, mockProfile?.role, "HV"),
    phonenumber: firstValue(session?.phonenumber, mockProfile?.phonenumber, ""),
    identifier: firstValue(session?.identifier, mockProfile?.identifier, session?.phonenumber, ""),
    handle: firstValue(session?.handle, mockProfile?.handle, ""),
    height: firstValue(session?.height, mockProfile?.height, ""),
    demoMode: true,
  };
}

function shouldFallbackProfileSave(error) {
  if (error?.sessionExpired) return false;
  if (canFallbackToLocal()) return true;

  return (
    error?.status === 0 ||
    ["NETWORK_ERROR", "TIMEOUT"].includes(String(error?.code || "")) ||
    /unreachable|timed out|network/i.test(String(error?.message || ""))
  );
}

function throwIfExpiredFromApiError(error) {
  const data = getBackendErrorData(error);
  if (isInvalidSessionResponse(data || error)) {
    throw new SessionExpiredError(data?.message || error?.message);
  }
}

async function getLocalUserPosts(targetUserId, includeLocked, source = ACTIVE_SOURCES.LOCAL_FALLBACK) {
  const posts = await localPosts.getPosts();
  const filtered = posts.filter((post) => {
    const matchesUser = !targetUserId || isSameUser(post.author?.id, targetUserId);
    const canSeeLocked = includeLocked || post.canComment !== false;
    return matchesUser && canSeeLocked;
  });

  return {
    items: filtered,
    total: filtered.length,
    hasMore: false,
    lastId: filtered[0]?.id || "",
    source,
  };
}

function isLocalAssetUri(value = "") {
  return /^(file|content|asset-library|ph):\/\//i.test(String(value || ""));
}

function normalizeMediaUrl(value = "") {
  const uri = String(value || "").trim();

  if (!uri) return "";
  if (/^(https?|file|content|asset-library|ph):\/\//i.test(uri)) return uri;
  if (uri.startsWith("//")) return `https:${uri}`;

  try {
    const base = new URL(API_BASE_URL);
    if (uri.startsWith("/")) {
      return `${base.origin}${uri}`;
    }

    return `${API_BASE_URL.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
  } catch {
    return uri;
  }
}

function buildSetUserInfoPayload(session, params, userName, options = {}) {
  const avatar = firstParamValue(params, ["avatar"], session?.avatar || "");
  const coverImage = firstParamValue(params, ["coverImage", "cover_image"], session?.coverImage || "");
  const usernameKey = options.usernameKey || "username";
  const coverImageKey = options.coverImageKey || "coverImage";
  const payload = {
    token: session.token,
    avatar: isLocalAssetUri(avatar) ? session?.avatar || "" : avatar,
  };

  payload[usernameKey] = userName;
  payload[coverImageKey] = isLocalAssetUri(coverImage) ? session?.coverImage || "" : coverImage;

  if (!options.minimal) {
    const descriptionKey = options.descriptionKey || "description";
    payload[descriptionKey] = String(firstParamValue(params, ["description"], "")).slice(0, 150);
  }

  return payload;
}

async function setUserInfoWithCompatibility(session, params, userName) {
  const hasDescription = hasOwnValue(params, "description");
  const attempts = [
    { usernameKey: "username", coverImageKey: "coverImage", descriptionKey: "description" },
    { usernameKey: "username", coverImageKey: "coverImage", descriptionKey: "described" },
    { usernameKey: "user_name", coverImageKey: "cover_image", descriptionKey: "description" },
    { usernameKey: "user_name", coverImageKey: "cover_image", descriptionKey: "described" },
  ];

  if (!hasDescription) {
    attempts.push(
      { usernameKey: "username", coverImageKey: "coverImage", minimal: true },
      { usernameKey: "user_name", coverImageKey: "cover_image", minimal: true },
    );
  }

  let lastError = null;

  for (const options of attempts) {
    try {
      const response = await backendApi.setUserInfo(
        buildSetUserInfoPayload(session, params, userName, options),
      );
      await assertBackendOk(response, { message: "Backend set_user_info failed" });
      return response;
    } catch (error) {
      throwIfExpiredFromApiError(error);
      lastError = error;

      const canRetry =
        rejectsField(error, "username") ||
        rejectsField(error, "user_name") ||
        rejectsField(error, "coverImage") ||
        rejectsField(error, "cover_image") ||
        rejectsField(error, "description") ||
        rejectsField(error, "described") ||
        error.status === 400 ||
        String(error?.message || "").includes("1004");

      if (!canRetry) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Backend set_user_info failed");
}

function buildLocalProfileUpdate(session, params, userName, source = ACTIVE_SOURCES.LOCAL) {
  const currentProfile = buildLocalProfileShape(session, resolveMockProfile(session));
  const avatar = firstParamValue(params, ["avatar"], session?.avatar || "");
  const coverImage = firstParamValue(params, ["coverImage", "cover_image"], session?.coverImage || "");
  const description = String(firstParamValue(params, ["description"], session?.description || "")).slice(0, 150);
  const address = firstParamValue(params, ["address"], session?.address || "");
  const profileLink = firstParamValue(params, ["profileLink", "link"], session?.profileLink || "");

  return {
    ...currentProfile,
    ...session,
    ...params,
    id: firstValue(session?.id, currentProfile?.id, session?.identifier, session?.phonenumber, ""),
    username: userName || session?.username || currentProfile?.username || "",
    displayName: userName || session?.displayName || session?.username || currentProfile?.displayName || "",
    avatar,
    coverImage,
    description,
    address,
    profileLink,
    phonenumber: firstValue(session?.phonenumber, currentProfile?.phonenumber, ""),
    identifier: firstValue(session?.identifier, currentProfile?.identifier, session?.phonenumber, ""),
    role: firstValue(session?.role, currentProfile?.role, "HV"),
    handle: firstValue(session?.handle, currentProfile?.handle, ""),
    height: firstValue(session?.height, currentProfile?.height, ""),
    source,
    demoMode: true,
    profileSavedLocally: source !== ACTIVE_SOURCES.SERVER,
  };
}

async function getUserInfoFromBackend(session, targetUserId, isOwnProfile) {
  const attempts = isOwnProfile
    ? [{ token: session.token }]
    : [
        { token: session.token, user_id: targetUserId },
        { token: session.token },
      ];

  let lastError = null;

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      const response = await backendApi.getUserInfo(attempts[index]);
      await assertBackendOk(response, { message: "Backend get_user_info failed" });
      return response;
    } catch (error) {
      throwIfExpiredFromApiError(error);
      lastError = error;

      const canRetry =
        !isOwnProfile &&
        index === 0 &&
        shouldRetryGetUserInfoWithoutUserId(error);

      if (!canRetry) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Backend get_user_info failed");
}

export async function getUserInfo(userId = "") {
  const session = await getCurrentSession();
  const targetUserId = String(userId || "");
  const isOwnProfile = !targetUserId || isSameUser(targetUserId, session?.id || session?.user_id || session?.identifier);

  if (!shouldUseServer(session)) {
    if (isOwnProfile) {
      return localUser(session);
    }

    return fallbackUserById(targetUserId, ACTIVE_SOURCES.LOCAL);
  }

  try {
    const response = await getUserInfoFromBackend(session, targetUserId, isOwnProfile);

    const normalized = normalizeUser(extractObject(response), ACTIVE_SOURCES.SERVER, {
      session,
      isOwnProfile,
    });

    if (!isOwnProfile && !isSameUser(normalized.id, targetUserId)) {
      return fallbackUserById(targetUserId);
    }

    return isOwnProfile && !normalized.description && session?.description
      ? { ...normalized, description: session.description }
      : normalized;
  } catch (error) {
    console.info("[DATA] Server get_user_info fallback", error.message);
    throwIfExpiredFromApiError(error);

    if (!error.sessionExpired) {
      if (isOwnProfile) {
        return normalizeUser(session || DEMO_STUDENT, ACTIVE_SOURCES.LOCAL_FALLBACK, {
          session,
          isOwnProfile: true,
        });
      }

      return fallbackUserById(targetUserId);
    }

    throw error;
  }
}

export async function updateUserInfo(params = {}) {
  const session = await getCurrentSession();
  const userName = params.userName || params.user_name || params.username || "";
  const validationError = validateProfileUserName(userName);

  if (validationError) {
    throw new Error(validationError);
  }

  if (!shouldUseServer(session)) {
    const updated = buildLocalProfileUpdate(session, params, userName, ACTIVE_SOURCES.LOCAL);
    saveMockProfile(updated);
    await saveAuthSession(updated);
    return updated;
  }

  try {
    const response = await setUserInfoWithCompatibility(session, params, userName);

    const normalized = normalizeUser(extractObject(response), ACTIVE_SOURCES.SERVER, {
      session,
      isOwnProfile: true,
    });
    const updated = {
      ...session,
      ...normalized,
      token: session.token || normalized.token || "",
      phonenumber: session.phonenumber || normalized.phonenumber || "",
      identifier: session.identifier || normalized.identifier || session.id || normalized.id || "",
      role: session.role || normalized.role || "HV",
      demoMode: session.demoMode || false,
      source: ACTIVE_SOURCES.SERVER,
      username: userName || normalized.username || session?.username || "",
      displayName: userName || normalized.displayName || session?.displayName || session?.username || "",
      avatar: normalized.avatar || (isLocalAssetUri(params.avatar) ? session?.avatar : params.avatar) || session?.avatar || "",
      coverImage:
        normalized.coverImage ||
        (isLocalAssetUri(params.coverImage || params.cover_image)
          ? session?.coverImage
          : params.coverImage || params.cover_image) ||
        session?.coverImage ||
        "",
      description:
        normalized.description ||
        String(firstParamValue(params, ["description"], session?.description || "")).slice(0, 150),
      address: normalized.address || firstParamValue(params, ["address"], session?.address || ""),
      profileLink: normalized.profileLink || firstParamValue(params, ["profileLink", "link"], session?.profileLink || ""),
    };
    await saveAuthSession(updated);
    return updated;
  } catch (error) {
    const mappedError = mapForbiddenNameError(error);
    if (mappedError !== error || error?.sessionExpired || !shouldFallbackProfileSave(error)) {
      throw mappedError;
    }

    console.info("[DATA] Server set_user_info fallback", error.message);
    const updated = buildLocalProfileUpdate(session, params, userName, ACTIVE_SOURCES.LOCAL_FALLBACK);
    saveMockProfile(updated);
    await saveAuthSession(updated);
    return updated;
  }
}

export async function getUserPosts(userId = "", paging = {}) {
  const session = await getCurrentSession();
  const targetUserId = String(userId || session?.id || session?.user_id || session?.identifier || "");
  const includeLocked = paging.includeLocked !== false;

  if (!shouldUseServer(session)) {
    return getLocalUserPosts(targetUserId, includeLocked, ACTIVE_SOURCES.LOCAL);
  }

  try {
    const response = await backendApi.getListPosts({
      token: session.token,
      user_id: targetUserId,
      index: String(paging.index || 0),
      count: String(paging.count || 20),
    });

    await assertBackendOk(response, { allowNoData: true, message: "Backend get_list_posts failed" });

    const items = extractList(response)
      .map((item) => normalizePost(item, ACTIVE_SOURCES.SERVER))
      .filter((post) => post.id && (includeLocked || post.canComment !== false));

    return {
      items,
      total: toNumber(response?.data?.total || response?.total, items.length),
      hasMore: Boolean(response?.data?.has_more || response?.has_more),
      lastId: String(response?.data?.last_id || response?.last_id || ""),
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    console.info("[DATA] Server user posts fallback", error.message);
    throwIfExpiredFromApiError(error);

    if (!error.sessionExpired) {
      return getLocalUserPosts(
        targetUserId,
        includeLocked,
        ACTIVE_SOURCES.LOCAL_FALLBACK,
      );
    }

    throw error;
  }
}

export async function searchUserProfile(userId = "", keyword = "") {
  const session = await getCurrentSession();
  const normalizedKeyword = String(keyword || "").trim();
  const targetUserId = String(userId || session?.id || session?.user_id || session?.identifier || "");

  if (!normalizedKeyword) {
    return [];
  }

  if (!shouldUseServer(session)) {
    const items = await localPosts.searchPosts(normalizedKeyword);
    return targetUserId ? items.filter((post) => isSameUser(post.author?.id, targetUserId)) : items;
  }

  try {
    const response = await backendApi.search({
      token: session.token,
      keyword: normalizedKeyword,
      user_id: targetUserId,
      index: "0",
      count: "20",
    });

    await assertBackendOk(response, { allowNoData: true, message: "Backend search failed" });

    return extractList(response)
      .map((item) => normalizePost(item, ACTIVE_SOURCES.SERVER))
      .filter((post) => post.id);
  } catch (error) {
    console.info("[DATA] Profile search fallback", error.message);

    if (!error.sessionExpired && canFallbackToLocal()) {
      const items = await localPosts.searchPosts(normalizedKeyword);
      return targetUserId ? items.filter((post) => isSameUser(post.author?.id, targetUserId)) : items;
    }

    throw error;
  }
}

export async function blockUser(userId) {
  const { setBlock } = await import("@/repositories/blockRepository");
  return setBlock(userId, "block");
}
