import SectionHeader from "@/components/courses/SectionHeader";
import StudentCard from "@/components/courses/StudentCard";
import SubViewNavBar from "@/components/courses/SubViewNavBar";
import useEnrollmentActions from "@/hooks/useEnrollmentActions";
import { getCourseStudents } from "@/repositories/courseRepository";
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

export default function AllStudentsView({
  onBack,
  cache,
  setCache,
  onActionSuccess,
}) {
  const [students, setStudents] = useState(
    cache || { students: [], total: "0" },
  );
  const [isLoading, setIsLoading] = useState(!cache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const { actionStatuses, setActionStatuses, openBottomMenu, renderModals } =
    useEnrollmentActions(setErrorText, setIsLoading, onActionSuccess);

  const fetchStudentsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCourseStudents();
      setStudents(res);
      setCache(res);
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
        fetchStudentsData();
      }
    }
  }, [fetchStudentsData, cache]);

  const refreshStudents = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await getCourseStudents();
      setStudents(res);
      setCache(res);
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
        <SubViewNavBar title="Tất cả học viên" onBack={onBack} />
        <View style={coursesStyles.centerBox}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={coursesStyles.container}>
      <SubViewNavBar title="Tất cả học viên" onBack={onBack} />
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
            onPressBlock={openBottomMenu}
          />
        )}
        ListEmptyComponent={
          <View style={coursesStyles.centerBox}>
            <Text style={coursesStyles.emptyText}>Chưa có học viên nào.</Text>
          </View>
        }
      />
      {renderModals()}
    </View>
  );
}
