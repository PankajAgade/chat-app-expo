import { db } from "@/lib/firebase";
import { RootState } from "@/store/store";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function Home() {
  const { data: currentUser, loading } = useSelector((state: RootState) => state.user);
  const [users, setUsers] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && currentUser) {
      loadUsers();
    }
  }, [loading, currentUser]);

  async function loadUsers() {
    try {
      const snapshot = await getDocs(collection(db, "Users"));

      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== currentUser.id);

      setUsers(list);
    } finally {
      setPageLoading(false);
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase();

  if (loading || pageLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              console.log(`/chat/${item.id}`);
              
              router.push(`/chat/${item.id}`)
            }}
            key={item?.id}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f8", paddingTop: 60 },
  header: { fontSize: 26, fontWeight: "700", paddingHorizontal: 20, marginBottom: 10 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    elevation: 2,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0066ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: { color: "#fff", fontWeight: "700" },

  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 12, color: "#666" },
});
