import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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


const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function OrganizationReport() {
  const { reportId, organizationSlug } = useLocalSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState<
    "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
  >("PENDING");

  const fetchReportDetails = async () => {
    try {
      setLoading(true);

      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}`,
        { method: "GET" }
      );

      console.log("Respuesta del fetch:", res.data);
      const fetchedReport =
        res.data && Array.isArray(res.data) ? res.data[0] : res.data || null;

      const hasError = await handleApiError(res, {
        onConflictReload: fetchReportDetails,
        isOnline,
      });

      if (hasError) return;
      
      setReport(fetchedReport);

      if (fetchedReport) {
        setResponseText(fetchedReport.response || "");
        setStatus(fetchedReport.status || "PENDING");
      }
    } catch (err: any) {
      if (!isOnline) {
            Alert.alert(
              "Sin conexión",
              "No se pudo conectar al servidor. Se reintentará automáticamente cuando vuelva internet."
            );
            waitForConnection(fetchReportDetails);
          return;
        }
        
      console.error("Error al obtener el reporte:", err);
      Alert.alert(
        "Error",
        err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // === FETCH DEL REPORTE ===
  useEffect(() => {
    if (isPending) return;
    if (!session) return;
    if (report) return;

    fetchReportDetails();
  }, [isPending, session, reportId, organizationSlug]);



  // === ACTUALIZAR REPORTE ===
  const updateReport = async () => {
    if (!session) return;

    try {
      setLoading(true);

      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            response: responseText,
            status,
          }),
        }
      );
      

      const hasError = await handleApiError(res, {
        onConflictReload: fetchReportDetails,
        isOnline,
      });
      if (hasError) return;
      console.log("Reporte actualizado:", res);

      setReport(res.data || null);
    } catch (err: any) {
      console.error("Error al actualizar reporte:", err);
      Alert.alert(
        "Error",
        err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // === ESTADOS DE CARGA / ERROR ===
  if (loading)
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Cargando detalles...</Text>
      </View>
    );

  // === UI PRINCIPAL ===
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={report ? undefined : { flex: 1, justifyContent: "center", alignItems: "center" }}>
          {report ? (
            <View style={{ padding: 16, backgroundColor: "#fff", margin: 16, borderRadius: 8, elevation: 3 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>{report.title}</Text>
              <Text>ID: {report.id}</Text>
              <Text>Contenido: {report.content}</Text>
              <Text>Slug: {report.slugText}</Text>
              <Text>Logo: {report.logo}</Text>
              <Text>Metadata: {report.metadata}</Text>
              <Text>Response: {report.response}</Text>
              <Text>State: {report.status}</Text>

              {/* === CAMPOS EDITABLES === */}
              <Text style={{ marginTop: 16, fontWeight: "bold" }}>Editar respuesta:</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, marginVertical: 8, borderRadius: 4 }}
                placeholder="Escribe una respuesta..."
                value={responseText}
                onChangeText={setResponseText}
                multiline
              />

              <Text style={{ fontWeight: "bold" }}>Cambiar estado:</Text>
              <Picker
                selectedValue={status}
                onValueChange={(itemValue) => setStatus(itemValue)}
                style={{ marginVertical: 8 }}
              >
                <Picker.Item label="PENDING" value="PENDING" />
                <Picker.Item label="SCHEDULED" value="SCHEDULED" />
                <Picker.Item label="IN_PROGRESS" value="IN_PROGRESS" />
                <Picker.Item label="COMPLETED" value="COMPLETED" />
              </Picker>

              <Button title="Actualizar Reporte" onPress={updateReport} disabled={loading} />
            </View>
          ) : (
            <Text style={{ textAlign: "center", marginTop: 50 }}>No hay detalles disponibles.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// === ESTILOS ===
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#273F7D",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  card: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#FAF9F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 15,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  infoText: {
    fontSize: 16,
    color: "#FAF9F6",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ff3939",
    textAlign: "center",
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
