import { backendApi } from "@/api/client";
import { API_TYPE, API_TYPES } from "@/config/env";
import {
  deleteSavedSearch as deleteSavedSearchRecord,
  getSavedSearches as getSavedSearchRecords,
} from "@/repositories/postRepository";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getCurrentSession, isMockMode } from "@/repositories/source";
import * as localPosts from "@/services/postStore";
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

function hasBackendSearchUsers(response = {}) {
  const data = response?.data || {};

  return (
    Array.isArray(data.users) ||
    Array.isArray(data.user) ||
    Array.isArray(data.accounts) ||
    Array.isArray(data.people)
  );
}

function isHashtagKeyword(keyword = "") {
  return String(keyword || "").trim().startsWith("#");
}

function normalizeHashtagKeyword(keyword = "") {
  const trimmed = String(keyword || "").trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

async function searchMockHashtagPosts(keyword = "", options = {}) {
  const normalizedHashtag = normalizeHashtagKeyword(keyword);
  const index = Math.max(0, Number(options.index || 0));
  const count = Math.max(1, Number(options.count || 20));
  const matchedPosts = await localPosts.searchPostsByHashtag(normalizedHashtag);
  const posts = matchedPosts.slice(index, index + count);

  return {
    posts,
    users: [],
    nextIndex: index + count,
    hasMore: index + count < matchedPosts.length,
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

  if (isMockMode() && isHashtagKeyword(trimmedKeyword)) {
    return searchMockHashtagPosts(trimmedKeyword, options);
  }

  const index = Number(options.index || 0);
  const count = Number(options.count || 20);
  const requestedUserId = String(
    options.userId || options.user_id || options.scopeUserId || "",
  ).trim();

  const response = await backendApi.search({
    token,
    keyword: trimmedKeyword,
    ...(requestedUserId ? { user_id: requestedUserId } : {}),
    index: String(index),
    count: String(count),
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Không thể tìm kiếm.",
  });

  let posts = mapPosts(response);
  let users = mapUsersFromResponse(response, posts);
  const backendHasUsers = hasBackendSearchUsers(response);

  if (
    API_TYPE === API_TYPES.BACKEND &&
    !options.append &&
    users.length &&
    !backendHasUsers
  ) {
    users = await hydrateSearchUsers(users);
  }

  // Client-side filter: only include users whose name contains the keyword
  try {
    const lowered = String(trimmedKeyword || "").trim().toLowerCase();
    if (lowered) {
      if (!backendHasUsers) {
        users = users.filter((u) => {
          const name = String(u?.name || "").toLowerCase();
          return name.includes(lowered);
        });
      }

      // Add current user at the top if search keyword matches their own name
      const myName = String(session?.displayName || session?.username || "").toLowerCase();
      if (myName.includes(lowered)) {
        const currentUser = {
          id: String(session?.id || ""),
          name: String(session?.displayName || session?.username || "Người dùng"),
          handle: String(session?.username || ""),
          role: String(session?.role || "HV"),
          avatar: String(session?.avatar || ""),
          description: "",
        };
        users = [currentUser, ...users.filter((u) => u.id !== currentUser.id)];
      }

      const hasInPost = posts.some((p) =>
        String(p?.described || p?.content || "").toLowerCase().includes(lowered)
      );
      const hasInUsername = users.some((u) =>
        String(u?.name || "").toLowerCase().includes(lowered)
      );

      if (!hasInUsername) {
        users = [];
      } else if (!hasInPost) {
        posts = [];
      }
    }
  } catch {
    // ignore filter errors and return users as-is
  }

  return {
    posts,
    users,
    nextIndex: index + count,
    hasMore: posts.length >= count || users.length >= count,
  };
}
