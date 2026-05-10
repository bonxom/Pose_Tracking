import { backendApi } from "@/api/client";
import { extractList, isBackendOk } from "@/repositories/normalizers";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

export async function getBlocks() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return [];
  }

  try {
    const response = await backendApi.getListBlocks({
      token: session.token,
      index: "0",
      count: "50",
    });

    if (!isBackendOk(response) && response?.code !== "9994") {
      throw new Error(response?.message || "Backend get_list_blocks failed");
    }

    return extractList(response).map((item) => ({
      id: String(item.id || item.user_id || item.block_id || ""),
      username: item.username || item.name || "Người dùng bị chặn",
      role: item.role || "",
      source: ACTIVE_SOURCES.SERVER,
      raw: item,
    }));
  } catch (error) {
    console.info("[DATA] Server blocks fallback", error.message);

    if (canFallbackToLocal()) {
      return [];
    }

    throw error;
  }
}

export async function setBlock(userId, type = "block") {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { blocked: type !== "unblock", source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setBlock({
    token: session.token,
    user_id: userId,
    type,
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend set_block failed");
  }

  return { blocked: type !== "unblock", source: ACTIVE_SOURCES.SERVER };
}
