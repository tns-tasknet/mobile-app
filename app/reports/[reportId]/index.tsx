import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import { savePendingOrder, syncPendingOrders } from "@/lib/offline-orders";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import SignatureCanvas, { SignatureViewRef } from "react-native-signature-canvas";

const baseURL = process.env.EXPO_PUBLIC_API_URL!;
const organizationSlug = process.env.EXPO_PUBLIC_ORG!;

export default function ReportDetail() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { data: session, isPending } = authClient.useSession();
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState<
    "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
  >("PENDING");
  const [firma, setFirma] = useState<string | null>(null);
  const signatureRef = useRef<SignatureViewRef>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [orderPending, setOrderPending] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [statusHistory, setStatusHistory] = useState<
    { status: string; timestamp: string; user?: string }[]
  >([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // 🔹 Cargar historial guardado al abrir la orden
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(`orderHistory_${reportId}`);
        if (saved) setOrderHistory(JSON.parse(saved));
      } catch (err) {
        console.warn("Error al cargar historial:", err);
      }
    };
    if (reportId) loadHistory();
  }, [reportId]);

  // 🔹 Guardar historial en memoria persistente
  const saveHistory = async (history: any[]) => {
    try {
      await AsyncStorage.setItem(`orderHistory_${reportId}`, JSON.stringify(history));
    } catch (err) {
      console.warn("Error al guardar historial:", err);
    }
  };

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [session, isPending]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Permiso de ubicación denegado");
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({});
        setMetadata({
          name: session?.user?.name,
          timestamp: new Date().toISOString(),
          gps: {
            lat: coords.latitude,
            lon: coords.longitude,
          },
          deviceId: Device.modelName,
        });
      } catch (err) {
        console.warn("No se pudo obtener metadata:", err);
      }
    };

    fetchMetadata();
  }, [session]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      if (!isOnline) {
        Alert.alert("Sin conexión", "Se reintentará al reconectarse.");
        return;
      }

      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}`,
        { method: "GET" }
      );

      const hasError = await handleApiError(res, {
        onConflictReload: fetchOrderDetails,
        isOnline,
      });
      if (hasError) return;

      const fetched = Array.isArray(res.data) ? res.data[0] : res.data || null;
      if (!fetched) return;

      setOrder(res.data.report);
      setResponseText(fetched.response || "");
      setStatus(fetched.status || "PENDING");
      console.log("OrderDetails: ", res.data.report);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Error desconocido");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, reportId, waitForConnection]);

  useEffect(() => {
    if (!isPending && session && !order && reportId && isOnline !== null) {
      fetchOrderDetails();
    }
  }, [isPending, session, reportId, order, fetchOrderDetails, isOnline]);

  const resetSignature = () => {
    signatureRef.current?.clearSignature();
    setFirma(null);
  };

  // --- Guardar firma ---
  const handleSignature = (sig: string) => {
    setFirma(sig);
  };

  // --- Tomar foto directamente ---
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para tomar fotos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // --- Cuando vuelve el internet, intenta sincronizar las órdenes pendientes ---
  useEffect(() => {
    const handleReconnect = async () => {
      if (isOnline && orderPending) {
        try {
          await syncPendingOrders(baseURL, organizationSlug, authClient, isOnline);
          await fetchOrderDetails();
          setOrderPending(false);
        } catch (err) {
          console.error("❌ Error al sincronizar órdenes:", err);
        }
      }
    };

    handleReconnect();
  }, [isOnline, orderPending]);

   // --- Actualizar orden ---
  const updateOrder = async () => {
    if (!session) return;
    Alert.alert(
      "Confirmar guardado",
      "¿Estás seguro de que deseas guardar esta orden?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);

              const bodyData: any = {
                response: responseText,
                status,
                metadata,
                firma,
                photo,
              };

              if (!isOnline) {
                setOrderPending(true);
                await savePendingOrder(reportId, bodyData);
                Alert.alert(
                  "Sin conexión",
                  "Cambios guardados localmente. Se sincronizarán al reconectarse."
                );
                return;
              }

              // Enviar PATCH
              const res = await authClient.$fetch<any>(
                `${baseURL}/api/v1/${organizationSlug}/orders/${reportId}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(bodyData),
                }
              );

              const hasError = await handleApiError(res, {
                onConflictReload: fetchOrderDetails,
                isOnline,
              });

              if (!hasError) {
                setOrder(res.data.report || null);

                // ✅ Guardar en historial solo al confirmar
                const newEntry = {
                  status,
                  timestamp: new Date().toISOString(),
                  user: session?.user?.name || "Usuario",
                };

                const updatedHistory = [...orderHistory, newEntry];
                setOrderHistory(updatedHistory);
                await saveHistory(updatedHistory);
              }
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Error desconocido");
              console.error(err);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ Solo cambia el estado visualmente, no el historial
  const handleStatusChange = (newStatus: any) => {
    setStatus(newStatus);
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isSigning}
        >
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

              {order.status !== "COMPLETED" ? (
                <>
                  <Text style={styles.sectionTitle}>Editar respuesta:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Escribe una respuesta..."
                    value={responseText}
                    onChangeText={setResponseText}
                    multiline
                  />
                  <Text style={styles.sectionTitle}>Cambiar estado:</Text>
                  <Picker
                    selectedValue={status}
                    onValueChange={handleStatusChange}
                    style={styles.picker}
                  >
                    {["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].map((st) => (
                      <Picker.Item key={st} label={st} value={st} />
                    ))}
                  </Picker>

                   {/* 🔹 Historial de cambios */}
              {orderHistory.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Historial de estados:</Text>
                  {orderHistory.map((entry, i) => (
                    <Text key={i}>
                      • {entry.status} — {new Date(entry.timestamp).toLocaleString()} ({entry.user})
                    </Text>
                  ))}
                </View>
              )}

                  {status === "COMPLETED" && (
                    <>
                      <Text style={styles.sectionTitle}>Firma digital:</Text>
                      <View style={styles.signatureBox}>
                        <SignatureCanvas
                          ref={signatureRef}
                          onOK={handleSignature}
                          onBegin={() => setIsSigning(true)}
                          onEnd={() => setIsSigning(false)}
                          descriptionText="Firma aquí"
                          clearText="Borrar"
                          confirmText="Guardar"
                          webStyle={signatureWebStyle}
                        />
                      </View>
                      <Button title="Reiniciar Firma" onPress={resetSignature} />
                      <View style={styles.separatorSmall} />
                      <Button title="Tomar Foto" onPress={takePhoto} />
                      {photo && (
                        <Image source={{ uri: photo }} style={styles.previewImage} />
                      )}
                    </>
                  )}

                  <View style={styles.separator} />
                  <Button
                    title="Actualizar Reporte"
                    onPress={updateOrder}
                    disabled={loading}
                  />
                </>
              ) : (
                <Text style={styles.sectionTitle}>
                  ✅ Esta orden está completada y no puede modificarse.
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoText}>No hay detalles disponibles.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const signatureWebStyle = `
  .m-signature-pad--footer { display: none; margin: 0px; }
`;

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
  signatureBox: {
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
  separator: {
    height: 20,
  },
  separatorSmall: {
    height: 10,
  },
  timelineContainer: {
    marginTop: 20,
    borderLeftWidth: 2,
    borderLeftColor: "#3862CC",
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3862CC",
    marginRight: 10,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontWeight: "700",
    color: "#273F7D",
  },
  timelineTimestamp: {
    fontSize: 12,
    color: "#777",
  },
  timelineUser: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
