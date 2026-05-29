import { API_BASE_URL, API_TYPE, API_TYPES } from "@/config/env";
import { backendApi } from "@/api/client";
import { hasServerSession } from "@/repositories/source";

export async function checkBackendStatus(session = null) {
  const mode = API_TYPE === API_TYPES.MOCK ? "local" : "server";
  const apiType = API_TYPE;

  if (API_TYPE === API_TYPES.MOCK) {
    return {
      ok: true,
      baseUrl: API_BASE_URL,
      state: "local-fallback",
      mode,
      apiType,
      message: "Configured for mock data",
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
          apiType,
          message: "Backend reachable with current session",
        };
      } catch (authError) {
        return {
          ok: false,
          baseUrl: API_BASE_URL,
          state: "contract-error",
          mode: "server",
          apiType,
          message: authError.message || "Backend session check failed",
        };
      }
    }

    return {
      ok: reachable,
      baseUrl: API_BASE_URL,
      state: reachable ? "reachable" : "contract-error",
      mode,
      apiType,
      message: reachable ? "Backend login route reachable" : "Backend returned unexpected response",
    };
  } catch (error) {
    return {
      ok: false,
      baseUrl: API_BASE_URL,
      state: "unavailable",
      mode,
      apiType,
      message: error.message || "Backend unavailable",
    };
  }
}
