import { db } from "@/lib/firebase";
import { RootState } from "@/store/store";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSelector } from "react-redux";

// 1. Define a User interface for better type safety
interface ChatUser {
  id: string;
  name: string;
  email: string;
}

export default function Home() {
  const { data: currentUser, loading: authLoading } = useSelector((state: RootState) => state.user);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 2. Wrap loadUsers in useCallback to prevent unnecessary re-renders
  const loadUsers = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const snapshot = await getDocs(collection(db, "Users"));
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatUser))
        .filter(u => u.id !== currentUser.id);

      setUsers(list);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      loadUsers();
    }
  }, [authLoading, currentUser, loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const getInitials = (name: string = "User") =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  if (authLoading || pageLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Chats</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // Show this when no other users exist in the database
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.7 : 1 } // Visual feedback on touch
            ]}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f8" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: { paddingTop: 60, paddingBottom: 10, backgroundColor: "#fff" },
  header: { fontSize: 26, fontWeight: "700", paddingHorizontal: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0066ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  email: { fontSize: 13, color: "#666", marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999", fontSize: 16 }
});