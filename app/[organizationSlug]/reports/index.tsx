import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function OrganizationReport() {
  const { organizationSlug } = useLocalSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Marca que ya terminó la comprobación de sesión
  useEffect(() => {
    if (!isPending) setSessionChecked(true);
  }, [isPending]);

  useEffect(() => {
    if (!sessionChecked) return;

    // Si no hay sesión, redirige al login
    if (!session) {
      console.log("No hay sesión activa, redirigiendo al login...");
      router.replace("/login");
      return;
    }

    // Evita hacer fetch si ya hay reportes cargados
    if (reports.length > 0) return;

    const fetchReports = async () => {
      try {
        setLoading(true);

        console.log("Slug de organización:", organizationSlug);

        const res = await authClient.$fetch<any[]>(
          `${baseURL}/api/v1/${organizationSlug}/reports`,
          { method: "GET" }
        );

        const hasError = await handleApiError(res, {
          onConflictReload: fetchReports,
          isOnline,
        });

        if (hasError) return;

        console.log("Reportes:", res.data || []);
        setReports(res.data || []);
      } catch (err: any) {
        if (!isOnline) {
            Alert.alert(
              "Sin conexión",
              "No se pudo conectar al servidor. Se reintentará automáticamente cuando vuelva internet."
            );
            waitForConnection(fetchReports);
            return;
          }

        Alert.alert(
          "Error",
          err?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [session, organizationSlug, sessionChecked]);

  if (loading) return <Text style={styles.infoText}>Cargando reportes...</Text>;
  if (!session) return null; 

  const goToReportDetails = (reportId: any) => {
    router.replace(`${organizationSlug}/reports/${reportId}`);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {reports.length > 0 ? (
            reports.map((report) => {
              const name = report.name ?? "Sin nombre";
              const id = report.id ?? "Sin ID";
              const slugText = report.slug ?? "Sin slug";
              const createdAt = report.createdAt
                ? new Date(report.createdAt).toLocaleString()
                : "Sin fecha";
              const logo = report.logo ?? "No disponible";
              const metadata = report.metadata
                ? JSON.stringify(report.metadata)
                : "No disponible";

              return (
                <View key={id} style={styles.reportCard}>
                  <Text
                    style={[
                      styles.reportTitle,
                      name === "Sin nombre" && styles.missingName,
                    ]}
                  >
                    {name}
                  </Text>
                  <Text>ID: {id}</Text>
                  <Text>Creado: {createdAt}</Text>
                  <Button
                    title="Ver detalles"
                    onPress={() => goToReportDetails(id)}
                  />
                </View>
              );
            })
          ) : (
            <Text style={styles.infoText}>No hay reportes disponibles.</Text>
          )}
        </View>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#273F7D",
  },
  reportCard: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#FAF9F6",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "left",
    color: "#333",
  },
  missingName: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
  },
  infoText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3939ff",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
  },
});
