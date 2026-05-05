import { API_BASE_URL } from "@/config/env";
import { backendApi } from "@/api/client";

export async function checkBackendStatus() {
  try {
    await backendApi.getListPosts({ index: 0, count: 1 });
    return {
      ok: true,
      baseUrl: API_BASE_URL,
      mode: "backend",
      message: "Backend reachable",
    };
  } catch (error) {
    return {
      ok: false,
      baseUrl: API_BASE_URL,
      mode: "local-demo",
      message: error.message || "Using local demo fallback",
    };
  }
}
