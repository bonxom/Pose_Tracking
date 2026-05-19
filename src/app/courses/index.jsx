import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import { DEMO_COURSE, DEMO_EXERCISES } from "@/constants/demo";
import {
  approveEnrollment,
  getCourseExercises,
  getCourseStudents,
  getCurrentCourse,
  getRequestedEnrollments,
  requestCourse,
} from "@/repositories/courseRepository";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function CoursesScreen() {
  const [enrollmentStatus, setEnrollmentStatus] = useState(
    DEMO_COURSE.enrolled ? "enrolled" : "none",
  );
  const [course, setCourse] = useState(DEMO_COURSE);
  const [exercisePosts, setExercisePosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [statusText, setStatusText] = useState("");

  useFocusEffect(
    useCallback(() => {
      const loadCourseData = async () => {
        try {
          const currentCourse = await getCurrentCourse();
          const posts = await getCourseExercises();
          const studentItems = await getCourseStudents(currentCourse.id);
          const requestItems = await getRequestedEnrollments(
            currentCourse.id,
          ).catch(() => []);

          setCourse(currentCourse);
          setEnrollmentStatus(
            currentCourse.enrollmentStatus ||
              (currentCourse.enrolled
                ? "enrolled"
                : currentCourse.requested
                  ? "requested"
                  : "none"),
          );
          setExercisePosts(posts);
          setStudents(studentItems);
          setRequests(requestItems);
        } catch (error) {
          if (await redirectIfSessionExpired(error, router)) return;
          setStatusText(error.message || "Khong the tai du lieu khoa hoc.");
        }
      };

      loadCourseData();
    }, []),
  );

  const handleRequestCourse = async () => {
    try {
      const result = await requestCourse(course.id);
      setEnrollmentStatus(result.enrollmentStatus || "requested");
      setStatusText("Da gui yeu cau tham gia. Vui long cho GV duyet.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Khong the gui yeu cau tham gia.");
    }
  };

  const handleApprove = async (request, isAccepted) => {
    try {
      await approveEnrollment(request.user_id || request.id, isAccepted);
      setRequests((current) => current.filter((item) => item !== request));
      setStatusText(isAccepted ? "Da duyet yeu cau." : "Da tu choi yeu cau.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Khong the xu ly yeu cau.");
    }
  };

  const isEnrolled = enrollmentStatus === "enrolled";
  const isRequested = enrollmentStatus === "requested";

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Khoa hoc</Text>
          <Text style={demoStyles.subtitle}>{course.title}</Text>
          <View style={demoStyles.badge}>
            <Text style={demoStyles.badgeText}>
              {isEnrolled
                ? "Da tham gia"
                : isRequested
                  ? "Dang cho duyet"
                  : "Chua tham gia"}
            </Text>
          </View>
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>{course.teacherName}</Text>
          <Text style={demoStyles.cardText}>{course.description}</Text>
          <View style={demoStyles.statsGrid}>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>{course.studentCount}</Text>
              <Text style={demoStyles.statLabel}>hoc vien</Text>
            </View>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>
                {course.exerciseCount ?? DEMO_EXERCISES.length}
              </Text>
              <Text style={demoStyles.statLabel}>bai tap</Text>
            </View>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>
                {course.latestExerciseId ? "Co" : "-"}
              </Text>
              <Text style={demoStyles.statLabel}>bai moi</Text>
            </View>
          </View>
          <AppButton
            title={
              isEnrolled
                ? "Dang hoc"
                : isRequested
                  ? "Da gui yeu cau"
                  : "Xin tham gia"
            }
            onPress={handleRequestCourse}
            disabled={isEnrolled || isRequested || !course.id}
          />
          {statusText ? (
            <Text style={demoStyles.cardText}>{statusText}</Text>
          ) : null}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Danh sach bai tap</Text>
          {exercisePosts.map((post) => (
            <View key={post.id} style={demoStyles.resultRow}>
              <Text style={demoStyles.cardTitle}>{post.exerciseTitle}</Text>
              <Text style={demoStyles.cardText}>{post.content}</Text>
              <AppButton
                title="Mo bai tap"
                onPress={() => router.push(`/post/${post.id}`)}
              />
            </View>
          ))}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Hoc vien va yeu cau</Text>
          <Text style={demoStyles.cardText}>
            {students.length} hoc vien hien co.
          </Text>
          <Text style={demoStyles.cardText}>
            {requests.length} yeu cau cho duyet.
          </Text>
          {requests.map((request, index) => (
            <View
              key={request.id || request.user_id || index}
              style={demoStyles.resultRow}
            >
              <Text style={demoStyles.cardTitle}>
                {request.username ||
                  request.user_name ||
                  request.name ||
                  "Hoc vien cho duyet"}
              </Text>
              <Text style={demoStyles.cardText}>
                user_id: {request.user_id || request.id || "unknown"}
              </Text>
              <View style={demoStyles.row}>
                <AppButton
                  title="Duyet"
                  onPress={() => handleApprove(request, true)}
                />
                <AppButton
                  title="Tu choi"
                  onPress={() => handleApprove(request, false)}
                />
              </View>
            </View>
          ))}
          {students.slice(0, 5).map((student) => (
            <View
              key={student.id || student.phonenumber}
              style={demoStyles.resultRow}
            >
              <Text style={demoStyles.cardTitle}>{student.username}</Text>
              <Text style={demoStyles.cardText}>
                {student.role} - {student.phonenumber || "Chua co SDT"}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
