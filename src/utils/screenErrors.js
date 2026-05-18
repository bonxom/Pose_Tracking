import { clearAuthSession } from "@/utils/session";
import { Alert } from "react-native";

export async function redirectIfSessionExpired(error, router) {
  if (!error?.sessionExpired && error?.name !== "SessionExpiredError") {
    return false;
  }

  await clearAuthSession();
  Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
  router.replace("/(auth)/login");

  return true;
}
