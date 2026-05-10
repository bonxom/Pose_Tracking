import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import { DEMO_COURSE, DEMO_EXERCISES } from "@/constants/demo";
import { getCourseExercises, getCurrentCourse } from "@/repositories/courseRepository";
import demoStyles from "@/styles/demo.styles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function CoursesScreen() {
  const [isEnrolled, setIsEnrolled] = useState(DEMO_COURSE.enrolled);
  const [course, setCourse] = useState(DEMO_COURSE);
  const [exercisePosts, setExercisePosts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadExercises = async () => {
        const currentCourse = await getCurrentCourse();
        const posts = await getCourseExercises();
        setCourse(currentCourse);
        setIsEnrolled(Boolean(currentCourse.enrolled));
        setExercisePosts(posts);
      };
      loadExercises();
    }, []),
  );

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Khóa học</Text>
          <Text style={demoStyles.subtitle}>{course.title}</Text>
          <View style={demoStyles.badge}>
            <Text style={demoStyles.badgeText}>
              {isEnrolled ? "Đã tham gia" : "Chưa tham gia"}
            </Text>
          </View>
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>{course.teacherName}</Text>
          <Text style={demoStyles.cardText}>{course.description}</Text>
          <View style={demoStyles.statsGrid}>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>{course.studentCount}</Text>
              <Text style={demoStyles.statLabel}>học viên</Text>
            </View>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>{course.exerciseCount || DEMO_EXERCISES.length}</Text>
              <Text style={demoStyles.statLabel}>bài tập</Text>
            </View>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>86</Text>
              <Text style={demoStyles.statLabel}>điểm demo</Text>
            </View>
          </View>
          <AppButton
            title={isEnrolled ? "Đang học" : "Xin tham gia"}
            onPress={() => setIsEnrolled(true)}
            disabled={isEnrolled}
          />
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Danh sách bài tập</Text>
          {exercisePosts.map((post) => (
            <View key={post.id} style={demoStyles.resultRow}>
              <Text style={demoStyles.cardTitle}>{post.exerciseTitle}</Text>
              <Text style={demoStyles.cardText}>{post.content}</Text>
              <AppButton
                title="Mở bài tập"
                onPress={() => router.push(`/post/${post.id}`)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
