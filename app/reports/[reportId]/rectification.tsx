import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔹 Datos de ejemplo
const mockRectifications = [
  {
    content: "Se corrigió el error en la sección de actividades.",
    createdAt: "2025-11-11T10:20:00.000Z",
    author: "Jorge Farias",
    role: "User??",
  },
  {
    content: "Se ajustó el formato del reporte final.",
    createdAt: "2025-11-12T14:45:00.000Z",
    author: "María Pérez",
    role: "mamona",
  },
];

export default function RectificationsScreen() {
  const [rectifications, setRectifications] = useState(mockRectifications);
  const [newRectification, setNewRectification] = useState("");
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
      if (!isPending && !session) router.replace("/login");
    }, [session, isPending]);

    const user = session?.user as any;

  // 🔹 Simulación de carga inicial
  useEffect(() => {
    setRectifications(mockRectifications);
  }, []);

  // 🔹 Agregar nueva rectificación (local)
  const handleAddRectification = () => {
    if (!newRectification.trim()) return;

    const newItem = {
      content: newRectification.trim(),
      createdAt: new Date().toISOString(),
      author: user.name,
      role: user.role,
    };

    setRectifications([newItem, ...rectifications]);
    setNewRectification("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Rectificaciones</Text>

          {rectifications.length === 0 ? (
            <Text style={styles.emptyText}>No hay rectificaciones disponibles.</Text>
          ) : (
            <View style={styles.timelineContainer}>
              {rectifications.map((rect, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineAuthor}>{rect.author + " - " + rect.role}</Text>
                    <Text style={styles.timelineContentText}>{rect.content}</Text>
                    <Text style={styles.timelineTimestamp}>
                      {new Date(rect.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* 🔹 Caja para nueva rectificación */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe una nueva rectificación..."
            placeholderTextColor="#999"
            value={newRectification}
            onChangeText={setNewRectification}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAddRectification}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F5FA" },
  container: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 22, fontWeight: "700", color: "#273F7D", marginBottom: 16 },
  emptyText: { textAlign: "center", color: "#555", marginTop: 50 },
  timelineContainer: { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "#3862CC" },
  timelineItem: { flexDirection: "row", marginBottom: 16 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3862CC",
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: { flex: 1 },
  timelineAuthor: { fontWeight: "700", color: "#273F7D", marginBottom: 4 },
  timelineContentText: { fontSize: 15, color: "#555", marginBottom: 4 },
  timelineTimestamp: { fontSize: 12, color: "#999", fontStyle: "italic" },

  // 🔹 Input y botón
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    backgroundColor: "#F7F9FD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#3862CC",
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FAF9F6",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 14,
  },
});
