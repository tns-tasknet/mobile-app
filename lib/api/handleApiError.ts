import { Alert } from "react-native";

export const handleApiError = async (
  res: any,
  options?: { onConflictReload?: () => void; isOnline?: boolean }
): Promise<boolean> => {
  const {onConflictReload, isOnline = true } = options || {};

  if (!isOnline){
    Alert.alert("Sin conexión", "No hay internet disponible. Intenta más tarde.");
    return true;
  }
  if (!res?.error || !res.error.status) return false;

  const { status, message } = res.error;
  const errorMessage = message || "Inténtalo más tarde.";

  switch (status) {
    case 400:
      Alert.alert("Error de validación", "Los datos enviados no son válidos.");
      break;
    case 401:
      Alert.alert("Sesión expirada", "Por favor, inicia sesión nuevamente.");
      break;
    case 403:
      Alert.alert("Error de actualización", "Este recurso posee a restricciones de estado o permisos. Por favor, recarga nuevamente.");
      break;
    case 404:
      Alert.alert("No encontrado", "El recurso no existe o fue eliminado.");
      break;
    case 409:
      Alert.alert(
        "Conflicto",
        "El recurso fue modificado por otro usuario. Por favor, recarga antes de editar."
      );
      options?.onConflictReload?.();
      break;
    case 500:
      Alert.alert("Error del servidor", "Ocurrió un error interno. Inténtalo más tarde.");
      break;
    default:
      Alert.alert("Error desconocido", `Error (${status}): ${errorMessage}`);
  }

  return true;
};
