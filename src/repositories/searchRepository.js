import { backendApi } from "@/api/client";
import {
  deleteSavedSearch as deleteSavedSearchRecord,
  getSavedSearches as getSavedSearchRecords,
} from "@/repositories/postRepository";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  getCurrentSession,
  sourceFromResponse,
} from "@/repositories/source";
import { getUserInfo } from "@/repositories/userRepository";
import { mapPosts, mapUsersFromResponse } from "@/utils/search";

function normalizeSearchUser(profile = {}, fallback = {}) {
  return {
    id: String(
      profile.id ||
        profile.user_id ||
        profile._id ||
        profile.uuid ||
        fallback.id ||
        "",
    ),
    name: String(
      profile.displayName ||
        profile.fullname ||
        profile.fullName ||
        profile.name ||
        profile.username ||
        fallback.name ||
        "Người dùng",
    ),
    handle: String(
      profile.handle ||
        profile.username ||
        profile.user_name ||
        fallback.handle ||
        "",
    ),
    role: String(profile.role || profile.type || fallback.role || "HV"),
    avatar: String(
      profile.avatar ||
        profile.avatar_url ||
        profile.image ||
        profile.picture ||
        fallback.avatar ||
        "",
    ),
    description: String(
      profile.description ||
        profile.described ||
        profile.bio ||
        fallback.description ||
        "",
    ),
  };
}

async function hydrateSearchUsers(users = []) {
  const enrichedUsers = await Promise.all(
    users.slice(0, 8).map(async (user) => {
      try {
        const profile = await getUserInfo(user.id);
        return normalizeSearchUser(profile, user);
      } catch {
        return user;
      }
    }),
  );

  const existingIds = new Set(enrichedUsers.map((item) => item.id));
  return [
    ...enrichedUsers,
    ...users.filter((item) => !existingIds.has(item.id)),
  ];
}

export async function getSavedSearches() {
  return getSavedSearchRecords();
}

export async function deleteSavedSearch(searchId) {
  return deleteSavedSearchRecord(searchId);
}

export async function clearSavedSearches() {
  const session = await getCurrentSession();

  if (!session?.token) {
    throw new Error("Thiếu token đăng nhập.");
  }

  const response = await backendApi.deleteSavedSearch({
    token: session.token,
    all: "1",
  });

  await assertBackendOk(response, {
    message: "Không thể xóa toàn bộ lịch sử tìm kiếm.",
  });

  return true;
}

export async function searchScreenSearch(keyword = "", options = {}) {
  const session = await getCurrentSession();
  const token = String(session?.token || "");
  const trimmedKeyword = String(keyword || "").trim();

  if (!token) {
    throw new Error("Thiếu token đăng nhập.");
  }

  if (!trimmedKeyword) {
    return {
      posts: [],
      users: [],
      nextIndex: 0,
      hasMore: false,
    };
  }

  const index = Number(options.index || 0);
  const count = Number(options.count || 20);

  const response = await backendApi.search({
    token,
    keyword: trimmedKeyword,
    index: String(index),
    count: String(count),
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Không thể tìm kiếm.",
  });

  const posts = mapPosts(response);
  let users = mapUsersFromResponse(response, posts);

  if (
    sourceFromResponse(response) === ACTIVE_SOURCES.SERVER &&
    !options.append &&
    users.length &&
    !response?.data?.users
  ) {
    users = await hydrateSearchUsers(users);
  }

  // Client-side filter: only include users whose name or handle contains the keyword
  try {
    const lowered = String(trimmedKeyword || "").trim().toLowerCase();
    if (lowered) {
      users = users.filter((u) => {
        const name = String(u?.name || "").toLowerCase();
        const handle = String(u?.handle || "").replace(/^@/, "").toLowerCase();
        return name.includes(lowered) || handle.includes(lowered);
      });
    }
  } catch (_error) {
    // ignore filter errors and return users as-is
  }

  return {
    posts,
    users,
    nextIndex: index + count,
    hasMore: posts.length >= count,
  };
}
