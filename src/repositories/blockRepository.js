import { backendApi } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getCurrentSession, sourceFromResponse } from "@/repositories/source";

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

    const source = sourceFromResponse(response);
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
    throw new Error("Thiếu user_id cần chặn/bỏ chặn.");
  }

  const session = await getCurrentSession();
  requireToken(session);

  const response = await backendApi.setBlock({
    token: session.token,
    user_id: normalizedUserId,
    type: type === "block" ? "0" : "1",
  });

  await assertBackendOk(response, { message: "Backend set_block failed" });

  return { blocked: type !== "unblock", source: sourceFromResponse(response) };
}
