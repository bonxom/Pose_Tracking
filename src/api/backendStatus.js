import { API_BASE_URL } from "@/config/env";
import { backendApi } from "@/api/client";
import { getDataSourceMode, hasServerSession } from "@/repositories/source";

export async function checkBackendStatus(session = null) {
  const mode = getDataSourceMode();

  if (mode === "local") {
    return {
      ok: true,
      baseUrl: API_BASE_URL,
      state: "local-fallback",
      mode,
      message: "Configured for local demo data",
    };
  }

  try {
    const loginProbe = await backendApi.login({
      phonenumber: "0000000000",
      password: "probe",
      devtoken: "expo-web-demo",
    });

    const reachable = Boolean(loginProbe?.code || loginProbe?.message);

    if (session && hasServerSession(session)) {
      try {
        await backendApi.getListPosts({
          token: session.token,
          index: "0",
          count: "1",
          last_id: "",
          category_id: "",
        });

        return {
          ok: true,
          baseUrl: API_BASE_URL,
          state: "authenticated",
          mode,
          message: "Backend reachable with current session",
        };
      } catch (authError) {
        return {
          ok: false,
          baseUrl: API_BASE_URL,
          state: "contract-error",
          mode: "server",
          message: authError.message || "Backend session check failed",
        };
      }
    }

    return {
      ok: reachable,
      baseUrl: API_BASE_URL,
      state: reachable ? "reachable" : "contract-error",
      mode,
      message: reachable ? "Backend login route reachable" : "Backend returned unexpected response",
    };
  } catch (error) {
    return {
      ok: false,
      baseUrl: API_BASE_URL,
      state: "unavailable",
      mode: "local-fallback",
      message: error.message || "Using local demo fallback",
    };
  }
}
