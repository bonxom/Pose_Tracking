import AllRequestsView from "@/components/courses/views/AllRequestsView";
import AllStudentsView from "@/components/courses/views/AllStudentsView";
import RequestsView from "@/components/courses/views/RequestsView";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export default function CoursesScreen() {
  // View state: 'requests' | 'allStudents' | 'allRequests'
  const [currentView, setCurrentView] = useState("requests");

  // Cache state
  const [requestsCache, setRequestsCache] = useState(null);
  const [allRequestsCache, setAllRequestsCache] = useState(null);
  const [allStudentsCache, setAllStudentsCache] = useState(null);

  useFocusEffect(
    useCallback(() => {
      // Clear all caches and reset view when focusing the tab from another page
      setCurrentView("requests");
      setRequestsCache(null);
      setAllRequestsCache(null);
      setAllStudentsCache(null);
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
