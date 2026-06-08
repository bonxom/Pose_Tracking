import { backendApi } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

function extractBlockUsers(response) {
  const data = response?.data || response || {};

  if (Array.isArray(data.users)) return data.users;
  if (Array.isArray(data.blocks)) return data.blocks;
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data.items)) return data.items;

  return extractList(response);
}

function requireToken(session) {
  if (!session?.token) {
    throw new Error("Cần đăng nhập để quản lý danh sách chặn.");
  }
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
    extractBlockUsers(response).forEach((item) => {
      const id = String(
        item.blockedUserId ||
          item.blocked_user_id ||
          item.userId ||
          item.user_id ||
          item.id ||
          item.block_id ||
          "",
      );
      if (!id || deduped.has(id)) return;
      deduped.set(id, {
        id,
        userId: id,
        blockedUserId: id,
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
