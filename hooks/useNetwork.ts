import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef, useState } from "react";

export const useNetwork = (stabilizationDelay = 500) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStableValue = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const current = !!(state.isConnected && state.isInternetReachable);

      // Cancelar debounce anterior
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Esperar unos ms antes de confirmar el cambio
      timeoutRef.current = setTimeout(() => {
        if (lastStableValue.current !== current) {
          lastStableValue.current = current;
          setIsOnline(current);
        }
      }, stabilizationDelay);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [stabilizationDelay]);

  // Retornar false mientras aún no hay valor real
  return isOnline ?? false;
};
