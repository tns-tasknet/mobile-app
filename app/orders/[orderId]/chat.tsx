import React, { useEffect, useRef, useState } from "react";
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

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Necesito que termines este trabajo....", sender: "bot" },
  ]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView | null>(null);


  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simular respuesta automática
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Perfecto!!!",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  useEffect(() => {
    // Auto scroll al final cada vez que se envía o recibe un mensaje
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        ref={scrollViewRef}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === "user"
                ? styles.userBubble
                : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.sender === "user"
                  ? styles.userText
                  : styles.botText,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#aaa"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9EFFB",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  userBubble: {
    backgroundColor: "#3862CC",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  messageText: {
    fontSize: 15,
  },
  userText: {
    color: "#FAF9F6",
  },
  botText: {
    color: "#273F7D",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#3862CC",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: "#FAF9F6",
    fontWeight: "bold",
  },
});
