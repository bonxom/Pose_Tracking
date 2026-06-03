import { extractList, normalizePost } from "@/repositories/normalizers";

export const PAGE_SIZE = 20;

export const SEARCH_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "posts", label: "Bài viết" },
  { id: "people", label: "Mọi người" },
];

function createDefaultSearchCache() {
  return {
    keyword: "",
    posts: [],
    users: [],
    savedSearches: [],
    activeTab: "all",
    hasSearched: false,
    nextIndex: 0,
    hasMore: false,
  };
}

let searchScreenCache = createDefaultSearchCache();

export function getSearchScreenCache() {
  return searchScreenCache;
}

export function resetSearchScreenCache() {
  searchScreenCache = createDefaultSearchCache();
}

export function persistSearchScreenCache(nextState) {
  searchScreenCache = {
    ...searchScreenCache,
    ...nextState,
  };
}

export function mapSavedSearches(response) {
  const data = response?.data || {};
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data.saved_searches)
      ? data.saved_searches
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.searches)
          ? data.searches
          : Array.isArray(data.history)
            ? data.history
            : [];

  return items
    .map((item, index) => ({
      id: String(
        item.search_id ||
          item.id ||
          item.saved_search_id ||
          item.history_id ||
          `saved_${index}`,
      ),
      keyword: String(
        item.keyword ||
          item.search_keyword ||
          item.name ||
          item.value ||
          item.text ||
          "",
      ).trim(),
      createdAt: String(
        item.created_at || item.createdAt || item.created || item.updated_at || "",
      ),
    }))
    .filter((item) => item.keyword);
}

export function mapPosts(response) {
  return extractList(response)
    .map((item) => normalizePost(item))
    .filter((item) => item?.id);
}

function dedupeUsers(posts = []) {
  const seen = new Set();

  return posts
    .map((post) => ({
      id: String(post.author?.id || ""),
      name:
        post.author?.name ||
        post.author?.username ||
        post.author?.handle ||
        "Người dùng",
      handle: post.author?.handle || post.author?.username || "",
      role: post.author?.role || "HV",
      avatar: post.author?.avatar || "",
      description: "",
    }))
    .filter((user) => {
      if (!user.id || seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
}

export function mapUsersFromResponse(response, fallbackPosts = []) {
  const rawUsers = Array.isArray(response?.data?.users)
    ? response.data.users
    : Array.isArray(response?.data?.user)
      ? response.data.user
      : Array.isArray(response?.data?.accounts)
        ? response.data.accounts
        : Array.isArray(response?.data?.people)
          ? response.data.people
          : [];
  const seen = new Set();
  const mappedUsers = rawUsers
    .map((item, index) => ({
      id: String(
        item.id ||
          item.user_id ||
          item._id ||
          item.uuid ||
          item.identifier ||
          item.username ||
          item.user_name ||
          item.handle ||
          `search_user_${index}`,
      ),
      name: String(
        item.name ||
          item.fullname ||
          item.fullName ||
          item.displayName ||
          item.username ||
          item.user_name ||
          "Người dùng",
      ),
      handle: String(item.username || item.user_name || item.handle || ""),
      role: String(item.role || item.type || "HV"),
      avatar: String(item.avatar || item.avatar_url || item.image || item.picture || ""),
      description: String(item.description || item.described || item.bio || ""),
    }))
    .filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

  if (mappedUsers.length) {
    return mappedUsers;
  }

  return dedupeUsers(fallbackPosts);
}
