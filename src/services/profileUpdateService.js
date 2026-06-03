import {
  createOptimisticUserInfo,
  updateUserInfo,
} from "@/repositories/userRepository";
import { getCurrentSession } from "@/repositories/source";
import { saveAuthSession } from "@/utils/session";
import { Alert } from "react-native";

let latestProfileUpdateTaskId = 0;

const PROFILE_SYNC_ERROR_MESSAGE =
  "Hồ sơ đã cập nhật trên giao diện, nhưng chưa đồng bộ xong. Vui lòng thử lại sau.";

async function markProfileUpdateError(taskId) {
  if (taskId !== latestProfileUpdateTaskId) {
    return;
  }

  const session = await getCurrentSession();
  if (!session) {
    return;
  }

  await saveAuthSession({
    ...session,
    profileSyncStatus: "error",
    profileSyncErrorMessage: PROFILE_SYNC_ERROR_MESSAGE,
  });

  Alert.alert("Đã lưu giao diện", PROFILE_SYNC_ERROR_MESSAGE);
}

export async function queueProfileUpdate(params = {}, options = {}) {
  const session = await getCurrentSession();
  const optimisticProfile = createOptimisticUserInfo(session || {}, params);
  const taskId = Date.now();

  latestProfileUpdateTaskId = taskId;
  await saveAuthSession(optimisticProfile);

  void (async () => {
    try {
      await updateUserInfo(params);
      if (taskId !== latestProfileUpdateTaskId) {
        return;
      }

      Alert.alert(
        options.successTitle || "Cập nhật thành công",
        options.successMessage || "Cập nhật thành công.",
      );
    } catch {
      await markProfileUpdateError(taskId);
    }
  })();

  return {
    taskId,
    optimisticProfile,
  };
}
