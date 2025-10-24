import { authClient } from "@/lib/auth-client";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function OrganizationReport() {
  const { reportId, organizationSlug } = useLocalSearchParams();
  const { data: session, isPending } = authClient.useSession();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState<
    "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
  >("PENDING");

  // === FETCH DEL REPORTE ===
  useEffect(() => {
    if (isPending) return;
    if (!session) return;
    if (report) return; // evita recargar

    const fetchReportDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await authClient.$fetch<any>(
          `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}`,
          { method: "GET" }
        );

        console.log("Respuesta del fetch:", res.data);
        const fetchedReport =
          res.data && Array.isArray(res.data) ? res.data[0] : res.data || null;

        setReport(fetchedReport);

        if (fetchedReport) {
          setResponseText(fetchedReport.response || "");
          setStatus(fetchedReport.status || "PENDING");
        }
      } catch (err: any) {
        console.error("Error al obtener el reporte:", err);
        setErrorMsg(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [isPending, session, reportId, organizationSlug]);

  // === ACTUALIZAR REPORTE ===
  const updateReport = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            response: responseText || "test",
            status: "COMPLETED",
          }),
        }
      );

      console.log("Reporte actualizado:", res);
      setReport(res.data || null);
    } catch (err: any) {
      console.error("Error al actualizar reporte:", err);
      setErrorMsg(err.message || "Error desconocido");
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

  if (errorMsg)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {errorMsg}</Text>
      </View>
    );

  // === UI PRINCIPAL ===
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={report ? undefined : styles.centered}>
          {report ? (
            <View style={styles.card}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text>ID: {report.id}</Text>
              <Text>Contenido: {report.content}</Text>
              <Text>Slug: {report.slugText}</Text>
              <Text>Logo: {report.logo}</Text>
              <Text>Metadata: {report.metadata}</Text>
              <Text>Status actual: {report.status}</Text>

            </View>
          ) : (
            <Text style={styles.infoText}>No hay detalles disponibles.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#FAF9F6",
    padding: 10,
    marginVertical: 10,
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
