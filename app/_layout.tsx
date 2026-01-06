// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/use-color-scheme';

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }


// import { Stack } from "expo-router";
// import { useState } from "react";

// export default function RootLayout() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   return (
//     <Stack screenOptions={{ headerShown: false }}>
//       {!isLoggedIn ? (
//         <Stack.Screen name="(auth)" initialParams={{ setIsLoggedIn }} />
//       ) : (
//         <Stack.Screen name="(tabs)" />
//       )}
//     </Stack>
//   );
// }

import { RootState, store } from "@/store/store";
import { hydrateUser } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";

function Bootstrap() {
  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.user.loading);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("user");
      console.log("saved -> ", saved);
      
      dispatch(hydrateUser(saved ? JSON.parse(saved) : null));
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Bootstrap />
    </Provider>
  );
}
