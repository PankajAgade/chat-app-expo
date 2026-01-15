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
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
} from "react-native-agora";

// ================= CONFIG =================
const AGORA_APP_ID = "ad57886cb9b647d7a57c3b17c60fa720";
const AGORA_TOKEN = "007eJxTYDDi3/t7T8UtVmut1RMLAnckR79sX7znTWfn52o77TZRtsUKDIkppuYWFmbJSZZJZibmKeaJpubJxkmG5slmBmmJ5kYGbGcyMhsCGRl2fLBjZWSAQBCfhaEktbiEgQEAZL4f0A==";

// ================= TYPES =================
interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
}

// ================= COMPONENT =================
export default function Chat() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.user.data);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState<any>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [incoming, setIncoming] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const agoraHandlerRef = useRef<any>(null);

  const roomId =
    currentUser?.id && id ? [currentUser.id, id].sort().join("_") : null;

  // ================= AGORA INIT =================
  useEffect(() => {
    initAgora();
    return cleanup;
  }, []);

  const initAgora = async () => {
    try {
      if (Platform.OS === "android") {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
      }

      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;

      await engine.initialize({ appId: AGORA_APP_ID });

      engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableAudio();

      agoraHandlerRef.current = {
        onJoinChannelSuccess: () => setIsJoined(true),
        onUserOffline: () => endCall(),
        onLeaveChannel: () => setIsJoined(false),
        onError: (e: any) => setDevError("Agora error: " + e),
      };

      engine.registerEventHandler(agoraHandlerRef.current);
    } catch (e: any) {
      setDevError("Agora init failed: " + e.message);
    }
  };

  const cleanup = async () => {
    try {
      if (agoraHandlerRef.current)
        agoraEngineRef.current?.unregisterEventHandler(agoraHandlerRef.current);

      await agoraEngineRef.current?.leaveChannel();
      await agoraEngineRef.current?.release();
    } catch {}
  };

  // ================= CALL SIGNALING =================
  useEffect(() => {
    if (!roomId || !currentUser?.id) return;

    const unsub = onSnapshot(doc(db, "Calls", roomId), (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.status === "calling" && data.receiverId === currentUser.id)
        setIncoming(true);

      if (data.status === "accepted") joinAgora();
      if (data.status === "ended") endCall();
    });

    return () => unsub();
  }, [roomId]);

  const startCall = async () => {
    try {
      if (!roomId || !currentUser?.id || !id) return;
      await setDoc(doc(db, "Calls", roomId), {
        status: "calling",
        callerId: currentUser.id,
        receiverId: id,
        createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      setDevError("Start call error: " + e.message);
    }
  };

  const acceptCall = async () => {
    try {
      await updateDoc(doc(db, "Calls", roomId!), { status: "accepted" });
      setIncoming(false);
    } catch (e: any) {
      setDevError("Accept call error: " + e.message);
    }
  };

  const endCall = async () => {
    try {
      if (!roomId) return;
      await updateDoc(doc(db, "Calls", roomId), { status: "ended" });
      await agoraEngineRef.current?.leaveChannel();
      setIsJoined(false);
      setIncoming(false);
    } catch (e: any) {
      setDevError("End call error: " + e.message);
    }
  };

  const joinAgora = async () => {
    try {
      if (!roomId) return;
      await agoraEngineRef.current?.joinChannel(AGORA_TOKEN, roomId, 0, {});
    } catch (e: any) {
      setDevError("Join channel error: " + e.message);
    }
  };

  // ================= CHAT =================
  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "Users", id as string)).then((snap) =>
      snap.exists() && setReceiver(snap.data())
    );
  }, [id]);

  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "Messages", roomId, "chats"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });
  }, [roomId]);

  const sendMessage = async () => {
    if (!text.trim() || !roomId || !currentUser?.id) return;
    setText("");
    await addDoc(collection(db, "Messages", roomId, "chats"), {
      text,
      senderId: currentUser.id,
      createdAt: serverTimestamp(),
    });
  };

  // ================= UI =================
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* DEV ERROR PANEL */}
      {devError && (
        <View style={styles.devErrorBox}>
          <Text style={styles.devErrorTitle}>DEV ERROR</Text>
          <Text style={styles.devErrorText}>{devError}</Text>
          <Pressable onPress={() => setDevError(null)} style={styles.devClose}>
            <Text style={{ color: "#fff" }}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{receiver?.name || "User"}</Text>
          <Text style={styles.headerStatus}>
            {isJoined ? "In Call" : "Active"}
          </Text>
        </View>

        <Pressable
          style={[styles.callBtn, isJoined && { backgroundColor: "#E11D48" }]}
          onPress={isJoined ? endCall : startCall}
        >
          <Ionicons name={isJoined ? "close" : "call"} size={18} color="#fff" />
        </Pressable>
      </View>

      {/* INCOMING CALL */}
      {incoming && (
        <View style={styles.incoming}>
          <Text style={{ fontWeight: "700" }}>Incoming Call</Text>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <Pressable style={styles.accept} onPress={acceptCall}>
              <Text style={{ color: "#fff" }}>Accept</Text>
            </Pressable>
            <Pressable style={styles.reject} onPress={endCall}>
              <Text style={{ color: "#fff" }}>Reject</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* CHAT */}
      <FlatList
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.senderId === currentUser?.id
                ? styles.myBubble
                : styles.otherBubble,
            ]}
          >
            <Text style={{ color: "#fff" }}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholder="Type message..."
        />
        <Pressable onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerCenter: { alignItems: "center" },
  headerName: { fontWeight: "700" },
  headerStatus: { fontSize: 12, color: "#16A34A" },

  callBtn: {
    backgroundColor: "#2563EB",
    padding: 8,
    borderRadius: 20,
  },

  incoming: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    alignItems: "center",
  },

  accept: { backgroundColor: "#16A34A", padding: 10, borderRadius: 8 },
  reject: { backgroundColor: "#DC2626", padding: 10, borderRadius: 8 },

  bubble: { margin: 6, padding: 10, borderRadius: 12 },
  myBubble: { backgroundColor: "#2563EB", alignSelf: "flex-end" },
  otherBubble: { backgroundColor: "#64748B", alignSelf: "flex-start" },

  inputRow: { flexDirection: "row", padding: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12 },
  sendBtn: {
    backgroundColor: "#2563EB",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  devErrorBox: {
    backgroundColor: "#7F1D1D",
    padding: 12,
    margin: 10,
    borderRadius: 10,
  },
  devErrorTitle: { color: "#FCA5A5", fontWeight: "800" },
  devErrorText: { color: "#FEE2E2", fontSize: 12 },
  devClose: {
    marginTop: 6,
    backgroundColor: "#DC2626",
    padding: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
});
