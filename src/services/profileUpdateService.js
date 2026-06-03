import {
  createOptimisticUserInfo,
  updateUserInfo,
} from "@/repositories/userRepository";
import { getCurrentSession } from "@/repositories/source";
import { saveAuthSession } from "@/utils/session";
import { Alert } from "react-native";

let latestProfileUpdateTaskId = 0;

async function markProfileUpdateError(taskId, error) {
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
    profileSyncErrorMessage:
      error?.message || "Backend chưa đồng bộ xong hồ sơ. Vui lòng thử lại sau.",
  });

  Alert.alert(
    "Đã lưu giao diện",
    error?.message ||
      "Hồ sơ đã cập nhật trên giao diện, nhưng backend chưa đồng bộ xong.",
  );
}

export async function queueProfileUpdate(params = {}) {
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
        "Đồng bộ hoàn tất",
        "Backend đã cập nhật hồ sơ xong. Thay đổi đã được xác nhận.",
      );
    } catch (error) {
      await markProfileUpdateError(taskId, error);
    }
  })();

  return {
    taskId,
    optimisticProfile,
  };
}
