import { getCurrentSession } from "@/repositories/source";
import {
  createOptimisticUserInfo,
  updateUserInfo,
} from "@/repositories/userRepository";
import { saveAuthSession } from "@/utils/session";
import { Alert } from "react-native";

let latestProfileUpdateTaskId = 0;

function buildRollbackSession(previousSession, previousProfileSnapshot = {}) {
  if (!previousSession) {
    return null;
  }

  return {
    ...previousSession,
    username:
      previousProfileSnapshot.displayName ??
      previousProfileSnapshot.username ??
      previousSession.username ??
      previousSession.displayName ??
      "",
    displayName:
      previousProfileSnapshot.displayName ??
      previousProfileSnapshot.username ??
      previousSession.displayName ??
      previousSession.username ??
      "",
    avatar:
      previousProfileSnapshot.avatar ?? previousSession.avatar ?? "",
    coverImage:
      previousProfileSnapshot.coverImage ?? previousSession.coverImage ?? "",
    description:
      previousProfileSnapshot.description ??
      previousSession.description ??
      "",
    avatarVersion:
      previousProfileSnapshot.avatarVersion ??
      previousSession.avatarVersion ??
      "",
    coverVersion:
      previousProfileSnapshot.coverVersion ??
      previousSession.coverVersion ??
      "",
  };
}

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

  Alert.alert("Thông tin cá nhân", "Cập nhật thành công");
}

async function rollbackProfileUpdate(taskId, previousSession) {
  if (taskId !== latestProfileUpdateTaskId) {
    return;
  }

  if (previousSession) {
    await saveAuthSession({
      ...previousSession,
      profileSyncStatus: "error",
      profileSyncErrorMessage: "Cập nhật thất bại",
    });
  } else {
    await saveAuthSession(null);
  }

  Alert.alert("Thông tin cá nhân", "Cập nhật thất bại");
}

export async function queueProfileUpdate(params = {}, options = {}) {
  const previousSession = await getCurrentSession();
  const rollbackSession = buildRollbackSession(
    previousSession,
    options.previousProfileSnapshot || {},
  );
  const optimisticProfile = createOptimisticUserInfo(
    previousSession || {},
    params,
  );
  const taskId = Date.now();

  latestProfileUpdateTaskId = taskId;
  await saveAuthSession(optimisticProfile);

  void (async () => {
    try {
      await updateUserInfo(params);
      await finalizeProfileUpdate(taskId);
    } catch {
      await rollbackProfileUpdate(taskId, rollbackSession);
    }
  })();

  return {
    taskId,
    optimisticProfile,
  };
}
