import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

export default function Profile() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session]);

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  if (!session) return null;

  const user = session.user;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        Perfil de Usuario
      </Text>

      <Text>{JSON.stringify(user, null, 2)}</Text>

      <View style={{ marginTop: 20 }}>
        <Button title="Cerrar sesión" onPress={() => authClient.signOut()} />
      </View>
    </View>
  );
}
