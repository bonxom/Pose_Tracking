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
      const loadExercises = async () => {
        try {
          const currentCourse = await getCurrentCourse();
          const posts = await getCourseExercises();
          const studentItems = await getCourseStudents(currentCourse.id);
          const requestItems = await getRequestedEnrollments(currentCourse.id).catch(() => []);
          setCourse(currentCourse);
          setEnrollmentStatus(currentCourse.enrollmentStatus || (currentCourse.enrolled ? "enrolled" : currentCourse.requested ? "requested" : "none"));
          setExercisePosts(posts);
          setStudents(studentItems);
          setRequests(requestItems);
        } catch (error) {
          if (await redirectIfSessionExpired(error, router)) return;
          setStatusText(error.message || "Không thể tải dữ liệu khóa học.");
        }
      };
      loadExercises();
    }, []),
  );

  const handleRequestCourse = async () => {
    try {
      const result = await requestCourse(course.id);
      setEnrollmentStatus(result.enrollmentStatus || "requested");
      setStatusText("Đã gửi yêu cầu tham gia. Vui lòng chờ GV duyệt.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể gửi yêu cầu tham gia khóa học.");
    }
  };

  const isEnrolled = enrollmentStatus === "enrolled";
  const isRequested = enrollmentStatus === "requested";

  const handleApprove = async (request, isAccepted) => {
    try {
      await approveEnrollment(request.user_id || request.id, isAccepted);
      setRequests((current) => current.filter((item) => item !== request));
      setStatusText(isAccepted ? "Đã duyệt yêu cầu." : "Đã từ chối yêu cầu.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể xử lý yêu cầu.");
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
              {isEnrolled ? "Đã tham gia" : isRequested ? "Đang chờ duyệt" : "Chưa tham gia"}
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
              <Text style={demoStyles.statValue}>{course.exerciseCount ?? DEMO_EXERCISES.length}</Text>
              <Text style={demoStyles.statLabel}>bài tập</Text>
            </View>
            <View style={demoStyles.statBox}>
              <Text style={demoStyles.statValue}>{course.latestExerciseId ? "Có" : "-"}</Text>
              <Text style={demoStyles.statLabel}>bài mới</Text>
            </View>
          </View>
          <AppButton
            title={isEnrolled ? "Đang học" : isRequested ? "Đã gửi yêu cầu" : "Xin tham gia"}
            onPress={handleRequestCourse}
            disabled={isEnrolled || isRequested || !course.id}
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
          {requests.map((request, index) => (
            <View key={request.id || request.user_id || index} style={demoStyles.resultRow}>
              <Text style={demoStyles.cardTitle}>
                {request.username || request.user_name || request.name || "Học viên chờ duyệt"}
              </Text>
              <Text style={demoStyles.cardText}>user_id: {request.user_id || request.id || "unknown"}</Text>
              <View style={demoStyles.row}>
                <AppButton title="Duyệt" onPress={() => handleApprove(request, true)} />
                <AppButton title="Từ chối" onPress={() => handleApprove(request, false)} />
              </View>
            </View>
          ))}
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
