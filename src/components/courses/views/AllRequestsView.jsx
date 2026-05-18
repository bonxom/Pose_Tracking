import EnrollmentCard from "@/components/courses/EnrollmentCard";
import SectionHeader from "@/components/courses/SectionHeader";
import SubViewNavBar from "@/components/courses/SubViewNavBar";
import useEnrollmentActions from "@/hooks/useEnrollmentActions";
import { getRequestedEnrollments } from "@/repositories/courseRepository";
import coursesStyles from "@/styles/courses.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

function sortByCreatedDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.request.created) - new Date(a.request.created),
  );
}

export default function AllRequestsView({ onBack, cache, setCache, onActionSuccess }) {
  const [allEnrollments, setAllEnrollments] = useState(cache || []);
  const [isLoading, setIsLoading] = useState(!cache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const {
    actionStatuses,
    setActionStatuses,
    promptAccept,
    promptReject,
    openBottomMenu,
    renderModals,
  } = useEnrollmentActions(setErrorText, setIsLoading, onActionSuccess);

  const fetchAllEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getRequestedEnrollments(0, 500);
      const sorted = sortByCreatedDesc(res);
      setAllEnrollments(sorted);
      setCache(sorted);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (!cache) {
        fetchAllEnrollments();
      }
    }
  }, [fetchAllEnrollments, cache]);

  const refreshAllEnrollments = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await getRequestedEnrollments(0, 500);
      const sorted = sortByCreatedDesc(res);
      setAllEnrollments(sorted);
      setCache(sorted);
      setActionStatuses({});
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsRefreshing(false);
    }
  }, [setActionStatuses, setCache]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={coursesStyles.container}>
        <SubViewNavBar title="Yêu cầu học" onBack={onBack} />
        <View style={coursesStyles.centerBox}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={coursesStyles.container}>
      <SubViewNavBar title="Yêu cầu học" onBack={onBack} />
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
            onPressCard={() => {}}
            onPressBlock={openBottomMenu}
          />
        )}
        ListEmptyComponent={
          <View style={coursesStyles.centerBox}>
            <Text style={coursesStyles.emptyText}>Không có yêu cầu nào.</Text>
          </View>
        }
      />
      {renderModals()}
    </View>
  );
}
