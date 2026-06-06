import NoInternetView from "@/components/common/NoInternetView";
import CourseCard from "@/components/courses/CourseCard";
import colors from "@/constants/colors";
import { useInternetFetch } from "@/hooks/useNetInfo";
import { getListCourses, requestCourse } from "@/repositories/courseRepository";
import coursesStyles from "@/styles/courses.styles";
import { CACHE_KEY_COURSES_FEED, readCache, writeCache } from "@/utils/cacheStore";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";

let coursesFeedCache = [];
let coursesCacheLoaded = false;

export default function CoursesFeedView() {
  const [courses, setCourses] = useState(coursesFeedCache);
  const [isLoading, setIsLoading] = useState(coursesFeedCache.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();

  const fetchCourses = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorText("");

      await executeWithInternetCheck(async () => {
        const data = await getListCourses(0, 50);
        coursesFeedCache = data || [];
        setCourses(coursesFeedCache);
        writeCache(CACHE_KEY_COURSES_FEED, coursesFeedCache);
      });
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setErrorText(error.message || "Không thể tải danh sách khoá học.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load persistent cache from disk once per app session
  useEffect(() => {
    if (coursesCacheLoaded || coursesFeedCache.length > 0) return;
    readCache(CACHE_KEY_COURSES_FEED).then((cached) => {
      if (cached?.length > 0 && coursesFeedCache.length === 0) {
        coursesFeedCache = cached;
        setCourses(cached);
        setIsLoading(false);
      }
      coursesCacheLoaded = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if ((isLoading && !isRefreshing) || (isNoInternet && coursesFeedCache.length === 0)) {
    return (
      <View style={coursesStyles.centerBox}>
        {isNoInternet ? (
          <NoInternetView onRefresh={() => fetchCourses({ refresh: true })} refreshing={isRefreshing} />
        ) : (
          <ActivityIndicator size="large" />
        )}
      </View>
    );
  }

  if (isNoInternet) {
    return (
      <View style={coursesStyles.container}>
        <NoInternetView onRefresh={() => fetchCourses({ refresh: true })} refreshing={isRefreshing} />
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
