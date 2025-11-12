import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import {
  savePendingRectification,
  syncPendingRectification,
} from "@/lib/offline-rectifications";
import { Rectification } from "@/types/rectification";
import { router, useGlobalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const baseURL = process.env.EXPO_PUBLIC_API_URL!;
const organizationSlug = process.env.EXPO_PUBLIC_ORG!;

export default function RectificationsScreen() {
  const [rectifications, setRectifications] = useState<Rectification[] | null>(null);
  const { reportId } = useGlobalSearchParams<{ reportId: string }>();
  const [newRectification, setNewRectification] = useState("");
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [rectificationPending, setRectificationPending] = useState(false);
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();

  // 🔸 Redirige si no hay sesión
  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [session, isPending]);

  const user = session?.user as any;

  // 🔹 Obtener rectificaciones desde el backend
  const fetchRectification = useCallback(async () => {
    if (!reportId) return;
    try {
      if (!isOnline) {
        Alert.alert("Sin conexión", "Se reintentará al reconectarse.");
        return;
      }

      setLoading(true);

      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}/corrections`,
        { method: "GET" }
      );

      const hasError = await handleApiError(res, {
        onConflictReload: fetchRectification,
        isOnline,
      });
      if (hasError) return;

      setRectifications(res.data?.corrections ?? []);
      console.log("✅ Rectifications:", res.data?.corrections);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Error desconocido");
      console.error("Rectification fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, reportId]);

  // 🔹 Cargar al montar
  useEffect(() => {
    if (!isPending && session && reportId && rectifications === null && isOnline !== null) {
      fetchRectification();
    }
  }, [isPending, session, reportId, rectifications, fetchRectification, isOnline]);

  // 🔹 Sincronizar pendientes al reconectarse
  useEffect(() => {
    const handleReconnect = async () => {
      if (isOnline && rectificationPending) {
        try {
          await syncPendingRectification(baseURL, organizationSlug, authClient, isOnline);
          await fetchRectification();
          setRectificationPending(false);
        } catch (err) {
          console.error("❌ Error al sincronizar rectificaciones:", err);
        }
      }
    };
    handleReconnect();
  }, [isOnline, rectificationPending]);

  // 🔹 Crear una nueva rectificación
  const addRectification = async () => {
    if (!session) return;

    Alert.alert("Confirmar guardado", "¿Deseas guardar esta rectificación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Guardar",
        style: "default",
        onPress: async () => {
          try {
            setLoading(true);

            const bodyData: Rectification = {
              memberId: user?.id || "unknown",
              reportId: reportId!,
              createdAt: new Date(),
              content: newRectification.trim(),
              author: {
                name: user.name,
                role: user.role,
              },
            };

            // 📡 Offline
            if (!isOnline) {
              setRectificationPending(true);
              await savePendingRectification(reportId!, bodyData);
              setNewRectification("");
              Alert.alert(
                "Sin conexión",
                "Guardado localmente. Se sincronizará al reconectarse."
              );
              return;
            }

            // 📡 Online
            const res = await authClient.$fetch<any>(
              `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}/corrections`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
              }
            );

            const hasError = await handleApiError(res, {
              onConflictReload: fetchRectification,
              isOnline,
            });
            if (hasError) return;
            await fetchRectification();

            setNewRectification("");
          } catch (err: any) {
            Alert.alert("Error", err?.message || "Error desconocido");
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Rectificaciones {reportId ? `(ID: ${reportId})` : ""}
          </Text>

          {loading ? (
            <Text style={styles.emptyText}>Cargando...</Text>
          ) : rectifications === null ? (
            <Text style={styles.emptyText}>Cargando datos...</Text>
          ) : rectifications.length === 0 ? (
            <Text style={styles.emptyText}>No hay rectificaciones disponibles.</Text>
          ) : (
            <View style={styles.timelineContainer}>
              {rectifications.map((rect, index) => (
                <View key={rect.id ?? index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineAuthor}>
                      {rect.author?.name} - {rect.author?.role}
                    </Text>
                    <Text style={styles.timelineContentText}>{rect.content}</Text>
                    <Text style={styles.timelineTimestamp}>
                      {new Date(rect.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* 🔹 Nueva rectificación */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe una nueva rectificación..."
            placeholderTextColor="#999"
            value={newRectification}
            onChangeText={setNewRectification}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newRectification.trim() && { backgroundColor: "#AAA" },
            ]}
            onPress={addRectification}
            disabled={!newRectification.trim()}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F5FA" },
  container: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 22, fontWeight: "700", color: "#273F7D", marginBottom: 16 },
  emptyText: { textAlign: "center", color: "#555", marginTop: 50 },
  timelineContainer: { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "#3862CC" },
  timelineItem: { flexDirection: "row", marginBottom: 16 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3862CC",
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: { flex: 1 },
  timelineAuthor: { fontWeight: "700", color: "#273F7D", marginBottom: 4 },
  timelineContentText: { fontSize: 15, color: "#555", marginBottom: 4 },
  timelineTimestamp: { fontSize: 12, color: "#999", fontStyle: "italic" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    backgroundColor: "#F7F9FD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#3862CC",
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FAF9F6",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 14,
  },
});
