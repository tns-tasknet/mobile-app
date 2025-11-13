import { authClient } from "@/lib/auth-client";
import { Report } from "@/types/report";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const baseURL = process.env.EXPO_PUBLIC_API_URL!;
const organizationSlug = process.env.EXPO_PUBLIC_ORG!;

export default function ReportDetail() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { data: session, isPending } = authClient.useSession();
  const [report, setReport] = useState<Report | null >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [session, isPending]);

  // 🔹 Cargar detalles del reporte completado
  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        setLoading(true);
        const res = await authClient.$fetch<any>(
          `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}`,
          { method: "GET" }
        );
        const fetched = Array.isArray(res.data) ? res.data[0] : res.data || null;
        if (!fetched) return;
        console.log('Report details : ', res.data.report.assignee);
        setReport(fetched.report);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
      } finally {
        setLoading(false);
      }
    };
    if (reportId) fetchReportDetails();
  }, [reportId]);

  if (loading)
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Cargando detalles...</Text>
      </View>
    );

  if (!report)
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>No hay detalles disponibles.</Text>
      </View>
    );

  return (
  <SafeAreaProvider>
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>{report.title}</Text>

          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{report.id}</Text>

          <Text style={styles.label}>Contenido:</Text>
          <Text style={styles.value}>{report.content || "—"}</Text>

          <Text style={styles.label}>Responsable:</Text>
          <Text style={styles.value}>{report.assignee?.user?.name || "—"}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{report.assignee?.user?.email || "—"}</Text>

          <Text style={styles.label}>Estado:</Text>
          <Text style={[styles.value, styles.completed]}>{report.status}</Text>

          {/* 🔹 Soporte para múltiples firmas */}
          {report.signature && (
            <>
              <Text style={styles.sectionTitle}>Firmas digitales:</Text>
              {Array.isArray(report.signature)
                ? report.signature.map((sig, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: `data:image/png;base64,${sig}` }}
                      style={styles.previewImage}
                    />
                  ))
                : (
                    <Image
                      source={{ uri: `data:image/png;base64,${report.signature}` }}
                      style={styles.previewImage}
                    />
                  )}
            </>
          )}

          {/* 🔹 Soporte para múltiples evidencias */}
          {report.evidence && (
            <>
              <Text style={styles.sectionTitle}>Evidencias fotográficas:</Text>
              {Array.isArray(report.evidence)
                ? report.evidence.map((img, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: img.startsWith("data:image") ? img : `data:image/png;base64,${img}` }}
                      style={styles.previewImage}
                    />
                  ))
                : (
                    <Image
                      source={{ uri: `data:image/png;base64,${report.evidence}` }}
                      style={styles.previewImage}
                    />
                  )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  </SafeAreaProvider>
);
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F3F8",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#273F7D" },
  label: { fontWeight: "700", marginTop: 12, color: "#3862CC" },
  value: { fontSize: 16, marginTop: 4, color: "#333" },
  completed: { color: "#28A745" },
  infoText: { textAlign: "center", color: "#555" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontWeight: "700", marginTop: 16, fontSize: 16, color: "#3862CC" },
  previewImage: { width: "100%", height: 200, marginTop: 10, borderRadius: 12 },
});

