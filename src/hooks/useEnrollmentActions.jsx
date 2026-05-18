import BlockIcon from "@/components/icons/BlockIcon";
import ModalBottomMenu from "@/components/modals/ModalBottomMenu";
import ModalConfirm from "@/components/modals/ModalConfirm";
import { setBlock } from "@/repositories/blockRepository";
import { approveEnrollment } from "@/repositories/courseRepository";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Text } from "react-native";

export default function useEnrollmentActions(
  setErrorText,
  setIsLoading,
  onActionSuccess,
) {
  const [actionStatuses, setActionStatuses] = useState({});
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    type: "accept",
    requestId: null,
    userName: "",
  });
  const [bottomMenuState, setBottomMenuState] = useState({
    visible: false,
    userId: null,
    userName: "",
  });

  const promptAccept = useCallback((id, name) => {
    setConfirmState({
      visible: true,
      type: "accept",
      requestId: id,
      userName: name,
    });
  }, []);

  const promptReject = useCallback((id, name) => {
    setConfirmState({
      visible: true,
      type: "reject",
      requestId: id,
      userName: name,
    });
  }, []);

  const openBottomMenu = useCallback((id, name) => {
    setBottomMenuState({
      visible: true,
      userId: id,
      userName: name,
    });
  }, []);

  const closeBottomMenu = useCallback(() => {
    setBottomMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  const closeConfirm = useCallback(() => {
    if (!isProcessingAction) {
      setConfirmState((prev) => ({ ...prev, visible: false }));
    }
  }, [isProcessingAction]);

  const confirmAction = useCallback(async () => {
    const { requestId, type } = confirmState;
    if (!requestId) return;

    try {
      setIsProcessingAction(true);
      const isApproved = type === "accept";
      await approveEnrollment(requestId, isApproved);

      setActionStatuses((prev) => ({
        ...prev,
        [requestId]: isApproved ? "accepted" : "rejected",
      }));
      setConfirmState((prev) => ({ ...prev, visible: false }));
      if (onActionSuccess) onActionSuccess();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(
        error.message ||
          `Không thể ${type === "accept" ? "chấp nhận" : "từ chối"}.`,
      );
      setConfirmState((prev) => ({ ...prev, visible: false }));
    } finally {
      setIsProcessingAction(false);
    }
  }, [confirmState, setErrorText]);

  const renderModals = useCallback(() => {
    const actionText = confirmState.type === "accept" ? "chấp nhận" : "từ chối";
    const customMessage = (
      <>
        Bạn có chắc chắn muốn {actionText}{" "}
        <Text style={{ fontWeight: "700", color: "#111827" }}>
          {confirmState.userName}
        </Text>{" "}
        vào khoá học?
      </>
    );

    const {
      visible: bsVisible,
      userName: bsUserName,
      userId: bsUserId,
    } = bottomMenuState;
    const buttons = [
      {
        icon: <BlockIcon size={28} />,
        title: `Chặn trang cá nhân của ${bsUserName}`,
        description: `${bsUserName} sẽ không thể nhìn thấy bạn hoặc liên hệ với bạn`,
        onPress: async () => {
          if (!bsUserId) return;
          console.log("Block userId: ", bsUserId);
          try {
            setIsLoading(true);
            await setBlock(bsUserId, "block");

            setActionStatuses((prev) => ({
              ...prev,
              [bsUserId]: "blocked",
            }));
            if (onActionSuccess) onActionSuccess();
          } catch (error) {
            redirectIfSessionExpired(error, router).then((expired) => {
              if (!expired) {
                setErrorText(error.message || "Không thể chặn người dùng này.");
              }
            });
          } finally {
            setIsLoading(false);
          }
        },
      },
    ];

    return (
      <>
        <ModalConfirm
          visible={confirmState.visible}
          message={customMessage}
          onConfirm={confirmAction}
          onCancel={closeConfirm}
          isProcessing={isProcessingAction}
        />
        <ModalBottomMenu
          visible={bsVisible}
          onClose={closeBottomMenu}
          buttons={buttons}
        />
      </>
    );
  }, [
    confirmState,
    bottomMenuState,
    isProcessingAction,
    confirmAction,
    closeConfirm,
    closeBottomMenu,
    setIsLoading,
    setErrorText,
    onActionSuccess,
  ]);

  return {
    actionStatuses,
    setActionStatuses,
    promptAccept,
    promptReject,
    openBottomMenu,
    renderModals,
  };
}
