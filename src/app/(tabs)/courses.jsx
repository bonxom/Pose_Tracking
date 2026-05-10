import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import { DEMO_COURSE, DEMO_EXERCISES } from "@/constants/demo";
import {
  getCourseExercises,
  getCourseStudents,
  getCurrentCourse,
  getRequestedEnrollments,
  requestCourse,
} from "@/repositories/courseRepository";
import demoStyles from "@/styles/demo.styles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function CoursesScreen() {
  const [isEnrolled, setIsEnrolled] = useState(DEMO_COURSE.enrolled);
  const [course, setCourse] = useState(DEMO_COURSE);
  const [exercisePosts, setExercisePosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [statusText, setStatusText] = useState("");

  useFocusEffect(
    useCallback(() => {
      const loadExercises = async () => {
        const currentCourse = await getCurrentCourse();
        const posts = await getCourseExercises();
        const studentItems = await getCourseStudents(currentCourse.id);
        const requestItems = await getRequestedEnrollments(currentCourse.id).catch(() => []);
        setCourse(currentCourse);
        setIsEnrolled(Boolean(currentCourse.enrolled));
        setExercisePosts(posts);
        setStudents(studentItems);
        setRequests(requestItems);
      };
      loadExercises();
    }, []),
  );

  const handleRequestCourse = async () => {
    try {
      await requestCourse(course.id);
      setIsEnrolled(true);
      setStatusText("Đã gửi yêu cầu/tham gia khóa học.");
    } catch (error) {
      setStatusText(error.message || "Không thể gửi yêu cầu tham gia khóa học.");
    }
  };

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
            onPress={handleRequestCourse}
            disabled={isEnrolled}
          />
          {statusText ? <Text style={demoStyles.cardText}>{statusText}</Text> : null}
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

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Học viên và yêu cầu</Text>
          <Text style={demoStyles.cardText}>{students.length} học viên hiện có.</Text>
          <Text style={demoStyles.cardText}>{requests.length} yêu cầu chờ duyệt.</Text>
          {students.slice(0, 5).map((student) => (
            <View key={student.id || student.phonenumber} style={demoStyles.resultRow}>
              <Text style={demoStyles.cardTitle}>{student.username}</Text>
              <Text style={demoStyles.cardText}>{student.role} · {student.phonenumber || "Chưa có SĐT"}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
