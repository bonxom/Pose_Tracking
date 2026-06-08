import { backendApi, post } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

const BLOCK_SEARCH_TIMEOUT_MS = 15000;

function requireToken(session) {
  if (!session?.token) {
    throw new Error("Cần đăng nhập để quản lý danh sách chặn.");
  }
}

function normalizeBlockCandidate(item = {}) {
  const id = String(item.id || item.user_id || item._id || item.uuid || "");
  if (!id) return null;

  const username =
    item.username || item.name || item.user_name || item.fullname || "Người dùng";

  return {
    id,
    name: username,
    username,
    handle: item.handle || item.username || item.user_name || "",
    avatar: item.avatar || item.avatar_url || item.image || "",
    role: item.role || item.type || "",
    raw: item,
  };
}

function getResponseUsers(response = {}) {
  const data = response?.data || {};

  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.user)) return data.user;
  if (Array.isArray(data.blocks)) return data.blocks;
  if (Array.isArray(data.blocked_users)) return data.blocked_users;
  if (Array.isArray(data.accounts)) return data.accounts;
  if (Array.isArray(data.people)) return data.people;
  return [];
}

export async function getBlocks() {
  const session = await getCurrentSession();
  requireToken(session);

  try {
    const response = await backendApi.getListBlocks({
      token: session.token,
      index: "0",
      count: "50",
      user_id: session.id || session.user_id || session.identifier || "",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend get_list_blocks failed",
    });

    const source =
      response?.source === ACTIVE_SOURCES.LOCAL
        ? ACTIVE_SOURCES.LOCAL
        : ACTIVE_SOURCES.SERVER;
    const deduped = new Map();
    const blockItems = extractList(response);
    const items = blockItems.length ? blockItems : getResponseUsers(response);

    items.forEach((item) => {
      const id = String(
        item.id || item.user_id || item.blocked_user_id || item.block_id || "",
      );
      if (!id || deduped.has(id)) return;
      deduped.set(id, {
        id,
        username:
          item.username || item.name || item.user_name || "Người dùng bị chặn",
        avatar: item.avatar || "",
        role: item.role || "",
        source,
        raw: item,
      });
    });

    return Array.from(deduped.values());
  } catch (error) {
    console.info("[DATA] Blocks unavailable", error.message);
    throw error;
  }
}

export async function searchBlockCandidates(keyword = "", options = {}) {
  const trimmedKeyword = String(keyword || "").trim();
  if (!trimmedKeyword) {
    return [];
  }

  const session = await getCurrentSession();
  requireToken(session);

  const ownIds = [session.id, session.user_id, session.identifier]
    .filter(Boolean)
    .map((id) => String(id));

  try {
    const response = await post(
      "/search",
      {
        token: session.token,
        keyword: trimmedKeyword,
        index: String(options.index || 0),
        count: String(options.count || 8),
      },
      { timeout: BLOCK_SEARCH_TIMEOUT_MS },
    );

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Không thể tìm người dùng để chặn.",
    });

    const deduped = new Map();
    getResponseUsers(response).forEach((item) => {
      const candidate = normalizeBlockCandidate(item);
      if (!candidate || ownIds.includes(candidate.id) || deduped.has(candidate.id)) {
        return;
      }
      deduped.set(candidate.id, candidate);
    });

    return Array.from(deduped.values());
  } catch (error) {
    if (error?.sessionExpired || error?.name === "SessionExpiredError") {
      throw error;
    }

    if (error?.code === "TIMEOUT") {
      throw new Error("Tìm kiếm mất quá lâu. Vui lòng thử lại.");
    }

    throw new Error("Không thể tìm người dùng. Vui lòng thử lại.");
  }
}

export async function setBlock(userId, type = "block") {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("Chọn người dùng cần chặn hoặc bỏ chặn.");
  }

  const session = await getCurrentSession();
  requireToken(session);

  const ownIds = [session.id, session.user_id, session.identifier]
    .filter(Boolean)
    .map((id) => String(id));

  if (ownIds.includes(normalizedUserId)) {
    throw new Error("Bạn không thể chặn chính mình.");
  }

  const response = await backendApi.setBlock({
    token: session.token,
    userId: normalizedUserId,
    type: type === "block" ? "0" : "1",
  });

  await assertBackendOk(response, { message: "Backend set_block failed" });

  return {
    blocked: type !== "unblock",
    source:
      response?.source === ACTIVE_SOURCES.LOCAL
        ? ACTIVE_SOURCES.LOCAL
        : ACTIVE_SOURCES.SERVER,
  };
}
