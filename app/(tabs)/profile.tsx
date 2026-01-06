import { RootState } from "@/store/store";
import { logout } from "@/store/userSlice";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function Profile() {
  const user = useSelector((state: RootState) => state.user.data);
  const dispatch = useDispatch();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  const initials = getInitials(user.name || "User");

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <Pressable
          style={styles.logout}
          onPress={() => {
            dispatch(logout());
            router.replace("/(auth)/login");
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#0066ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 6,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 22,
  },
  logout: {
    marginTop: 10,
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
