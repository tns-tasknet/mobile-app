import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const baseURL = process.env.EXPO_PUBLIC_API_URL;
const organizationSlug = process.env.EXPO_PUBLIC_ORG;

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session && !isPending) {
      router.replace("/login");
    }
  }, [session, isPending]);

  useEffect(() => {
    if (!organizationSlug) return;

    (async () => {
      try {
        setLoading(true);

        const res = await authClient.$fetch<any>(
          `${baseURL}/api/v1/${organizationSlug}/orders`,
          { method: "GET" }
        );

        console.log("Orders:", res?.data?.reports || []);
        
        setOrders(res?.data?.reports || []);
      } catch (err) {
        console.error("Error cargando reportes:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationSlug]);

  const handleLogout = async () => {
    await authClient.signOut();
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  const goToReportDetails = (orderId: any) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 🔹 Encabezado con botones */}
        <Text style={styles.saludo}>
          Hola, {session?.user?.name ?? "Usuario"} 👋
        </Text>

        {/* 🔹 Lista de reportes */}
        <Text style={styles.sectionTitle}>Reportes disponibles:</Text>

        {loading ? (
          <Text style={styles.infoText}>Cargando reportes...</Text>
        ) : (
          <ScrollView style={styles.scroll}>
            {orders.length > 0 ? (
              orders.map((report) => {
                const name = report.name ?? "Sin nombre";
                const id = report.id ?? "Sin ID";
                const createdAt = report.createdAt
                  ? new Date(report.createdAt).toLocaleString()
                  : "Sin fecha";

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

                    <Pressable
                      onPress={() => goToReportDetails(id)}
                      style={({ pressed }) => [
                        styles.detailButton,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={styles.detailButtonText}>VER DETALLES</Text>
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>No hay reportes disponibles.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  saludo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  scroll: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  missingName: {
    color: "red",
  },
  infoText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
  detailButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
  },
  detailButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
