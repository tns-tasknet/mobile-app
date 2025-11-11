import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Profile() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session]);

  if (isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  if (!session) return null;

  const user = session.user;

  const handleSignOut = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí", onPress: () => authClient.signOut() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Ajuste para barra de estado en Android */}
      <View style={styles.statusPadding} />

      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Perfil de Usuario</Text>

          <View style={styles.perfilInfo}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            )}

            <Text style={styles.profileName}>{user?.name ?? "Sin nombre"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? "Sin correo"}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 🔹 Safe area para notch o cámara
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F5FA",
  },

  // 🔹 Ajuste para Android
  statusPadding: {
    height: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // 🔹 Pantalla de carga
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F5FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#555",
  },

  // 🔹 Contenedor general
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
  },

  // 🔹 Título
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#273F7D",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 20,
  },

  // 🔹 Info de perfil
  perfilInfo: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: "#3862CC",
  },
  placeholderImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DDE3F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  placeholderText: {
    fontSize: 40,
    color: "#3862CC",
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#273F7D",
    textAlign: "center",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },

  // 🔹 Botón cerrar sesión
  logoutButton: {
    backgroundColor: "#E74C3C",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

// Contenido del JSON de referencia:
// {
//   "name": "",
//   "email": "",
//   "emailVerified": "",
//   "image": "",
//   "createdAt": "",
//   "updatedAT": "",
//   "role": "",
//   "banned": "",
//   "banReason": "",
//   "banExpires": "",
//   "id": ""
// }
