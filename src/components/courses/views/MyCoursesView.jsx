import NoInternetView from "@/components/common/NoInternetView";
import SectionHeader from "@/components/courses/SectionHeader";
import StudentCard from "@/components/courses/StudentCard";
import SubViewNavBar from "@/components/courses/SubViewNavBar";
import BoltIcon from "@/components/icons/BoltIcon";
import SortAtoZIcon from "@/components/icons/SortAtoZIcon";
import SortZtoAIcon from "@/components/icons/SortZtoAIcon";
import ModalBottomMenu from "@/components/modals/ModalBottomMenu";
import colors from "@/constants/colors";
import { useInternetFetch } from "@/hooks/useNetInfo";
import { getMyCourses } from "@/repositories/courseRepository";
import { getCurrentSession } from "@/repositories/source";
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

export default function MyCoursesView({
  onBack,
  cache,
  setCache,
}) {
  const [courses, setCourses] = useState(cache || []);
  const [isLoading, setIsLoading] = useState(!cache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();

  const [sortOrder, setSortOrder] = useState("default");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session?.id) {
        setCurrentUserId(String(session.id));
      }
    });
  }, []);

  const displayedCourses = useMemo(() => {
    if (!courses) return [];
    if (sortOrder === "default") return courses;
    return [...courses].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
      if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [courses, sortOrder]);

  const fetchCoursesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorText("");
      await executeWithInternetCheck(async () => {
        const res = await getMyCourses();
        const data = res || [];
        setCourses(data);
        setCache(data);
      });
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, [setCache, executeWithInternetCheck]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (!cache) {
        fetchCoursesData();
      }
    }
  }, [fetchCoursesData, cache]);

  const refreshCourses = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setErrorText("");
      await executeWithInternetCheck(async () => {
        const res = await getMyCourses();
        const data = res || [];
        setCourses(data);
        setCache(data);
      });
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải dữ liệu.");
    } finally {
      setIsRefreshing(false);
    }
  }, [setCache, executeWithInternetCheck]);

  const handleOpenProfile = useCallback((courseId) => {
    if (!courseId) return;

    if (currentUserId && String(currentUserId) === String(courseId)) {
      router.push("/(tabs)/profile");
      return;
    }

    router.push({
      pathname: "/profile/[userId]",
      params: { userId: courseId },
    });
  }, [currentUserId]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={coursesStyles.container}>
        <SubViewNavBar title="Khóa học của tôi" onBack={onBack} />
        <View style={coursesStyles.centerBox}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (isNoInternet) {
    return (
      <View style={coursesStyles.container}>
        <SubViewNavBar title="Khóa học của tôi" onBack={onBack} />
        <NoInternetView onRefresh={refreshCourses} refreshing={isRefreshing} />
      </View>
    );
  }

  return (
    <View style={coursesStyles.container}>
      <SubViewNavBar title="Khóa học của tôi" onBack={onBack} />
      <FlatList
        data={displayedCourses}
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        contentContainerStyle={coursesStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshCourses}
          />
        }
        ListHeaderComponent={
          <>
            <SectionHeader
              count={String(courses.length)}
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
          <StudentCard
            item={item}
            onPressCard={handleOpenProfile}
          />
        )}
        ListEmptyComponent={
          <View style={coursesStyles.centerBox}>
            <Text style={coursesStyles.emptyText}>Chưa có khóa học nào.</Text>
          </View>
        }
      />
      <ModalBottomMenu
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        buttons={[
          {
            title: "Tên (A-Z)",
            icon: (
              <View
                style={{
                  backgroundColor: colors.gray,
                  borderRadius: 999,
                  padding: 8,
                }}
              >
                <SortAtoZIcon color={colors.text} size={24} />
              </View>
            ),
            onPress: () => setSortOrder("asc"),
          },
          {
            title: "Tên (Z-A)",
            icon: (
              <View
                style={{
                  backgroundColor: colors.gray,
                  borderRadius: 999,
                  padding: 8,
                }}
              >
                <SortZtoAIcon color={colors.text} size={24} />
              </View>
            ),
            onPress: () => setSortOrder("desc"),
          },
          {
            title: "Mặc định",
            icon: (
              <View
                style={{
                  backgroundColor: colors.gray,
                  borderRadius: 999,
                  padding: 8,
                }}
              >
                <BoltIcon color={colors.text} size={24} />
              </View>
            ),
            onPress: () => setSortOrder("default"),
          },
        ]}
      />
    </View>
  );
}
