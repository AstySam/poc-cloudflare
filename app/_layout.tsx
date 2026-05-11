import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSession } from "@/utils/auth-client";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const segments = useSegments();
  // Track whether we have ever received a confirmed session, to avoid
  // redirecting to /login during the brief re-fetch window after sign-in.
  const confirmedNoSession = useRef(false);

  useEffect(() => {
    if (isPending) {
      confirmedNoSession.current = false;
      return;
    }

    const inAuthScreen = segments[0] === "login" || segments[0] === "register";

    if (!session) {
      confirmedNoSession.current = true;
    }

    if (!session && confirmedNoSession.current && !inAuthScreen) {
      router.replace("/login");
    } else if (session && inAuthScreen) {
      router.replace("/chat");
    }
  }, [session, isPending, segments]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
