import { isBackendOk } from "@/repositories/normalizers";
import { clearCurrentUserSession } from "@/utils/userSessionCleanup";
import { router } from "expo-router";
import { Alert } from "react-native";

export class SessionExpiredError extends Error {
  constructor(message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.") {
    super(message);
    this.name = "SessionExpiredError";
    this.sessionExpired = true;
  }
}

export function isInvalidSessionResponse(response) {
  const code = String(response?.code || response?.status || "");
  const message = String(
    response?.message || response?.msg || response?.error || "",
  ).toLowerCase();

  return (
    ["9998", "1009", "401", "403"].includes(code) ||
    message.includes("token is invalid") ||
    message.includes("token không") ||
    message.includes("blocked") ||
    message.includes("bị chặn") ||
    message.includes("unauthorized")
  );
}

export async function assertBackendOk(response, options = {}) {
  if (isInvalidSessionResponse(response)) {
    await clearCurrentUserSession();
    Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
    router.replace("/(auth)/login");

    throw new SessionExpiredError(response?.message || undefined);
  }

  if (isBackendOk(response)) {
    return response;
  }

  if (options.allowNoData && String(response?.code) === "9994") {
    return response;
  }

  throw new Error(
    response?.message ||
      options.message ||
      "Vui lòng kiểm tra kết nối Internet",
  );
}
