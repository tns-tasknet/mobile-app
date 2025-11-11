import { authClient } from "@/lib/auth-client";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

  useFocusEffect(
    useCallback(() => {
      if (!organizationSlug) return;

      let isActive = true;

      const fetchOrders = async () => {
        try {
          setLoading(true);
          const res = await authClient.$fetch<any>(
            `${baseURL}/api/v1/${organizationSlug}/orders`,
            { method: "GET" }
          );
          if (isActive) {
            setOrders(res?.data?.reports || []);
          }
        } catch (err) {
          console.error("Error cargando reportes:", err);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchOrders();

      // 🔹 Limpieza por si el componente se desmonta
      return () => {
        isActive = false;
      };
    }, [organizationSlug])
  );


  const handleLogout = async () => {
    await authClient.signOut();
  };

  const goToReportDetails = (orderId: any) => {
    router.push(`/orders/${orderId}`);
  };

  const groupOrdersByStatus = (orders: any[]) => {
    const groups: Record<string, any[]> = {};
    orders.forEach((order) => {
      const status = order.status ?? "Sin estado";
      if (!groups[status]) groups[status] = [];
      groups[status].push(order);
    });
    return groups;
  };

  const groupedOrders = groupOrdersByStatus(orders);

  const statusLabels: Record<string, string> = {
    pending: "Pendientes",
    in_progress: "En proceso",
    completed: "Completadas",
    cancelled: "Canceladas",
    "Sin estado": "Sin estado",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
\        <Text style={styles.saludo}>
          Hola, {session?.user?.name ?? "Usuario"} 👋
        </Text>

        <Text style={styles.sectionTitle}>Órdenes </Text>

        {loading ? (
          <Text style={styles.infoText}>Cargando reportes...</Text>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {Object.keys(groupedOrders).length > 0 ? (
              Object.entries(groupedOrders).map(([status, reports]) => (
                <View key={status} style={styles.statusGroup}>
                  <Text style={styles.statusTitle}>
                    {statusLabels[status] ?? status}
                  </Text>

                  {reports.map((report) => {
                    const name = report.name ?? "Sin nombre";
                    const id = report.id ?? "Sin ID";
                    const createdAt = report.createdAt
                      ? new Date(report.createdAt).toLocaleString()
                      : "Sin fecha";

                    return (
                      <View key={id} style={styles.reportCard}>
                        <View style={styles.cardHeader}>
                          <Text
                            style={[
                              styles.reportTitle,
                              name === "Sin nombre" && styles.missingName,
                            ]}
                          >
                            {name}
                          </Text>
                          <Text style={styles.dateText}>{createdAt}</Text>
                        </View>

                        <Text style={styles.reportId}>ID: {id}</Text>

                        <Pressable
                          onPress={() => goToReportDetails(id)}
                          style={({ pressed }) => [
                            styles.detailButton,
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <Text style={styles.detailButtonText}>Ver detalles</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ))
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
    backgroundColor: "#F3F5FA",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  saludo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#273F7D",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A4A4A",
    marginBottom: 20,
  },
  scroll: {
    flex: 1,
  },
  statusGroup: {
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3862CC",
    marginBottom: 10,
  },
  reportCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#273F7D",
  },
  missingName: {
    color: "#E74C3C",
  },
  reportId: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 13,
    color: "#999",
  },
  detailButton: {
    backgroundColor: "#3862CC",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  detailButtonText: {
    color: "#FAF9F6",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  infoText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 15,
    color: "#555",
  },
});
