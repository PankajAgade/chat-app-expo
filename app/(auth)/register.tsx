import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
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
  View,
} from "react-native";
import * as Yup from "yup";

const RegisterSchema = Yup.object().shape({
  name: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister(values: any) {
    setLoading(true);

    try {
      const q = query(collection(db, "Users"), where("email", "==", values.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        Alert.alert("Registration Failed", "This email is already registered.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "Users"), {
        name: values.name,
        email: values.email,
        password: values.password, // Note: In production, passwords should be hashed
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
      });

      Alert.alert("Success", "Your account has been created!");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" style={styles.main}>
          <View style={styles.container}>
            {/* Branding Section */}
            <View style={styles.brandContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="person-add" size={40} color="#fff" />
              </View>
              <Text style={styles.appName}>Create Account</Text>
              <Text style={styles.subtitle}>Join Chat App and start connecting</Text>
            </View>

            <Formik
              initialValues={{ name: "", email: "", password: "" }}
              validationSchema={RegisterSchema}
              onSubmit={handleRegister}
            >
              {({ handleChange, handleSubmit, values, errors, touched }) => (
                <View style={styles.form}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    placeholder="John Doe"
                    style={styles.input}
                    value={values.name}
                    onChangeText={handleChange("name")}
                    placeholderTextColor="#999"
                  />
                  {touched.name && errors.name && <Text style={styles.error}>{errors.name}</Text>}

                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    placeholder="name@example.com"
                    style={styles.input}
                    value={values.email}
                    onChangeText={handleChange("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                  {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="At least 6 characters"
                      style={styles.passwordInput}
                      value={values.password}
                      onChangeText={handleChange("password")}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#999"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={22} 
                        color="#666" 
                      />
                    </Pressable>
                  </View>
                  {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

                  <Pressable style={styles.btn} onPress={handleSubmit as any} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Sign Up</Text>
                    )}
                  </Pressable>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Pressable onPress={() => router.back()}>
                      <Text style={styles.link}>Login</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  main: { backgroundColor: "#fff" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  
  // Branding
  brandContainer: { alignItems: "center", marginBottom: 30 },
  logoIcon: { 
    backgroundColor: "#0066ff", 
    width: 80, 
    height: 80, 
    borderRadius: 20, 
    justifyContent: "center", 
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  appName: { fontSize: 32, fontWeight: "800", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, textAlign: 'center' },

  // Form
  form: { width: "100%" },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 8, marginTop: 16 },
  input: { 
    backgroundColor: "#f8f9fa",
    borderWidth: 1, 
    borderColor: "#e9ecef", 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16,
    color: "#1a1a1a"
  },
  
  // Password Field
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a"
  },
  eyeIcon: { paddingHorizontal: 16 },

  error: { color: "#ff3b30", marginTop: 4, fontSize: 12, fontWeight: "500" },
  
  btn: { 
    backgroundColor: "#0066ff", 
    padding: 18, 
    borderRadius: 12, 
    marginTop: 30,
    elevation: 2,
    shadowColor: "#0066ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
  
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, marginBottom: 20 },
  footerText: { color: "#666", fontSize: 14 },
  link: { color: "#0066ff", fontSize: 14, fontWeight: "700" },
});