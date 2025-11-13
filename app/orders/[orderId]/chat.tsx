import { useNetwork } from "@/hooks/useNetwork";
import { useWaitForConnection } from "@/hooks/useWaitForConnection";
import { handleApiError } from "@/lib/api/handleApiError";
import { authClient } from "@/lib/auth-client";
import {
  savePendingMessages,
  syncPendingMessages,
} from "@/lib/offline-messages";
import { Message } from "@/types/message";
import { router, useGlobalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
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

const baseURL = process.env.EXPO_PUBLIC_API_URL!;
const organizationSlug = process.env.EXPO_PUBLIC_ORG!;

const TAG_OPTIONS = [
  "avance",
  "pregunta",
  "bloqueo",
  "riesgo",
  "materiales",
  "coordinacion",
];

export default function RectificationsScreen() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [newRectification, setNewRectification] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { orderId } = useGlobalSearchParams<{ orderId: string }>();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [rectificationPending, setRectificationPending] = useState(false);
  const isOnline = useNetwork();
  const waitForConnection = useWaitForConnection();
  const scrollViewRef = useRef<ScrollView>(null);

  const user = session?.user as any;

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [session, isPending]);

  // 🔹 Obtener mensajes
  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    try {
      if (!isOnline) {
        Alert.alert("Sin conexión", "Se reintentará al reconectarse.");
        return;
      }

      setLoading(true);
      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/orders/${orderId}/messages`,
        { method: "GET" }
      );

      const hasError = await handleApiError(res, {
        onConflictReload: fetchMessages,
        isOnline,
      });
      if (hasError) return;

      const data = res.data?.messages ?? [];
      setMessages(Array.isArray(data) ? data : []);
      console.log("✅ Mensajes cargados:", data);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Error desconocido");
      console.error("Rectification fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, orderId]);

  useEffect(() => {
    if (!isPending && session && orderId && messages === null && isOnline !== null) {
      fetchMessages();
    }
  }, [isPending, session, orderId, fetchMessages, messages, isOnline]);

  // 🔹 Sincronizar pendientes al reconectarse
  useEffect(() => {
    const handleReconnect = async () => {
      if (isOnline && rectificationPending) {
        try {
          await syncPendingMessages(baseURL, organizationSlug, authClient, isOnline);
          await fetchMessages();
          setRectificationPending(false);
        } catch (err) {
          console.error("❌ Error al sincronizar mensajes:", err);
        }
      }
    };
    handleReconnect();
  }, [isOnline, rectificationPending]);

  // 🔹 Alternar selección de tags
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 🔹 Enviar nuevo mensaje
  const addRectification = async () => {
    if (!session || !orderId) return;
    if (!newRectification.trim()) return;
    if (selectedTags.length === 0) {
      Alert.alert("Selecciona al menos una etiqueta", "Debes elegir una o más antes de enviar.");
      return;
    }

    const timestamp = new Date().toISOString();
    const bodyData: Message = {
      text: newRectification.trim(),
      tags: selectedTags,
    };

    console.log("📤 Enviando mensaje:", bodyData);
    setNewRectification("");
    setSelectedTags([]);

    try {
      setLoading(true);
      if (!isOnline) {
        setRectificationPending(true);
        await savePendingMessages(orderId, bodyData);
        Alert.alert("Sin conexión", "Guardado localmente. Se sincronizará al reconectarse.");
        return;
      }

      const res = await authClient.$fetch<any>(
        `${baseURL}/api/v1/${organizationSlug}/orders/${orderId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        }
      );

      const hasError = await handleApiError(res, {
        onConflictReload: fetchMessages,
        isOnline,
      });
      if (hasError) return;

      await fetchMessages();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Error desconocido");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading || messages === null ? (
              <Text style={styles.emptyText}>Cargando...</Text>
            ) : messages.length === 0 ? (
              <Text style={styles.emptyText}>No hay mensajes aún.</Text>
            ) : (
              messages.map((msg) => {
  // 🔹 Detección robusta de si el mensaje es del usuario autenticado
  const isUser =
            msg.sender?.userId === user?.id 

  return (
    <View
      key={msg.id ?? msg.createdAt}
      style={[
        styles.messageWrapper,
        isUser ? { alignItems: "flex-end" } : { alignItems: "flex-start" },
      ]}
    >
      {!isUser && (
        <View style={styles.headerRow}>
          {msg.sender?.user?.image ? (
            <Image
              source={{ uri: msg.sender.user.image }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={{ color: "#FFF" }}>
                {msg.sender?.user?.name?.[0] ?? "?"}
              </Text>
            </View>
          )}
          <Text style={styles.authorText}>
            {msg.sender?.user?.name ?? "Usuario"}{" "}
            <Text style={{ color: "#777" }}>
              ({msg.sender?.user?.role ?? "sin rol"})
            </Text>
          </Text>
        </View>
      )}

      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.otherBubble]}>
        <Text
          style={[
            styles.messageText,
            isUser ? { color: "#FFF" } : { color: "#222" },
          ]}
        >
          {msg.content ?? msg.text}
        </Text>

        {msg.tags?.length > 0 && (
          <View style={styles.tagList}>
            {msg.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tagBadge,
                  isUser ? { backgroundColor: "#FFF2", borderWidth: 0 } : null,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    isUser ? { color: "#FFF" } : { color: "#273F7D" },
                  ]}
                >
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text
          style={[
            styles.timeText,
            isUser ? { color: "#E6E6E6" } : { color: "#888" },
          ]}
        >
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleString()
            : "Fecha no disponible"}
        </Text>
      </View>
    </View>
  );
})
            )}
          </ScrollView>

          <View style={styles.tagContainer}>
            {TAG_OPTIONS.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.tagButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tagButtonText,
                    selectedTags.includes(tag) && styles.tagButtonTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              value={newRectification}
              onChangeText={setNewRectification}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newRectification.trim() || selectedTags.length === 0) && {
                  backgroundColor: "#AAA",
                },
              ]}
              onPress={addRectification}
              disabled={!newRectification.trim() || selectedTags.length === 0}
            >
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F5FA" },
  chatContainer: { flex: 1, padding: 10 },
  messagesContainer: { paddingBottom: 120 },
  emptyText: { textAlign: "center", color: "#555", marginTop: 30 },

  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 6,
    gap: 6,
    justifyContent: "center",
  },
  tagButton: {
    borderWidth: 1,
    borderColor: "#3862CC",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagButtonSelected: { backgroundColor: "#3862CC" },
  tagButtonText: { color: "#3862CC", fontSize: 13 },
  tagButtonTextSelected: { color: "#FFF", fontWeight: "bold" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F7F9FD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  messageWrapper: {
    width: "100%",
    marginVertical: 6,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#3862CC",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#E8EBF7",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  placeholderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#273F7D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  authorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#273F7D",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 6,
  },
  tagBadge: {
    borderWidth: 1,
    borderColor: "#273F7D",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
});

