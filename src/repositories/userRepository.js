import { backendApi } from "@/api/client";
import { API_BASE_URL } from "@/config/env";
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
  getCurrentSession,
  sourceFromResponse,
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
    description: normalizeOptionalText(
      firstValue(raw.description, raw.described, raw.bio, raw.about, ""),
      150,
    ),
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

export function mergeOwnProfileWithSession(profile = {}, session = {}) {
  const syncState = String(session?.profileSyncStatus || "").trim();
  const shouldPreferSession =
    syncState === "pending" || syncState === "error" || !profile?.id;

  return {
    ...profile,
    token: firstValue(session?.token, profile?.token, ""),
    id: firstValue(profile?.id, session?.id, session?.user_id, session?.identifier, ""),
    username: shouldPreferSession
      ? firstValue(session?.username, session?.displayName, profile?.username, profile?.displayName, "")
      : firstValue(profile?.username, profile?.displayName, session?.username, session?.displayName, ""),
    displayName: shouldPreferSession
      ? firstValue(session?.displayName, session?.username, profile?.displayName, profile?.username, "")
      : firstValue(profile?.displayName, profile?.username, session?.displayName, session?.username, ""),
    avatar: shouldPreferSession
      ? firstValue(session?.avatar, profile?.avatar, "")
      : firstValue(profile?.avatar, session?.avatar, ""),
    coverImage: shouldPreferSession
      ? firstValue(session?.coverImage, profile?.coverImage, "")
      : firstValue(profile?.coverImage, session?.coverImage, ""),
    description: normalizeOptionalText(
      shouldPreferSession
        ? firstValue(session?.description, profile?.description, "")
        : firstValue(profile?.description, session?.description, ""),
      150,
    ),
    address: shouldPreferSession
      ? firstValue(session?.address, profile?.address, "")
      : firstValue(profile?.address, session?.address, ""),
    city: shouldPreferSession
      ? firstValue(session?.city, profile?.city, "")
      : firstValue(profile?.city, session?.city, ""),
    country: shouldPreferSession
      ? firstValue(session?.country, profile?.country, "")
      : firstValue(profile?.country, session?.country, ""),
    profileLink: shouldPreferSession
      ? firstValue(session?.profileLink, profile?.profileLink, "")
      : firstValue(profile?.profileLink, session?.profileLink, ""),
    height: shouldPreferSession
      ? firstValue(session?.height, profile?.height, "")
      : firstValue(profile?.height, session?.height, ""),
    role: shouldPreferSession
      ? firstValue(session?.role, profile?.role, "HV")
      : firstValue(profile?.role, session?.role, "HV"),
    avatarVersion: firstValue(
      session?.avatarVersion,
      profile?.avatarVersion,
      session?.profileSyncRequestedAt,
      session?.loggedInAt,
      "",
    ),
    source: profile?.source || session?.source || ACTIVE_SOURCES.SERVER,
    profileSyncStatus: syncState || "done",
    profileSyncErrorMessage: session?.profileSyncErrorMessage || "",
    isProfileSyncPending: syncState === "pending",
  };
}

export function createOptimisticUserInfo(session = {}, params = {}) {
  const userName = params.userName || params.user_name || params.username || "";
  const avatarChanged =
    firstParamValue(params, ["avatar"], session?.avatar || "") !==
    (session?.avatar || "");

  return {
    ...session,
    ...params,
    username: userName || session?.username || session?.displayName || "",
    displayName: userName || session?.displayName || session?.username || "",
    avatar: firstParamValue(params, ["avatar"], session?.avatar || ""),
    coverImage: firstParamValue(
      params,
      ["coverImage", "cover_image"],
      session?.coverImage || "",
    ),
    description: normalizeOptionalText(
      firstParamValue(params, ["description"], session?.description || ""),
      150,
    ),
    avatarVersion: avatarChanged
      ? new Date().toISOString()
      : session?.avatarVersion || session?.loggedInAt || "",
    profileSyncStatus: "pending",
    profileSyncErrorMessage: "",
    profileSyncRequestedAt: new Date().toISOString(),
  };
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

function isSameUser(left, right) {
  return Boolean(left && right && String(left) === String(right));
}

function normalizeOptionalText(value = "", maxLength = 0) {
  const normalized = String(value ?? "")
    .replace(/^undefined$/i, "")
    .replace(/^null$/i, "")
    .trim();

  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

function normalizeComparable(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchesUserIdentity(targetUserId = "", candidate = {}) {
  const target = normalizeComparable(targetUserId);
  if (!target) return false;

  const candidateValues = [
    candidate.id,
    candidate.user_id,
    candidate._id,
    candidate.uuid,
    candidate.identifier,
    candidate.username,
    candidate.user_name,
    candidate.handle,
    candidate.name,
    candidate.fullname,
    candidate.fullName,
    candidate.displayName,
    candidate.author?.id,
    candidate.author?.handle,
    candidate.author?.name,
  ];

  return candidateValues.some((value) => normalizeComparable(value) === target);
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
    message.includes("property userid should not exist") ||
    rejectsField(error, "userId") ||
    message.includes("property user_id should not exist") ||
    rejectsField(error, "user_id") ||
    error?.status === 400
  );
}

function firstParamValue(params = {}, keys = [], fallback = "") {
  const key = keys.find((item) => hasOwnValue(params, item));
  return key ? params[key] : fallback;
}

function throwIfExpiredFromApiError(error) {
  const data = getBackendErrorData(error);
  if (isInvalidSessionResponse(data || error)) {
    throw new SessionExpiredError(data?.message || error?.message);
  }
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
    payload[descriptionKey] = normalizeOptionalText(
      firstParamValue(params, ["description"], ""),
      150,
    );
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

async function getUserInfoFromBackend(session, targetUserId, isOwnProfile) {
  const attempts = isOwnProfile
    ? [{ token: session?.token || "" }]
    : [
        { token: session?.token || "", userId: targetUserId },
        { token: session?.token || "", user_id: targetUserId },
        { token: session?.token || "" },
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

      const canRetry = !isOwnProfile && shouldRetryGetUserInfoWithoutUserId(error);

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

  try {
    const response = await getUserInfoFromBackend(session, targetUserId, isOwnProfile);

    const responseSource = sourceFromResponse(response);
    const normalized = normalizeUser(extractObject(response), responseSource, {
      session,
      isOwnProfile,
    });

    if (!isOwnProfile && !matchesUserIdentity(targetUserId, normalized)) {
      throw new Error("Backend trả về hồ sơ không khớp người dùng yêu cầu.");
    }

    return isOwnProfile && !normalized.description && session?.description
      ? { ...normalized, description: session.description }
      : normalized;
  } catch (error) {
    console.info("[DATA] Server get_user_info failed", error.message);
    throwIfExpiredFromApiError(error);

    if (!isOwnProfile) {
      const fallbackProfile = await resolveBackendProfileFromPosts(session, targetUserId);
      if (fallbackProfile) {
        return fallbackProfile;
      }
    }

    throw error;
  }
}

async function getBackendCompatibilityPosts(session, params = {}) {
  const response = await backendApi.getListPosts({
    token: session?.token || "",
    index: String(params.index || 0),
    count: String(params.count || 100),
    last_id: params.lastId || params.last_id || "",
    category_id: params.categoryId || params.category_id || "",
    ...(params.user_id ? { user_id: params.user_id } : {}),
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend get_list_posts failed",
  });

  const responseSource = sourceFromResponse(response);
  const items = extractList(response)
    .map((item) => normalizePost(item, responseSource))
    .filter((post) => post.id);

  return {
    items,
    total: toNumber(response?.data?.total || response?.total, items.length),
    hasMore: Boolean(response?.data?.has_more || response?.has_more),
    lastId: String(response?.data?.last_id || response?.last_id || ""),
    source: responseSource,
  };
}

async function resolveBackendProfileFromPosts(session, targetUserId) {
  const page = await getBackendCompatibilityPosts(session, {
    index: 0,
    count: 100,
  });
  const matchedPosts = page.items.filter((post) =>
    matchesUserIdentity(targetUserId, post.author),
  );
  const firstPost = matchedPosts[0];

  if (!firstPost) {
    return null;
  }

  return {
    ...normalizeUser(
      {
        id: firstPost.author?.id,
        username: firstPost.author?.handle || firstPost.author?.name,
        user_name: firstPost.author?.handle || firstPost.author?.name,
        name: firstPost.author?.name,
        avatar: firstPost.author?.avatar,
        role: firstPost.author?.role,
      },
      page.source || ACTIVE_SOURCES.SERVER,
      { session, isOwnProfile: false },
    ),
    postCount: matchedPosts.length,
  };
}

export async function updateUserInfo(params = {}) {
  const session = await getCurrentSession();
  const userName = params.userName || params.user_name || params.username || "";
  const validationError = validateProfileUserName(userName);

  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const response = await setUserInfoWithCompatibility(session, params, userName);

    const responseSource = sourceFromResponse(response);
    const normalized = normalizeUser(extractObject(response), responseSource, {
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
      source: responseSource,
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
        normalizeOptionalText(
          firstParamValue(params, ["description"], session?.description || ""),
          150,
        ),
      address: normalized.address || firstParamValue(params, ["address"], session?.address || ""),
      profileLink: normalized.profileLink || firstParamValue(params, ["profileLink", "link"], session?.profileLink || ""),
    };
    await saveAuthSession(updated);
    return updated;
  } catch (error) {
    const mappedError = mapForbiddenNameError(error);
    throw mappedError;
  }
}

export async function getUserPosts(userId = "", paging = {}) {
  const session = await getCurrentSession();
  const targetUserId = String(userId || session?.id || session?.user_id || session?.identifier || "");
  const includeLocked = paging.includeLocked !== false;

  const mapVisibleItems = (items = []) =>
    items.filter((post) => post.id && (includeLocked || post.canComment !== false));

  try {
    const directPage = await getBackendCompatibilityPosts(session, {
      user_id: targetUserId,
      index: paging.index || 0,
      count: paging.count || 20,
    });

    const directItems = mapVisibleItems(directPage.items || []);
    if (directItems.length || !targetUserId) {
      return {
        ...directPage,
        items: directItems,
        total: directItems.length || directPage.total,
      };
    }

    const compatibilityPage = await getBackendCompatibilityPosts(session, {
      index: 0,
      count: Math.max(100, Number(paging.count || 20)),
    });
    const matchedItems = mapVisibleItems(
      (compatibilityPage.items || []).filter((post) =>
        matchesUserIdentity(targetUserId, post.author),
      ),
    );

    return {
      items: matchedItems,
      total: matchedItems.length,
      hasMore: false,
      lastId: matchedItems[matchedItems.length - 1]?.id || "",
      source: compatibilityPage.source,
    };
  } catch (error) {
    console.info("[DATA] Server user posts failed", error.message);
    throwIfExpiredFromApiError(error);
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

  try {
    const response = await backendApi.search({
      token: session?.token || "",
      keyword: normalizedKeyword,
      user_id: targetUserId,
      index: "0",
      count: "20",
    });

    await assertBackendOk(response, { allowNoData: true, message: "Backend search failed" });

    const responseSource = sourceFromResponse(response);
    return extractList(response)
      .map((item) => normalizePost(item, responseSource))
      .filter((post) => post.id);
  } catch (error) {
    console.info("[DATA] Profile search unavailable", error.message);
    throwIfExpiredFromApiError(error);
    throw error;
  }
}

export async function blockUser(userId) {
  const { setBlock } = await import("@/repositories/blockRepository");
  return setBlock(userId, "block");
}
