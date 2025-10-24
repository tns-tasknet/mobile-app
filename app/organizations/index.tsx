import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function Index() {
  const { data: session, isPending } = authClient.useSession();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectToLogin = () => {
    console.log("No hay sesión activa, redirigiendo al login...");
    router.replace("/login"); // replace para no permitir volver atrás
  };

  useEffect(() => {
    if (isPending) return; // espera a que se cargue la sesión
    if (!session) {
      redirectToLogin();
      return;
    }

    // Evita hacer fetch si ya hay datos
    if (organizations.length > 0) return;

    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await authClient.$fetch<any[]>(`${baseURL}/api/v1/organizations`, {
          method: "GET",
        });

        if (res.error) throw new Error(res.error.message || "Error desconocido");

        const fetchedOrgs = Array.isArray(res.data) ? res.data : [];
        console.log("Organizaciones:", fetchedOrgs);
        setOrganizations(fetchedOrgs);
      } catch (err: any) {
        console.error("Error al obtener organizaciones:", err);
        setErrorMsg(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [session, isPending, organizations.length]);

  if (loading) return <Text style={styles.infoText}>Cargando organizaciones...</Text>;
  if (errorMsg) return <Text style={styles.errorText}>Error: {errorMsg}</Text>;
  if (!session) return null; // protege render mientras se redirige

  const goToReport = (slug: string) => {
    router.push(`${slug}/reports/`);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          {organizations.length === 0 && (
            <Text style={styles.infoText}>No hay organizaciones disponibles.</Text>
          )}

          {organizations.map((org) => {
            const name = org.name ?? "Sin nombre";
            const slug = org.slug ?? "Sin slug";
            const createdAt = org.createdAt
              ? new Date(org.createdAt).toLocaleString()
              : "Sin fecha";

            return (
              <View key={org.id} style={styles.card}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.cardText}>Slug: {slug}</Text>
                <Text style={styles.cardText}>Creado: {createdAt}</Text>
                <Button title="Buscar Reporte" onPress={() => goToReport(slug)} />
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#273F7D", 
  },
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#FAF9F6", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  cardText: {
    fontSize: 15,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#FAF9F6", 
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
