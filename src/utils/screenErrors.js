import { clearAuthSession } from "@/utils/session";

export async function redirectIfSessionExpired(error, router) {
  if (!error?.sessionExpired && error?.name !== "SessionExpiredError") {
    return false;
  }

  await clearAuthSession();
  router.replace("/(auth)/login");
  return true;
}
