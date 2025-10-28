import { useNetwork } from "@/hooks/useNetwork";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Este layout es el layout raíz de la aplicación
export default function RootLayout() {
  const isOnline = useNetwork();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Banner global de conexión */}
      {!isOnline && (
        <View style={{ backgroundColor: "red", padding: 8 }}>
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Sin conexión a Internet
          </Text>
        </View>
      )}

      <Stack
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla inicial */}
        <Stack.Screen name="setup" />
        <Stack.Screen name="login" />
      </Stack>
    </GestureHandlerRootView>
  );
}
