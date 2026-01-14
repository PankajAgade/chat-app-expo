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
    PermissionsAndroid,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

// 1. Import Agora SDK
import {
    ChannelProfileType,
    ClientRoleType,
    createAgoraRtcEngine,
    IRtcEngine,
} from 'react-native-agora';

// --- AGORA CONFIG ---
const AGORA_APP_ID = 'ad57886cb9b647d7a57c3b17c60fa720'; // Replace with your ID from Agora Console
const AGORA_TOKEN = '007eJxTYPC4WPggoWjZxq8t6TPWqXjvbV347gzLxQmOTF5WvRMsX15QYEhMMTW3sDBLTrJMMjMxTzFPNDVPNk4yNE82M0hLNDcyaOJMzWwIZGSY9VGFhZEBAkF8FoaS1OISBgYAv14ggg=='; // Use empty string for testing if token is disabled

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

    // --- State ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [receiver, setReceiver] = useState<any>(null);
    const [isJoined, setIsJoined] = useState(false); // Call status
    
    const agoraEngineRef = useRef<IRtcEngine>(); 
    const roomId = currentUser?.id && id ? [currentUser.id, id].sort().join("_") : null;

    // 2. Initialize Agora on Mount
    useEffect(() => {
        setupAudioSDKEngine();
        return () => {
            agoraEngineRef.current?.unregisterEventHandler({});
            agoraEngineRef.current?.release(); // Clean up
        };
    }, []);

    const setupAudioSDKEngine = async () => {
        try {
            // Request Android Mic Permissions
            if (Platform.OS === 'android') {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            }

            agoraEngineRef.current = createAgoraRtcEngine();
            const agoraEngine = agoraEngineRef.current;

            await agoraEngine.initialize({ appId: AGORA_APP_ID }); // Initialize

            agoraEngine.registerEventHandler({
                onJoinChannelSuccess: () => {
                    setIsJoined(true);
                },
                onUserOffline: () => {
                    leaveCall();
                },
                onLeaveChannel: () => {
                    setIsJoined(false);
                }
            });
        } catch (e) {
            console.error(e);
        }
    };

    // 3. Join Call Logic
    const joinCall = async () => {
        if (!roomId) return;
        try {
            agoraEngineRef.current?.joinChannel(AGORA_TOKEN, roomId, 0, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                autoSubscribeAudio: true,
            });
        } catch (e) {
            console.error(e);
        }
    };

    // 4. Leave Call Logic
    const leaveCall = () => {
        agoraEngineRef.current?.leaveChannel();
    };

    // --- Existing Message Handlers ---
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
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2C3E50" /></View>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Branded Header with Call Button */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </Pressable>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{receiver?.name?.[0] || "U"}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{receiver?.name || "User"}</Text>
                    <Text style={styles.headerStatus}>{isJoined ? "In Call" : "Active now"}</Text>
                </View>

                {/* Call Action Button */}
                <Pressable 
                    style={[styles.callBtn, isJoined && { backgroundColor: '#FF5252' }]} 
                    onPress={isJoined ? leaveCall : joinCall}
                >
                    <Ionicons name={isJoined ? "close" : "call"} size={18} color={isJoined ? "#fff" : "#2C3454"} />
                    <Text style={[styles.callBtnText, isJoined && { color: '#fff' }]}>
                        {isJoined ? "End" : "Call"}
                    </Text>
                </Pressable>
            </View>

            {/* Timer Bar (Visible during call) */}
            {isJoined && (
                <View style={styles.timerBar}>
                    <Text style={styles.timerText}>00:14</Text>
                    <Text style={styles.timerText}>₹ 8.17</Text>
                </View>
            )}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            renderItem={({ item }) => {
                                const isMine = item.senderId === currentUser?.id;
                                return (
                                    <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                                        <Text style={[styles.messageText, isMine && { color: "#fff" }]}>{item.text}</Text>
                                        <Text style={[styles.timeText, isMine && { color: "#ccc" }]}>{formatTime(item.createdAt)}</Text>
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
                                    underlineColorAndroid="transparent"
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
    safeArea: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1, backgroundColor: "#F9FAFB" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEE", backgroundColor: "#fff" },
    backBtn: { paddingRight: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2C3454", justifyContent: "center", alignItems: "center" },
    avatarText: { color: "#FFF", fontWeight: "bold" },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerName: { fontSize: 16, fontWeight: "700", color: "#333" },
    headerStatus: { fontSize: 12, color: "#27AE60" },
    
    // Call Button
    callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
    callBtnText: { marginLeft: 5, fontSize: 12, fontWeight: '600', color: '#2C3454' },

    timerBar: { backgroundColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 6 },
    timerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    bubble: { maxWidth: "80%", padding: 12, borderRadius: 15, marginVertical: 5, elevation: 1 },
    myBubble: { alignSelf: "flex-end", backgroundColor: "#2C3454", borderBottomRightRadius: 2 },
    otherBubble: { alignSelf: "flex-start", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB", borderBottomLeftRadius: 2 },
    messageText: { fontSize: 15, lineHeight: 20 },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end", color: "#999" },
    inputWrapper: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: '#EEE' },
    inputContainer: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 25, paddingHorizontal: 15, marginRight: 10 },
    input: { height: 45, color: "#333", textAlignVertical: 'center' },
    sendIconContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: "#2C3454", justifyContent: "center", alignItems: "center", elevation: 2 },
});