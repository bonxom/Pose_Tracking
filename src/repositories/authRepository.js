import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/constants/demo";
import { MOCK_USERS } from "@/constants/mocks/users";
import { normalizeSession } from "@/repositories/normalizers";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getDataSourceMode,
  shouldUseServer,
} from "@/repositories/source";

function normalizeLocalSession(user) {
  return {
    ...user.data,
    token: user.data.token || `${user.data.role?.toLowerCase() || "hv"}_demo_token`,
    source: ACTIVE_SOURCES.LOCAL,
    demoMode: true,
  };
}

function localLogin(phonenumber, password) {
  const user = MOCK_USERS.find((item) => item.phonenumber === phonenumber);

  if (!user) {
    return {
      code: "9995",
      message: "User is not validated",
      data: null,
      source: ACTIVE_SOURCES.LOCAL,
    };
  }

  if (user.password !== password) {
    return {
      code: "1004",
      message: "Parameter value is invalid",
      data: null,
      source: ACTIVE_SOURCES.LOCAL,
    };
  }

  return {
    code: "1000",
    message: "OK",
    data: normalizeLocalSession(user),
    source: ACTIVE_SOURCES.LOCAL,
  };
}

export async function loginWithPassword(phonenumber, password, options = {}) {
  const normalizedPhone = phonenumber?.trim();
  const normalizedPassword = password?.trim();
  const mode = getDataSourceMode();
  const serverPreferred = shouldUseServer({ token: "pending", source: ACTIVE_SOURCES.SERVER });

  if (!serverPreferred) {
    return localLogin(normalizedPhone, normalizedPassword);
  }

  try {
    const response = await backendApi.login({
      phonenumber: normalizedPhone,
      password: normalizedPassword,
      devtoken: DEFAULT_DEVICE_TOKEN,
    });

    if (response?.code === "1000" || response?.code === 1000) {
      const session = normalizeSession(response);
      if (!session.token) {
        throw new Error("Backend login response did not include token");
      }

      return {
        code: "1000",
        message: response.message || "OK",
        data: session,
        source: ACTIVE_SOURCES.SERVER,
      };
    }

    if (options.allowLocalFallback && canFallbackToLocal()) {
      console.info("[DATA] Backend login failed, using explicit local demo fallback", response);
      return localLogin(normalizedPhone, normalizedPassword);
    }

    return {
      code: String(response?.code || "BACKEND_LOGIN_FAILED"),
      message:
        response?.message ||
        (mode === "server" ? "Backend login failed" : "Backend login failed. Use a demo shortcut for local mode."),
      data: null,
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    if (options.allowLocalFallback && canFallbackToLocal()) {
      console.info("[DATA] Backend unavailable, using explicit local demo fallback", error.message);
      return localLogin(normalizedPhone, normalizedPassword);
    }

    return {
      code: "NETWORK_ERROR",
      message: error.message || "Backend unavailable",
      data: null,
      source: ACTIVE_SOURCES.SERVER,
    };
  }
}

export async function loginDemoStudent() {
  return localLogin(DEMO_STUDENT.phonenumber, DEMO_STUDENT.password);
}

export async function loginDemoTeacher() {
  return localLogin(DEMO_TEACHER.phonenumber, DEMO_TEACHER.password);
}

export async function logoutSession(session) {
  if (!shouldUseServer(session)) {
    return {
      code: "1000",
      message: "Local session cleared",
      source: ACTIVE_SOURCES.LOCAL,
    };
  }

  try {
    const response = await backendApi.logout({
      token: session.token,
    });

    return {
      code: String(response?.code || "1000"),
      message: response?.message || "Logged out",
      source: ACTIVE_SOURCES.SERVER,
    };
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message: error.message || "Backend logout unavailable; local session cleared",
      source: ACTIVE_SOURCES.SERVER,
    };
  }
}
