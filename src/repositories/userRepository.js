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
  shouldUseServer,
} from "@/repositories/source";

// Chuẩn hóa dữ liệu người dùng từ API/local thành định dạng chuẩn
export function normalizeUser(
  raw = {},
  source = ACTIVE_SOURCES.SERVER,
  options = {},
) {
  const data = raw ?? {};
  const sessionLike = normalizeSession({ data });
  const session = options.session ?? {};
  const isOwnProfile = options.isOwnProfile === true;
  const id = firstValue(data.id, isOwnProfile ? session.id : "");
  const username = firstValue(
    data.username,
    isOwnProfile ? firstValue(session.username, session.displayName, "") : "",
  );

  if (!id || !username) {
    return {
      id: String(id ?? ""),
      username: username ?? "",
      displayName: username ?? "",
      source,
      unavailable: true,
      unavailableReason: "Tài khoản không tồn tại.",
      raw: data,
    };
  }

  const isBlocked = isBackendEnabled(data.isBlocked);

  return {
    ...sessionLike,
    id: String(id),
    token: firstValue(sessionLike.token, session.token, ""),
    source,
    username,
    displayName: username,
    phonenumber: String(data.phonenumber ?? ""),
    avatar: normalizeMediaUrl(data.avatar),
    coverImage: normalizeMediaUrl(data.coverImage),
    description: normalizeOptionalText(data.description, 150),
    role: firstValue(data.role, "HV"),
    online: isBackendEnabled(data.online),
    isRelated: isBackendEnabled(data.isRelated),
    listing: toNumber(data.listing, 0),
    followed: toNumber(data.followed, 0),
    createdAt: String(data.created ?? ""),
    isOwnProfile,
    unavailable: isBlocked,
    unavailableReason: isBlocked
      ? "Tài khoản không tồn tại hoặc bạn không thể xem hồ sơ này."
      : "",
    height: firstValue(data.height, session.height, ""),
    raw: data,
  };
}

// Hợp nhất thông tin profile cá nhân với session (ưu tiên session nếu đang đồng bộ)
export function mergeOwnProfileWithSession(profile = {}, session = {}) {
  const syncState = String(session?.profileSyncStatus || "").trim();
  const shouldPreferSession =
    syncState === "pending" || syncState === "error" || !profile?.id;

  return {
    ...profile,
    token: firstValue(session?.token, profile?.token, ""),
    id: firstValue(
      profile?.id,
      session?.id,
      session?.user_id,
      session?.identifier,
      "",
    ),
    username: shouldPreferSession
      ? firstValue(
          session?.username,
          session?.displayName,
          profile?.username,
          profile?.displayName,
          "",
        )
      : firstValue(
          profile?.username,
          profile?.displayName,
          session?.username,
          session?.displayName,
          "",
        ),
    displayName: shouldPreferSession
      ? firstValue(
          session?.displayName,
          session?.username,
          profile?.displayName,
          profile?.username,
          "",
        )
      : firstValue(
          profile?.displayName,
          profile?.username,
          session?.displayName,
          session?.username,
          "",
        ),
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
      "",
    ),
    coverVersion: firstValue(
      session?.coverVersion,
      profile?.coverVersion,
      session?.profileSyncRequestedAt,
      "",
    ),
    source: profile?.source || session?.source || ACTIVE_SOURCES.SERVER,
    profileSyncStatus: syncState || "done",
    profileSyncErrorMessage: session?.profileSyncErrorMessage || "",
    isProfileSyncPending: syncState === "pending",
  };
}

// Xác thực tên người dùng (độ dài, ký tự đặc biệt, số...)
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

// Kiểm tra xem hai ID có cùng là một người dùng không
function isSameUser(left, right) {
  return Boolean(left && right && String(left) === String(right));
}

// Chuẩn hóa chuỗi văn bản tùy chọn (tiểu sử), loại bỏ undefined/null và giới hạn độ dài
function normalizeOptionalText(value = "", maxLength = 0) {
  const normalized = String(value ?? "")
    .replace(/^undefined$/i, "")
    .replace(/^null$/i, "")
    .trim();

  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

// Kiểm tra xem giá trị từ backend có biểu thị trạng thái kích hoạt/online không
function isBackendEnabled(value) {
  return ["1", "true", "yes", "online"].includes(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );
}

// Chuẩn hóa chuỗi để phục vụ việc so sánh (loại bỏ dấu, chữ thường...)
function normalizeComparable(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Kiểm tra định danh người dùng có khớp với thông tin ứng viên không
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

// Lấy dữ liệu lỗi từ response của backend
function getBackendErrorData(error) {
  return error?.data || null;
}

// Kiểm tra thuộc tính tồn tại và có giá trị hợp lệ trong đối tượng
function hasOwnValue(object = {}, key) {
  return (
    Object.prototype.hasOwnProperty.call(object, key) &&
    object[key] !== undefined &&
    object[key] !== null
  );
}

// Lấy giá trị đầu tiên tồn tại trong params theo danh sách key
function firstParamValue(params = {}, keys = [], fallback = "") {
  const key = keys.find((item) => hasOwnValue(params, item));
  return key ? params[key] : fallback;
}

function buildLocalProfileShape(session = {}) {
  return {
    ...(session || {}),
    id: firstValue(
      session?.id,
      session?.user_id,
      session?.identifier,
      session?.phonenumber,
      "local_user",
    ),
    username: firstValue(
      session?.username,
      session?.displayName,
      session?.phonenumber,
      "Nguoi dung",
    ),
    displayName: firstValue(
      session?.displayName,
      session?.username,
      session?.phonenumber,
      "Nguoi dung",
    ),
    avatar: firstValue(session?.avatar, ""),
    coverImage: firstValue(session?.coverImage, ""),
    description: firstValue(session?.description, ""),
    address: firstValue(session?.address, ""),
    city: firstValue(session?.city, ""),
    country: firstValue(session?.country, ""),
    profileLink: firstValue(session?.profileLink, ""),
    postCount: firstValue(session?.postCount, 0),
    online: firstValue(session?.online, false),
    listing: firstValue(session?.listing, true),
    role: firstValue(session?.role, "HV"),
    phonenumber: firstValue(session?.phonenumber, ""),
    identifier: firstValue(session?.identifier, session?.phonenumber, ""),
    handle: firstValue(session?.handle, ""),
    height: firstValue(session?.height, ""),
    demoMode: Boolean(session?.demoMode),
  };
}

// Ném lỗi SessionExpiredError nếu phiên đăng nhập hết hạn
function throwIfExpiredFromApiError(error) {
  const data = getBackendErrorData(error);
  if (isInvalidSessionResponse(data || error)) {
    throw new SessionExpiredError(data?.message || error?.message);
  }
}

// Kiểm tra URI có phải là tài nguyên cục bộ trên thiết bị (file://, ph://...)
function isLocalAssetUri(value = "") {
  return /^(file|content|asset-library|ph):\/\//i.test(String(value || ""));
}

// Chuẩn hóa URL ảnh/video (chuyển đường dẫn tương đối thành URL tuyệt đối)
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

// Dự đoán MIME type của ảnh dựa trên đuôi file trong URI
function guessImageMimeType(uri = "") {
  const clean = String(uri || "")
    .split("?")[0]
    .toLowerCase();

  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".heic")) return "image/heic";
  if (clean.endsWith(".heif")) return "image/heif";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";

  return "image/jpeg";
}

// Tạo payload file ảnh từ URI cục bộ để gửi API Multipart
function buildImageFilePayload(uri = "", fieldName = "image") {
  const cleanUri = String(uri || "").trim();
  if (!cleanUri) return null;

  const extByMime = {
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/jpeg": "jpg",
  };
  const mimeType = guessImageMimeType(cleanUri);
  const uriWithoutQuery = cleanUri.split("?")[0];
  const lastSegment = uriWithoutQuery.split("/").pop() || "";
  const hasExt = /\.[a-z0-9]+$/i.test(lastSegment);
  const extension = extByMime[mimeType] || "jpg";
  const fileName = hasExt
    ? lastSegment
    : `${fieldName}-${Date.now()}.${extension}`;

  return {
    fieldName,
    uri: cleanUri,
    name: fileName,
    mimeType,
  };
}

// Xây dựng request payload cập nhật thông tin user (fields & files)
function buildSetUserInfoRequest(session, params, userName) {
  const avatar = firstParamValue(params, ["avatar"], "");
  const coverImage = firstParamValue(params, ["coverImage"], "");
  const description = normalizeOptionalText(
    firstParamValue(params, ["description"], session?.description || ""),
    150,
  );
  const fields = {
    token: session.token,
    username: userName,
    description,
  };
  const files = [];

  if (isLocalAssetUri(avatar)) {
    const avatarFile = buildImageFilePayload(avatar, "avatar");
    if (avatarFile) files.push(avatarFile);
  }

  if (isLocalAssetUri(coverImage)) {
    const coverFile = buildImageFilePayload(coverImage, "coverImage");
    if (coverFile) files.push(coverFile);
  }

  return { fields, files };
}

// Gọi API backend cập nhật thông tin user (Multipart)
async function setUserInfoOnBackend(session, params, userName) {
  try {
    const request = buildSetUserInfoRequest(session, params, userName);
    const response = await backendApi.setUserInfoMultipart(
      request.fields,
      request.files,
    );
    await assertBackendOk(response, {
      message: "Backend set_user_info failed",
    });
    return response;
  } catch (error) {
    throwIfExpiredFromApiError(error);
    throw error;
  }
}

// Tạo đối tượng cập nhật profile cục bộ (mock/offline)
function buildLocalProfileUpdate(
  session,
  params,
  userName,
  source = ACTIVE_SOURCES.LOCAL,
) {
  const currentProfile = buildLocalProfileShape(session);
  const avatar = firstParamValue(params, ["avatar"], session?.avatar || "");
  const coverImage = firstParamValue(
    params,
    ["coverImage"],
    session?.coverImage || "",
  );
  const description = normalizeOptionalText(
    firstParamValue(params, ["description"], session?.description || ""),
    150,
  );
  const address = firstParamValue(params, ["address"], session?.address || "");
  const profileLink = firstParamValue(
    params,
    ["profileLink", "link"],
    session?.profileLink || "",
  );

  return {
    ...currentProfile,
    ...session,
    ...params,
    id: firstValue(
      session?.id,
      currentProfile?.id,
      session?.identifier,
      session?.phonenumber,
      "",
    ),
    username: userName || session?.username || currentProfile?.username || "",
    displayName:
      userName ||
      session?.displayName ||
      session?.username ||
      currentProfile?.displayName ||
      "",
    avatar,
    coverImage,
    description,
    address,
    profileLink,
    phonenumber: firstValue(
      session?.phonenumber,
      currentProfile?.phonenumber,
      "",
    ),
    identifier: firstValue(
      session?.identifier,
      currentProfile?.identifier,
      session?.phonenumber,
      "",
    ),
    role: firstValue(session?.role, currentProfile?.role, "HV"),
    handle: firstValue(session?.handle, currentProfile?.handle, ""),
    height: firstValue(session?.height, currentProfile?.height, ""),
    source,
    demoMode: true,
    profileSavedLocally: source !== ACTIVE_SOURCES.SERVER,
  };
}

// Tạo dữ liệu profile tạm thời (optimistic) để cập nhật nhanh lên UI
export function createOptimisticUserInfo(session = {}, params = {}) {
  const userName = params.userName || params.user_name || params.username || "";
  const source = shouldUseServer(session)
    ? ACTIVE_SOURCES.SERVER
    : ACTIVE_SOURCES.LOCAL;
  const optimistic = buildLocalProfileUpdate(session, params, userName, source);
  const avatarChanged =
    firstParamValue(params, ["avatar"], session?.avatar || "") !==
    (session?.avatar || "");
  const avatarVersion = avatarChanged
    ? new Date().toISOString()
    : session?.avatarVersion || "";

  const coverChanged =
    firstParamValue(params, ["coverImage"], session?.coverImage || "") !==
    (session?.coverImage || "");
  const coverVersion = coverChanged
    ? new Date().toISOString()
    : session?.coverVersion || "";

  return {
    ...optimistic,
    token: session?.token || optimistic.token || "",
    source,
    demoMode: Boolean(session?.demoMode),
    avatarVersion,
    coverVersion,
    profileSyncStatus: shouldUseServer(session) ? "pending" : "done",
    profileSyncErrorMessage: "",
    profileSyncRequestedAt: new Date().toISOString(),
  };
}

export async function getUserInfo(userId = "") {
  const session = await getCurrentSession();
  const targetUserId = String(userId || "");
  const isOwnProfile =
    !targetUserId ||
    isSameUser(
      targetUserId,
      session?.id || session?.user_id || session?.identifier,
    );

  try {
    const response = await backendApi.getUserInfo(
      isOwnProfile
        ? { token: session.token }
        : { token: session.token, userId: targetUserId },
    );

    await assertBackendOk(response, {
      message: "Backend get_user_info failed",
    });

    const normalized = normalizeUser(
      extractObject(response),
      ACTIVE_SOURCES.SERVER,
      {
        session,
        isOwnProfile,
      },
    );

    if (!isOwnProfile && !matchesUserIdentity(targetUserId, normalized)) {
      throw new Error("Backend trả về hồ sơ không khớp người dùng yêu cầu.");
    }

    if (isOwnProfile) {
      const mergedProfile = mergeOwnProfileWithSession(normalized, session);
      return !mergedProfile.description && session?.description
        ? { ...mergedProfile, description: session.description }
        : mergedProfile;
    }

    return normalized;
  } catch (error) {
    console.info("[DATA] Server get_user_info failed", error.message);
    throwIfExpiredFromApiError(error);
    throw error;
  }
}

// Gọi API lấy danh sách bài đăng từ server
async function getBackendPostsPage(session, params = {}) {
  const response = await backendApi.getListPosts({
    token: session.token,
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

  const items = extractList(response)
    .map((item) => normalizePost(item, ACTIVE_SOURCES.SERVER))
    .filter((post) => post.id);

  return {
    items,
    total: toNumber(response?.data?.total || response?.total, items.length),
    hasMore: Boolean(response?.data?.has_more || response?.has_more),
    lastId: String(response?.data?.last_id || response?.last_id || ""),
    source: ACTIVE_SOURCES.SERVER,
  };
}

// Cập nhật thông tin người dùng (online qua API hoặc offline qua mock)
export async function updateUserInfo(params = {}) {
  const session = await getCurrentSession();
  const userName = params.userName || params.username || "";
  const validationError = validateProfileUserName(userName);

  if (validationError) {
    throw new Error(validationError);
  }

  const response = await setUserInfoOnBackend(session, params, userName);

  const normalized = normalizeUser(
    extractObject(response),
    ACTIVE_SOURCES.SERVER,
    {
      session,
      isOwnProfile: true,
    },
  );
  const updated = {
    ...session,
    ...normalized,
    token: session.token || normalized.token || "",
    phonenumber: session.phonenumber || normalized.phonenumber || "",
    identifier:
      session.identifier ||
      normalized.identifier ||
      session.id ||
      normalized.id ||
      "",
    role: session.role || normalized.role || "HV",
    demoMode: session.demoMode || false,
    source: ACTIVE_SOURCES.SERVER,
    avatarVersion:
      firstParamValue(params, ["avatar"], session?.avatar || "") !==
      (session?.avatar || "")
        ? new Date().toISOString()
        : session?.avatarVersion || "",
    coverVersion:
      firstParamValue(params, ["coverImage"], session?.coverImage || "") !==
      (session?.coverImage || "")
        ? new Date().toISOString()
        : session?.coverVersion || "",
    username: userName || normalized.username || session?.username || "",
    displayName:
      userName ||
      normalized.displayName ||
      session?.displayName ||
      session?.username ||
      "",
    avatar: normalized.avatar || params.avatar || session?.avatar || "",
    coverImage:
      normalized.coverImage || params.coverImage || session?.coverImage || "",
    description:
      normalized.description ||
      normalizeOptionalText(
        firstParamValue(params, ["description"], session?.description || ""),
        150,
      ),
    address:
      normalized.address ||
      firstParamValue(params, ["address"], session?.address || ""),
    profileLink:
      normalized.profileLink ||
      firstParamValue(
        params,
        ["profileLink", "link"],
        session?.profileLink || "",
      ),
    profileSyncStatus: "done",
    profileSyncErrorMessage: "",
    profileSyncRequestedAt: "",
  };
  return updated;
}

// Lấy danh sách bài viết của người dùng (tự động phân nhánh server/local)
export async function getUserPosts(userId = "", paging = {}) {
  const session = await getCurrentSession();
  const targetUserId = String(
    userId || session?.id || session?.user_id || session?.identifier || "",
  );
  const includeLocked = paging.includeLocked !== false;

  const mapVisibleItems = (items = []) =>
    items.filter(
      (post) => post.id && (includeLocked || post.canComment !== false),
    );

  try {
    const page = await getBackendPostsPage(session, {
      user_id: targetUserId,
      index: paging.index || 0,
      count: paging.count || 20,
    });

    const items = mapVisibleItems(page.items || []);

    return {
      ...page,
      items,
      total: items.length || page.total,
    };
  } catch (error) {
    console.info("[DATA] Server user posts failed", error.message);
    throwIfExpiredFromApiError(error);
    throw error;
  }
}

// Tìm kiếm bài đăng trong trang cá nhân theo từ khóa
export async function searchUserProfile(userId = "", keyword = "") {
  const session = await getCurrentSession();
  const normalizedKeyword = String(keyword || "").trim();
  const targetUserId = String(
    userId || session?.id || session?.user_id || session?.identifier || "",
  );

  if (!normalizedKeyword) {
    return [];
  }

  try {
    const response = await backendApi.search({
      token: session.token,
      keyword: normalizedKeyword,
      user_id: targetUserId,
      index: "0",
      count: "20",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend search failed",
    });

    const directItems = extractList(response)
      .map((item) => normalizePost(item, ACTIVE_SOURCES.SERVER))
      .filter((post) => post.id);

    return directItems;
  } catch (error) {
    console.info("[DATA] Profile search fallback", error.message);
    throwIfExpiredFromApiError(error);
    throw error;
  }
}
