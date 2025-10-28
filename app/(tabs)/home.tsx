import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Button, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function Home() {
    const { data: session, isPending } = authClient.useSession();
    const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session && !isPending) {
            router.replace("/login");
        }
    }, [session, isPending]);

    useEffect(() => {
        (async () => {
            const savedSlug = await SecureStore.getItemAsync("organizationSlug");
            if (!savedSlug) {
                router.replace("/setup");
                return;
            }
            setOrganizationSlug(savedSlug);
        })();
    }, []);

    useEffect(() => {
        if (!organizationSlug) return;

        (async () => {
            try {
                setLoading(true);

                const res = await authClient.$fetch<any[]>(
                    `${baseURL}/api/v1/${organizationSlug}/reports`,
                    { method: "GET" }
                );

                console.log("Reportes:", res.data || []);
                setReports(res.data || []);
            } catch (err) {
                console.error("Error cargando reportes:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [organizationSlug]);


    const handleLogout = async () => {
        await authClient.signOut()
    };

    const goToProfile = () => {
        router.push("/profile");
    };

    return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 🔹 Encabezado con botones */}
        <Text style={styles.saludo}>Hola, {session?.user?.name ?? "Usuario"} 👋</Text>
        <View style={styles.buttons}>
          <Pressable onPress={goToProfile} style={styles.button}>
            <Text style={styles.buttonText}>Perfil</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.button}>
            <Text style={styles.buttonText}>Cerrar Sesión</Text>
          </Pressable>
        </View>

        {/* 🔹 Lista de reportes */}
        <Text style={styles.sectionTitle}>Reportes disponibles:</Text>

        {loading ? (
          <Text style={styles.infoText}>Cargando reportes...</Text>
        ) : (
          <ScrollView style={styles.scroll}>
            {reports.length > 0 ? (
              reports.map((report) => {
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
                    <Button title="Ver detalles" onPress={() => goToReportDetails(id)} />
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
});