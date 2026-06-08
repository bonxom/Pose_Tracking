import { getAuthSession, subscribeAuthSession } from "@/utils/session";
import { useEffect, useState } from "react";

/**
 * Custom hook tự động đồng bộ và lắng nghe sự thay đổi của session dưới nền (reactive session).
 * @returns {{ session: Object|null, loading: boolean }}
 */
export function useAuthSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Lấy session hiện tại
    getAuthSession()
      .then((current) => {
        if (active) {
          setSession(current);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("useAuthSession load error", err);
        if (active) {
          setLoading(false);
        }
      });

    // Lắng nghe sự kiện phát ra từ subscribeAuthSession (như khi queueProfileUpdate hoàn thành hoặc lỗi)
    const unsubscribe = subscribeAuthSession((updatedSession) => {
      if (active) {
        setSession(updatedSession);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { session, loading };
}
