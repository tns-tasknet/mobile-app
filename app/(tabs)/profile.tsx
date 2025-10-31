import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Perfil de Usuario</Text>

        <View style={styles.perfilInfo}>
          {user.image && (
            <Image
              source={{ uri: user.image }}
              style={styles.profileImage}
            />
          )}
          <Text style={styles.profileName}>{user.name ?? "Sin nombre"}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.detailButton,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  perfilInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  detailButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
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
