import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import SignatureScreen from "react-native-signature-canvas";

const baseURL = process.env.EXPO_PUBLIC_API_URL!;
const organizationSlug = process.env.EXPO_PUBLIC_ORG!;

export default function Report() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: session, isPending } = authClient.useSession();
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();

  const [checklist, setChecklist] = useState({
    motor: false,
    sistemaElectrico: false,
    ventilacion: false,
  });
  const [descripcion, setDescripcion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const signatureRef = useRef<any>(null);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [session, isPending]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});
        const info = {
          nombre: session?.user?.name ?? "Usuario desconocido",
          timestamp: new Date().toISOString(),
          gps: {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          },
          deviceId: Device.modelName,
        };
        setMetadata(info);
      } catch (err) {
        console.warn("Error obteniendo metadata:", err);
      }
    })();
  }, [session]);

  const handleSignature = (sig: string) => {
    setSignature(sig);
    Alert.alert("Firma capturada", "Tu firma ha sido registrada correctamente.");
  };

  const saveDraft = async () => {
    try {
      const draft = {
        checklist,
        descripcion,
        observaciones,
        signature,
        metadata,
        orderId,
      };
      await AsyncStorage.setItem(`draft_${orderId}`, JSON.stringify(draft));
      Alert.alert("Borrador guardado", "Se subirá automáticamente al reconectarse.");
    } catch (err) {
      console.error("Error guardando borrador:", err);
    }
  };


  useEffect(() => {
    if (isOnline) syncDrafts();
  }, [isOnline]);

  const syncDrafts = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const drafts = keys.filter((k) => k.startsWith("draft_"));
    if (drafts.length === 0) return;

    for (const key of drafts) {
      const data = await AsyncStorage.getItem(key);
      if (!data) continue;

      const draft = JSON.parse(data);
      await uploadReport(draft);
      await AsyncStorage.removeItem(key);
    }
  };

  
  const uploadReport = async (reportData?: any) => {
    const payload = reportData ?? {
      checklist,
      descripcion,
      observaciones,
      signature,
      metadata,
    };

    try {
      setLoading(true);
      const res = await authClient.$fetch(
        `${baseURL}/api/v1/${organizationSlug}/reports/${orderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const hasError = await handleApiError(res, {
              onConflictReload: uploadReport,
              isOnline,
            });
    if (!hasError) console.log(res.data || null);
    } catch (err) {
      console.error("Error subiendo reporte:", err);
      if (!isOnline) await saveDraft(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reporte #{orderId}</Text>

      {/* === CHECKLIST === */}
      <Text style={styles.sectionTitle}>Checklist</Text>
      {Object.entries(checklist).map(([key, value]) => (
        <View key={key} style={styles.checkboxContainer}>
          <Text
            onPress={() => setChecklist({ ...checklist, [key]: !value })}
            style={[styles.checkbox, value && styles.checked]}
          >
            {value ? "✅" : "⬜"} {key}
          </Text>
        </View>
      ))}

      {/* === CAMPOS === */}
      <Text style={styles.sectionTitle}>Descripción</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <Text style={styles.sectionTitle}>Observaciones</Text>
      <TextInput
        style={styles.input}
        value={observaciones}
        onChangeText={setObservaciones}
        multiline
      />

      {/* === FIRMA DIGITAL === */}
      <Text style={styles.sectionTitle}>Firma digital</Text>
      {!signature ? (
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          descriptionText="Firma aquí"
          clearText="Limpiar"
          confirmText="Guardar"
          webStyle={signatureStyle}
        />
      ) : (
        <View style={styles.signed}>
          <Text>✅ Firma registrada</Text>
          <Button title="Volver a firmar" onPress={() => setSignature(null)} />
        </View>
      )}

      {/* === BOTONES === */}
      <Button title="Guardar Reporte" onPress={() => uploadReport()} disabled={loading} />
      {!isOnline && (
        <Button title="Guardar como borrador" color="orange" onPress={saveDraft} />
      )}

      {/* === METADATA === */}
      {metadata && (
        <View style={styles.metadata}>
          <Text>🧾 Nombre: {metadata.nombre}</Text>
          <Text>🕒 Fecha: {new Date(metadata.timestamp).toLocaleString()}</Text>
          <Text>📍 GPS: {metadata.gps.lat.toFixed(4)}, {metadata.gps.lng.toFixed(4)}</Text>
          <Text>📱 Dispositivo: {metadata.deviceId}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const signatureStyle = `
  .m-signature-pad--footer { display: none; margin: 0px; }
  body,html { background-color: white; height: 200px; }
`;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 8,
    minHeight: 60,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    marginVertical: 4,
  },
  checkbox: {
    fontSize: 16,
  },
  checked: {
    color: "green",
  },
  signed: {
    marginVertical: 10,
    alignItems: "center",
  },
  metadata: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
});
