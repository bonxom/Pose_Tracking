import {
  createOptimisticUserInfo,
  updateUserInfo,
} from "@/repositories/userRepository";
import { getCurrentSession } from "@/repositories/source";
import { saveAuthSession } from "@/utils/session";
import { Alert } from "react-native";

let latestProfileUpdateTaskId = 0;

async function finalizeProfileUpdate(taskId) {
  if (taskId !== latestProfileUpdateTaskId) {
    return;
  }

  const currentSession = await getCurrentSession();
  if (taskId !== latestProfileUpdateTaskId || !currentSession) {
    return;
  }

  await saveAuthSession({
    ...currentSession,
    profileSyncStatus: "done",
    profileSyncErrorMessage: "",
    profileSyncRequestedAt: "",
  });

  Alert.alert("Cập nhật thành công");
}

async function rollbackProfileUpdate(taskId, previousSession) {
  if (taskId !== latestProfileUpdateTaskId) {
    return;
  }

  await saveAuthSession(previousSession ?? null);

  Alert.alert("Cập nhật thất bại");
}

export async function queueProfileUpdate(params = {}) {
  const previousSession = await getCurrentSession();
  const optimisticProfile = createOptimisticUserInfo(previousSession || {}, params);
  const taskId = Date.now();

  latestProfileUpdateTaskId = taskId;
  await saveAuthSession(optimisticProfile);

  void (async () => {
    try {
      await updateUserInfo(params);
      await finalizeProfileUpdate(taskId);
    } catch {
      await rollbackProfileUpdate(taskId, previousSession);
    }
  })();

  return {
    taskId,
    optimisticProfile,
  };
}
