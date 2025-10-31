import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const baseURL = process.env.EXPO_PUBLIC_API_URL!;
const organizationSlug = process.env.EXPO_PUBLIC_ORG!;

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: session, isPending } = authClient.useSession();
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState<"PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED">("PENDING");

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [session, isPending]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${orderId}`,
        { method: "GET" }
      );

      const hasError = await handleApiError(res, {
        onConflictReload: fetchOrderDetails,
        isOnline,
      });
      if (hasError) return;

      const fetched = Array.isArray(res.data) ? res.data[0] : res.data || null;
      if (!fetched) return;

      setOrder(fetched);
      setResponseText(fetched.response || "");
      setStatus(fetched.status || "PENDING");
    } catch (err: any) {
      if (!isOnline) {
        Alert.alert("Sin conexión", "Se reintentará al reconectarse.");
        waitForConnection(fetchOrderDetails);
        return;
      }
      Alert.alert("Error", err?.message || "Error desconocido");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, orderId, waitForConnection]);

  useEffect(() => {
    if (!isPending && session && !order && orderId) fetchOrderDetails();
  }, [isPending, session, orderId, order, fetchOrderDetails]);

  // --- Actualizar reporte ---
  const updateOrder = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${orderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: responseText, status }),
        }
      );

      const hasError = await handleApiError(res, {
        onConflictReload: fetchOrderDetails,
        isOnline,
      });
      if (!hasError) setOrder(res.data || null);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Error desconocido");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Cargando detalles...</Text>
      </View>
    );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {order ? (
            <View style={styles.card}>
              <Text style={styles.title}>{order.title}</Text>
              <Text>ID: {order.id}</Text>
              <Text>Contenido: {order.content}</Text>
              <Text>Slug: {order.slugText}</Text>
              <Text>Logo: {order.logo}</Text>
              <Text>Metadata: {order.metadata}</Text>
              <Text>Response: {order.response}</Text>
              <Text>State: {order.status}</Text>

              {/* === CAMPOS EDITABLES === */}
              <Text style={styles.sectionTitle}>Editar respuesta:</Text>
              <TextInput
                style={styles.input}
                placeholder="Escribe una respuesta..."
                value={responseText}
                onChangeText={setResponseText}
                multiline
              />

              <Text style={styles.sectionTitle}>Cambiar estado:</Text>
              <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
                {["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].map((st) => (
                  <Picker.Item key={st} label={st} value={st} />
                ))}
              </Picker>

              <Button title="Actualizar Reporte" onPress={updateOrder} disabled={loading} />
            </View>
          ) : (
            <Text style={styles.infoText}>No hay detalles disponibles.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#273F7D",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 4,
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 16,
  },
  infoText: {
    textAlign: "center",
    color: "#FAF9F6",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
