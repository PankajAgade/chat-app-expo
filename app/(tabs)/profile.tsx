import { RootState } from "@/store/store";
import { logout } from "@/store/userSlice";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
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
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Branding Header */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>Chat App</Text>
          <Text style={styles.brandSubtitle}>Personal Settings</Text>
        </View>

        <View style={styles.card}>
          {/* Avatar Section */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.name || "User")}</Text>
          </View>

          {/* User Info */}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.divider} />

          {/* Settings Items */}
          <View style={styles.settingsContainer}>
            <View style={styles.settingsItem}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
              <Text style={styles.settingsText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
            <View style={styles.settingsItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
              <Text style={styles.settingsText}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
          </View>

          {/* Logout Button */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 24,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2C3454", // Navy branding
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#F3F4F6",
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  email: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
    marginBottom: 24,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 24,
  },
  settingsContainer: {
    width: "100%",
    marginBottom: 30,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
  },
  settingsText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#FF5252",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});