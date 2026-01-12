import { db } from "@/lib/firebase";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useSelector } from "react-redux";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
}

export default function Chat() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.user.data);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState<any>(null);

  const roomId = currentUser?.id && id ? [currentUser.id, id].sort().join("_") : null;

  useEffect(() => {
    async function loadReceiver() {
      if (!id) return;
      const snap = await getDoc(doc(db, "Users", id as string));
      if (snap.exists()) setReceiver(snap.data());
    }
    loadReceiver();
  }, [id]);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "Messages", roomId, "chats"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!text.trim() || !roomId || !currentUser?.id) return;
    const tempText = text;
    setText("");
    await addDoc(collection(db, "Messages", roomId, "chats"), {
      text: tempText,
      senderId: currentUser.id,
      createdAt: serverTimestamp(),
    });
  };

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return "";
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2C3E50" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Branded Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </Pressable>
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{receiver?.name?.[0] || "U"}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{receiver?.name || "User"}</Text>
          <Text style={styles.headerStatus}>Active now</Text>
        </View>
      </View>

 

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 15 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isMine = item.senderId === currentUser?.id;
                return (
                  <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isMine && { color: "#fff" }]}>{item.text}</Text>
                    <Text style={[styles.timeText, isMine && { color: "#999" }]}>{formatTime(item.createdAt)}</Text>
                  </View>
                );
              }}
            />

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="Type your message..."
                  placeholderTextColor="#999"
                />
              </View>
              <Pressable onPress={sendMessage} style={styles.sendIconContainer}>
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  
  // Header
  header: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  backBtn: { marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2C3454", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#FFF", fontWeight: "bold" },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: "700", color: "#333" },
  headerStatus: { fontSize: 12, color: "#27AE60" },
  endBtn: { backgroundColor: "#FFEBEE", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  endText: { color: "#FF5252", fontSize: 12, fontWeight: "600" },

  // Timer Bar
  timerBar: { backgroundColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  timerText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Bubbles
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 15, marginVertical: 5 },
  myBubble: { alignSelf: "flex-end", backgroundColor: "#2C3454", borderBottomRightRadius: 2 },
  otherBubble: { alignSelf: "flex-start", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB", borderBottomLeftRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end", color: "#999" },

  // Input
  inputWrapper: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#FFF" },
  inputContainer: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 15, marginRight: 10 },
  input: { height: 45, color: "#333" },
  sendIconContainer: { width: 45, height: 45, borderRadius: 8, backgroundColor: "#2C3454", justifyContent: "center", alignItems: "center" },
});