import NoInternetView from "@/components/common/NoInternetView";
import SearchButton from "@/components/common/SearchButton";
import EnrollmentCard from "@/components/courses/EnrollmentCard";
import SectionHeader from "@/components/courses/SectionHeader";
import useEnrollmentActions from "@/hooks/useEnrollmentActions";
import { useInternetFetch } from "@/hooks/useNetInfo";
import { getRequestedEnrollment } from "@/repositories/courseRepository";
import coursesStyles from "@/styles/courses.styles";
import globalStyles from "@/styles/global.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

function sortByCreatedDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.request.created) - new Date(a.request.created),
  );
}

export default function RequestsView({
  onGoToAllStudents,
  onGoToAllRequests,
  cache,
  setCache,
  onActionSuccess,
}) {
  const [enrollments, setEnrollments] = useState(cache || []);
  const [isLoading, setIsLoading] = useState(!cache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();

  const {
    actionStatuses,
    setActionStatuses,
    promptAccept,
    promptReject,
    openBottomMenu,
    renderModals,
  } = useEnrollmentActions(setErrorText, setIsLoading, onActionSuccess);

  const fetchRequestsData = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorText("");

        await executeWithInternetCheck(async () => {
          const enrollRes = await getRequestedEnrollment(0, 50);
          const sorted = sortByCreatedDesc(enrollRes);
          setEnrollments(sorted);
          setCache(sorted);
        });

        if (refresh) {
          setActionStatuses({});
        }
      } catch (error) {
        if (await redirectIfSessionExpired(error, router)) return;
        setErrorText(error.message || "Không thể tải dữ liệu.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [setActionStatuses, setCache],
  );

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (!cache) {
        fetchRequestsData();
      }
    }
  }, [cache, fetchRequestsData]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={coursesStyles.centerBox}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isNoInternet && enrollments.length === 0) {
    return (
      <View style={coursesStyles.container}>
        <NoInternetView
          onRefresh={() => fetchRequestsData({ refresh: true })}
          refreshing={isRefreshing}
        />
      </View>
    );
  }

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
            <View style={[globalStyles.headerTopRow, { paddingBottom: 4 }]}>
              <Text style={globalStyles.headerTitle}>Khoá học</Text>
              <SearchButton />
            </View>

            {/* Tab Pills */}
            <View style={globalStyles.tabPills}>
              <Pressable
                style={coursesStyles.tabPill}
                onPress={onGoToAllStudents}
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
              onRightPress={onGoToAllRequests}
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
            onPressCard={() => {}}
            onPressBlock={openBottomMenu}
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
      {renderModals()}
    </View>
  );
}
