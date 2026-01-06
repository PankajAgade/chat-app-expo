import { db } from "@/lib/firebase";
import { router } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Yup from "yup";

const RegisterSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

export default function Register() {
  const [loading, setLoading] = useState(false);

  async function handleRegister(values: any) {
    setLoading(true);

    try {
      const q = query(collection(db, "Users"), where("email", "==", values.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("Email already exists");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "Users"), {
        name: values.name,
        email: values.email,
        password: values.password,
        createdAt: new Date(),
      });

      alert("Registered successfully");
      router.back();
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            <Formik
              initialValues={{ name: "", email: "", password: "" }}
              validationSchema={RegisterSchema}
              onSubmit={handleRegister}
            >
              {({ handleChange, handleSubmit, values, errors, touched }) => (
                <>
                  <TextInput
                    placeholder="Name"
                    style={styles.input}
                    value={values.name}
                    onChangeText={handleChange("name")}
                  />
                  {touched.name && errors.name && <Text style={styles.error}>{errors.name}</Text>}

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
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
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
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 6 },
  error: { color: "red", marginBottom: 8, fontSize: 12 },
  btn: { backgroundColor: "#0066ff", padding: 14, borderRadius: 10, marginTop: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
