import CourseCard from "@/components/courses/CourseCard";
import colors from "@/constants/colors";
import { getListCourses, requestCourse } from "@/repositories/courseRepository";
import coursesStyles from "@/styles/courses.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CoursesFeedView() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const fetchCourses = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorText("");

      const data = await getListCourses(0, 50);
      setCourses(data || []);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải danh sách khoá học.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchCourses();
    }
  }, [fetchCourses]);

  const handleJoin = useCallback(async (item) => {
    // Optimistic update – mark as requested immediately
    setCourses((prev) =>
      prev.map((c) =>
        c.course_id === item.course_id ? { ...c, is_requested: "1" } : c,
      ),
    );

    try {
      await requestCourse(item.course_id);
    } catch (error) {
      // Roll back on failure
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === item.course_id ? { ...c, is_requested: "0" } : c,
        ),
      );
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể gửi yêu cầu tham gia.");
    }
  }, []);

  if (isLoading && !isRefreshing) {
    return (
      <View style={coursesStyles.centerBox}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={coursesStyles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item, index) =>
          item.course_id ? `${item.course_id}_${index}` : String(index)
        }
        contentContainerStyle={localStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCourses({ refresh: true })}
          />
        }
        ListHeaderComponent={
          <>
            {/* Page title */}
            <View style={coursesStyles.header}>
              <Text style={coursesStyles.headerTitle}>Khoá học</Text>
            </View>

            {/* Error banner */}
            {errorText ? (
              <View style={localStyles.errorBanner}>
                <Text style={coursesStyles.errorText}>{errorText}</Text>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <CourseCard item={item} onJoin={handleJoin} flat />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: colors.border,
            }}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={coursesStyles.centerBox}>
              <Text style={coursesStyles.emptyText}>
                Không có khoá học nào.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
