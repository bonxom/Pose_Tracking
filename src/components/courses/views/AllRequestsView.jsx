import IconButton from "@/components/common/IconButton";
import EnrollmentCard from "@/components/courses/EnrollmentCard";
import SectionHeader from "@/components/courses/SectionHeader";
import SubViewNavBar from "@/components/courses/SubViewNavBar";
import BoltIcon from "@/components/icons/BoltIcon";
import SortAscIcon from "@/components/icons/SortAscIcon";
import SortDescIcon from "@/components/icons/SortDescIcon";
import ModalBottomMenu from "@/components/modals/ModalBottomMenu";
import colors from "@/constants/colors";
import useEnrollmentActions from "@/hooks/useEnrollmentActions";
import { getRequestedEnrollment } from "@/repositories/courseRepository";
import coursesStyles from "@/styles/courses.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export default function AllRequestsView({
  onBack,
  cache,
  setCache,
  onActionSuccess,
}) {
  const [allEnrollments, setAllEnrollments] = useState(cache || []);
  const [isLoading, setIsLoading] = useState(!cache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [sortOrder, setSortOrder] = useState("desc");
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const displayedEnrollments = useMemo(() => {
    return [...allEnrollments].sort((a, b) => {
      const timeA = new Date(a.request.created).getTime();
      const timeB = new Date(b.request.created).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [allEnrollments, sortOrder]);

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
      const res = await getRequestedEnrollment(0, 500);
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
      const res = await getRequestedEnrollment(0, 500);
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
        data={displayedEnrollments}
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
              onRightPress={() => setSortModalVisible(true)}
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
      <ModalBottomMenu
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        buttons={[
          {
            title: "Mặc định",
            icon: (
              <IconButton icon={<BoltIcon color={colors.text} size={24} />} />
            ),
            onPress: () => setSortOrder("desc"),
          },
          {
            title: "Lời mời mới nhất trước tiên",
            icon: (
              <IconButton icon={<SortDescIcon color={colors.text} size={24} />} />
            ),
            onPress: () => setSortOrder("desc"),
          },
          {
            title: "Lời mời cũ nhất trước tiên",
            icon: (
              <IconButton icon={<SortAscIcon color={colors.text} size={24} />} />
            ),
            onPress: () => setSortOrder("asc"),
          },
        ]}
      />
    </View>
  );
}
