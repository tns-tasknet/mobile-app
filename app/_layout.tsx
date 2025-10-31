import { useNetwork } from "@/hooks/useNetwork";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const isOnline = useNetwork();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* 🔹 Banner global de conexión */}
        {!isOnline && (
          <View style={{ backgroundColor: "red", padding: 8 }}>
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Sin conexión a Internet
            </Text>
          </View>
        )}

        {/* 🔹 Navegación principal */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
