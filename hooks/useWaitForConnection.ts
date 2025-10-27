import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef, useState } from "react";

export const useWaitForConnection = () => {
  const [queued, setQueued] = useState(false);
  const callbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (queued && state.isConnected && state.isInternetReachable) {
        if (callbackRef.current) {
          callbackRef.current(); // ejecutar acción pendiente
          callbackRef.current = null;
        }
        setQueued(false);
      }
    });

    return () => unsubscribe();
  }, [queued]);

  // Ahora se puede pasar el callback al momento de marcar que queremos reintentar
  const waitForConnection = (callback: () => void) => {
    callbackRef.current = callback;
    setQueued(true);
  };

  return waitForConnection;
};
