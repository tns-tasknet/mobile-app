import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";


// Este layout es el layout raiz de la aplicacion, es decir, el que engloba a todos los demas layouts y pantallas
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{ headerShown: false }}
      >
        {/* El stack screen aparentemente es para mostrar la pagina inicial apenas inicies la app  */}
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}
  

