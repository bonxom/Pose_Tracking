import { backendApi } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

export async function getBlocks() {
  const session = await getCurrentSession();

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

    const deduped = new Map();
    extractList(response).forEach((item) => {
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
        source: ACTIVE_SOURCES.SERVER,
        raw: item,
      });
    });

    return Array.from(deduped.values());
  } catch (error) {
    console.info("[DATA] Server blocks fallback", error.message);
    throw error;
  }
}

export async function setBlock(userId, type = "block") {
  const session = await getCurrentSession();

  const response = await backendApi.setBlock({
    token: session.token,
    userId: userId,
    type: type === "block" ? "0" : "1",
  });

  await assertBackendOk(response, { message: "Backend set_block failed" });

  return { blocked: type !== "unblock", source: ACTIVE_SOURCES.SERVER };
}
