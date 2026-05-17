import EnrollmentCard from "@/components/courses/EnrollmentCard";
import SectionHeader from "@/components/courses/SectionHeader";
import StudentCard from "@/components/courses/StudentCard";
import SubViewNavBar from "@/components/courses/SubViewNavBar";
import BlockIcon from "@/components/icons/BlockIcon";
import ActionBottomSheet from "@/components/modals/ActionBottomSheet";
import ModalConfirm from "@/components/modals/ModalConfirm";
import { setBlock } from "@/repositories/blockRepository";
import {
  approveEnrollment,
  getCourseStudents,
  getRequestedEnrollments,
} from "@/repositories/courseRepository";
import coursesStyles from "@/styles/courses.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#050505";

// Icons

const SearchIcon = ({ color = INK, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path
      d="M20 20L16.65 16.65"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Helpers

function sortByCreatedDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.request.created) - new Date(a.request.created),
  );
}

// ══════════════════════════════════════════════
// Main Screen
// ══════════════════════════════════════════════

export default function CoursesScreen() {
  // View state: 'requests' | 'allStudents' | 'allRequests'
  const [currentView, setCurrentView] = useState("requests");

  // Data
  const [enrollments, setEnrollments] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [students, setStudents] = useState({ students: [], total: "0" });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Action statuses (accept/reject)
  // { [requestId]: "accepted" | "rejected" }
  const [actionStatuses, setActionStatuses] = useState({});

  // Modal confirm state
  const [confirmState, setConfirmState] = useState({
    visible: false,
    type: "accept",
    requestId: null,
    userName: "",
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Action Bottom Sheet state
  const [bottomSheetState, setBottomSheetState] = useState({
    visible: false,
    userId: null,
    userName: "",
  });

  // Track whether sub-view data has been fetched
  const allEnrollmentsFetched = useRef(false);
  const studentsFetched = useRef(false);

  // Action Handlers
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

  const openBottomSheet = useCallback((id, name) => {
    setBottomSheetState({
      visible: true,
      userId: id,
      userName: name,
    });
  }, []);

  const closeBottomSheet = useCallback(() => {
    setBottomSheetState((prev) => ({ ...prev, visible: false }));
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

      // Update local status so the UI reflects "Đã chấp nhận yêu cầu" / "Đã từ chối yêu cầu"
      setActionStatuses((prev) => ({
        ...prev,
        [requestId]: isApproved ? "accepted" : "rejected",
      }));
      setConfirmState((prev) => ({ ...prev, visible: false }));
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
  }, [confirmState]);

  // Fetch main data (only requests)
  const fetchRequestsData = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setActionStatuses({}); // Clear statuses on refresh
      } else {
        setIsLoading(true);
      }
      setErrorText("");

      const enrollRes = await getRequestedEnrollments(0, 50);
      setEnrollments(sortByCreatedDesc(enrollRes));

      if (refresh) {
        allEnrollmentsFetched.current = false;
        studentsFetched.current = false;
      }
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch students (for "Tất cả học viên")
  const fetchStudentsData = useCallback(async () => {
    if (studentsFetched.current && students.students?.length > 0) return;

    try {
      setIsLoading(true);
      const res = await getCourseStudents();
      setStudents(res);
      studentsFetched.current = true;
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, [students.students?.length]);

  // Fetch all enrollments (for "Xem tất cả")
  const fetchAllEnrollments = useCallback(async () => {
    if (allEnrollmentsFetched.current && allEnrollments.length > 0) return;

    try {
      setIsLoading(true);
      const res = await getRequestedEnrollments(0, 500);
      setAllEnrollments(sortByCreatedDesc(res));
      allEnrollmentsFetched.current = true;
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, [allEnrollments.length]);

  // Refresh for sub-views
  const refreshAllEnrollments = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setActionStatuses({});
      const res = await getRequestedEnrollments(0, 500);
      setAllEnrollments(sortByCreatedDesc(res));
      allEnrollmentsFetched.current = true;
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshStudents = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setActionStatuses({});
      const res = await getCourseStudents();
      setStudents(res);
      studentsFetched.current = true;
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load on tab focus
  useFocusEffect(
    useCallback(() => {
      setCurrentView("requests");
      // Reset caches when focusing from another page
      studentsFetched.current = false;
      allEnrollmentsFetched.current = false;
      fetchRequestsData();
    }, [fetchRequestsData]),
  );

  // Navigation handlers
  const goToAllStudents = useCallback(() => {
    setCurrentView("allStudents");
    fetchStudentsData();
  }, [fetchStudentsData]);

  const goToAllRequests = useCallback(() => {
    setCurrentView("allRequests");
    fetchAllEnrollments();
  }, [fetchAllEnrollments]);

  const goBack = useCallback(() => setCurrentView("requests"), []);

  // Loading state
  if (isLoading && !isRefreshing && currentView === "requests") {
    return (
      <View style={coursesStyles.centerBox}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderModalConfirm = () => {
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

    return (
      <ModalConfirm
        visible={confirmState.visible}
        message={customMessage}
        onConfirm={confirmAction}
        onCancel={closeConfirm}
        isProcessing={isProcessingAction}
      />
    );
  };

  const renderActionBottomSheet = () => {
    const { visible, userName, userId } = bottomSheetState;
    const buttons = [
      {
        icon: <BlockIcon />,
        title: `Chặn trang cá nhân của ${userName}`,
        description: `${userName} sẽ không thể nhìn thấy bạn hoặc liên hệ với bạn`,
        onPress: async () => {
          if (!userId) return;
          console.log("Block userId: ", userId);
          try {
            setIsLoading(true);
            await setBlock(userId, "block");

            // Update local status to reflect "Đã từ chối yêu cầu và chặn"
            setActionStatuses((prev) => ({
              ...prev,
              [userId]: "blocked",
            }));
          } catch (error) {
            // Can't await redirect in render method directly, but onPress is async so it's fine
            redirectIfSessionExpired(error, router).then((expired) => {
              if (!expired)
                setErrorText(error.message || "Không thể chặn người dùng này.");
            });
          } finally {
            setIsLoading(false);
          }
        },
      },
    ];

    return (
      <ActionBottomSheet
        visible={visible}
        onClose={closeBottomSheet}
        buttons={buttons}
      />
    );
  };

  // ══════════════════════════════════════════
  // VIEW: All Students ("Tất cả học viên")
  // ══════════════════════════════════════════
  if (currentView === "allStudents") {
    return (
      <View style={coursesStyles.container}>
        <SubViewNavBar title="Tất cả học viên" onBack={goBack} />
        <FlatList
          data={students.students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={coursesStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshStudents}
            />
          }
          ListHeaderComponent={
            <>
              <SectionHeader
                count={students.total}
                rightLabel="Sắp xếp"
                onRightPress={() => console.log("Sort pressed")}
              />
              {errorText ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                  <Text style={coursesStyles.errorText}>{errorText}</Text>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <StudentCard
              item={item}
              actionStatus={actionStatuses[item.id]}
              onPressCard={() => {}}
              onPressBlock={openBottomSheet}
            />
          )}
          ListEmptyComponent={
            <View style={coursesStyles.centerBox}>
              <Text style={coursesStyles.emptyText}>Chưa có học viên nào.</Text>
            </View>
          }
        />
        {renderModalConfirm()}
      </View>
    );
  }

  // ══════════════════════════════════════════
  // VIEW: All Requests ("Xem tất cả")
  // ══════════════════════════════════════════
  if (currentView === "allRequests") {
    if (isLoading && !isRefreshing) {
      return (
        <View style={coursesStyles.container}>
          <SubViewNavBar title="Yêu cầu học" onBack={goBack} />
          <View style={coursesStyles.centerBox}>
            <ActivityIndicator size="large" />
          </View>
        </View>
      );
    }

    return (
      <View style={coursesStyles.container}>
        <SubViewNavBar title="Yêu cầu học" onBack={goBack} />
        <FlatList
          data={allEnrollments}
          keyExtractor={(item) => item.request.id}
          contentContainerStyle={coursesStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshAllEnrollments}
            />
          }
          ListHeaderComponent={
            <>
              <SectionHeader
                count={allEnrollments.length}
                rightLabel="Sắp xếp"
                onRightPress={() => console.log("Sort pressed")}
              />
              {errorText ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                  <Text style={coursesStyles.errorText}>{errorText}</Text>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <EnrollmentCard
              item={item}
              actionStatus={actionStatuses[item.request.id]}
              onAccept={promptAccept}
              onReject={promptReject}
              onPressCard={openBottomSheet}
              onPressBlock={openBottomSheet}
            />
          )}
          ListEmptyComponent={
            <View style={coursesStyles.centerBox}>
              <Text style={coursesStyles.emptyText}>Không có yêu cầu nào.</Text>
            </View>
          }
        />
        {renderModalConfirm()}
      </View>
    );
  }

  // ══════════════════════════════════════════
  // VIEW: Main Requests
  // ══════════════════════════════════════════
  return (
    <View style={coursesStyles.container}>
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item.request.id}
        contentContainerStyle={coursesStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchRequestsData({ refresh: true })}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={coursesStyles.header}>
              <Text style={coursesStyles.headerTitle}>Khoá học</Text>
              <Pressable style={coursesStyles.searchBtn} hitSlop={8}>
                <SearchIcon />
              </Pressable>
            </View>

            {/* Tab Pills */}
            <View style={coursesStyles.tabPills}>
              <Pressable
                style={coursesStyles.tabPill}
                onPress={goToAllStudents}
              >
                <Text style={coursesStyles.tabPillText}>Tất cả học viên</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={coursesStyles.divider} />

            {/* Section Header */}
            <SectionHeader
              count={enrollments.length}
              rightLabel="Xem tất cả"
              onRightPress={goToAllRequests}
            />

            {/* Error */}
            {errorText ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={coursesStyles.errorText}>{errorText}</Text>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <EnrollmentCard
            item={item}
            actionStatus={actionStatuses[item.request.id]}
            onAccept={promptAccept}
            onReject={promptReject}
            onPressCard={openBottomSheet}
            onPressBlock={openBottomSheet}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={coursesStyles.centerBox}>
              <Text style={coursesStyles.emptyText}>Không có yêu cầu nào.</Text>
            </View>
          ) : null
        }
      />
      {renderModalConfirm()}
      {renderActionBottomSheet()}
    </View>
  );
}
