// app/setup.tsx
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function SetupScreen() {
  const [organizationSlug, setOrganizationSlug] = useState("");

  const handleSave = async () => {
    if (!organizationSlug.trim()) return;
    await SecureStore.setItemAsync("organizationSlug", organizationSlug.trim());
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10, textAlign: "center" }}>
        Ingrese el código de la organización
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 10,
          marginBottom: 15,
        }}
        placeholder="Ej: empresa1"
        value={organizationSlug}
        onChangeText={setOrganizationSlug}
      />
      <Button title="Guardar y continuar" onPress={handleSave} />
    </View>
  );
}
