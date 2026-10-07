import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";
import Girlish from "../../assets/fonts/Girlish.otf";
import { AuthProvider } from "../lib/auth";
import { COLORS } from "../lib/theme";

export default function RootLayout() {
  const [loaded] = useFonts({ Girlish });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.cream }}>
        <ActivityIndicator size="large" color={COLORS.blush} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.plum,
          headerTitleStyle: { fontFamily: "Girlish", fontSize: 26 },
          contentStyle: { backgroundColor: COLORS.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Maheba ♡" }} />
        <Stack.Screen name="p/[id]" options={{ title: "Provider" }} />
        <Stack.Screen name="join" options={{ title: "Join ✿" }} />
        <Stack.Screen name="login" options={{ title: "Log in ♡" }} />
        <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Stack.Screen name="admin" options={{ title: "Admin" }} />
      </Stack>
    </AuthProvider>
  );
}
