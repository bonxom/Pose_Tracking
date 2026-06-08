import AllRequestsView from "@/components/courses/views/AllRequestsView";
import AllStudentsView from "@/components/courses/views/AllStudentsView";
import CoursesFeedView from "@/components/courses/views/CoursesFeedView";
import MyCoursesView from "@/components/courses/views/MyCoursesView";
import RequestsView from "@/components/courses/views/RequestsView";
import { getCurrentSession } from "@/repositories/source";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function CoursesScreen() {
  // Session / role
  const [role, setRole] = useState(null); // null = not yet resolved
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // GV view state: 'requests' | 'allStudents' | 'allRequests'
  const [currentView, setCurrentView] = useState("requests");

  // GV cache state
  const [requestsCache, setRequestsCache] = useState(null);
  const [allRequestsCache, setAllRequestsCache] = useState(null);
  const [allStudentsCache, setAllStudentsCache] = useState(null);

  // HV cache state
  const [myCoursesCache, setMyCoursesCache] = useState(null);

  useFocusEffect(
    useCallback(() => {
      // Resolve role and reset GV caches whenever this tab is focused
      let cancelled = false;

      setIsLoadingSession(true);
      getCurrentSession()
        .then((session) => {
          if (!cancelled) {
            const userRole = String(session?.role || "").toUpperCase();
            setRole(userRole);
            if (userRole === "HV") {
              setCurrentView("feed");
            } else {
              setCurrentView("requests");
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRole(""); // treat as unknown – show GV view
            setCurrentView("requests");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingSession(false);
        });

      // Reset GV and HV view state and caches on every focus
      setRequestsCache(null);
      setAllRequestsCache(null);
      setAllStudentsCache(null);
      setMyCoursesCache(null);

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const goBack = useCallback(() => setCurrentView("requests"), []);
  const goToAllStudents = useCallback(() => setCurrentView("allStudents"), []);
  const goToAllRequests = useCallback(() => setCurrentView("allRequests"), []);

  const disableCache = useCallback(() => {
    setRequestsCache(null);
    setAllRequestsCache(null);
    setAllStudentsCache(null);
  }, []);

  // ── Loading session ────────────────────────────────────────────────────────
  if (isLoadingSession) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── HV: course feed ────────────────────────────────────────────────────────
  if (role === "HV") {
    if (currentView === "myCourses") {
      return (
        <MyCoursesView
          onBack={() => setCurrentView("feed")}
          cache={myCoursesCache}
          setCache={setMyCoursesCache}
        />
      );
    }
    return (
      <CoursesFeedView
        onGoToMyCourses={() => setCurrentView("myCourses")}
      />
    );
  }

  // ── GV: management views ───────────────────────────────────────────────────
  if (currentView === "allStudents") {
    return (
      <AllStudentsView
        onBack={goBack}
        cache={allStudentsCache}
        setCache={setAllStudentsCache}
        onActionSuccess={disableCache}
      />
    );
  }

  if (currentView === "allRequests") {
    return (
      <AllRequestsView
        onBack={goBack}
        cache={allRequestsCache}
        setCache={setAllRequestsCache}
        onActionSuccess={disableCache}
      />
    );
  }

  return (
    <RequestsView
      onGoToAllStudents={goToAllStudents}
      onGoToAllRequests={goToAllRequests}
      cache={requestsCache}
      setCache={setRequestsCache}
      onActionSuccess={disableCache}
    />
  );
}
