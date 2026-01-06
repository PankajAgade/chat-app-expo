import { db } from "@/lib/firebase";
import { setUser } from "@/store/userSlice";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useDispatch } from "react-redux";
import * as Yup from "yup";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().required("Password required"),
});

export default function Login() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  async function handleLogin(values: any) {
    setLoading(true);
    try {
      const q = query(
        collection(db, "Users"),
        where("email", "==", values.email),
        where("password", "==", values.password)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("Error", "Invalid email or password");
        setLoading(false);
        return;
      }

      const userData = snapshot.docs[0].data();
      
      // FIX: Convert non-serializable Timestamp to milliseconds
      const user = {
        ...userData,
        id: snapshot.docs[0].id,
        createdAt: userData.createdAt?.toMillis ? userData.createdAt.toMillis() : userData.createdAt
      };

      dispatch(setUser(user));
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      Alert.alert("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({ handleChange, handleSubmit, values, errors, touched }) => (
                <>
                  <TextInput
                    placeholder="Email"
                    style={styles.input}
                    value={values.email}
                    onChangeText={handleChange("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

                  <TextInput
                    placeholder="Password"
                    style={styles.input}
                    value={values.password}
                    onChangeText={handleChange("password")}
                    secureTextEntry
                  />
                  {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

                  <Pressable style={styles.btn} onPress={handleSubmit as any} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
                  </Pressable>

                  <Pressable onPress={() => router.push("/(auth)/register")}>
                    <Text style={styles.link}>Create new account</Text>
                  </Pressable>
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 6 },
  error: { color: "red", marginBottom: 8, fontSize: 12 },
  btn: { backgroundColor: "#0066ff", padding: 14, borderRadius: 10, marginTop: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  link: { marginTop: 12, textAlign: "center", color: "#0066ff" },
});