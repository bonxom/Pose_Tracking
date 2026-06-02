import NetInfo from "@react-native-community/netinfo";
import { useCallback, useState } from "react";

/**
 * Imperatively checks the current network connectivity state.
 * Call this inside a catch block to determine if a fetch failure
 * was caused by no internet vs. a server error.
 *
 * @returns {Promise<boolean>} true if connected, false if no internet
 */
export async function checkIsConnected() {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

/**
 * Hook to manage internet connection state during data fetching.
 * Wrap your fetch calls in `executeWithInternetCheck` to automatically
 * set `isNoInternet` to true if the fetch fails due to network issues,
 * and false when it succeeds.
 */
export function useInternetFetch() {
  const [isNoInternet, setIsNoInternet] = useState(false);

  const executeWithInternetCheck = useCallback(async (fetchOperation) => {
    try {
      const result = await fetchOperation();
      setIsNoInternet(false);
      return result;
    } catch (error) {
      const connected = await checkIsConnected();
      if (!connected) {
        setIsNoInternet(true);
      }
      throw error;
    }
  }, []);

  return { isNoInternet, setIsNoInternet, executeWithInternetCheck };
}
