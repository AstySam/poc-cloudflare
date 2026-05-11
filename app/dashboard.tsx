import { signOut, useSession } from "@/utils/auth-client";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending]);

  if (isPending) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0070f3" />
      </View>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.welcome}>Bonjour, {session?.user?.name} 👋</Text>
        <Text style={s.subtitle}>Que voulez-vous faire ?</Text>

        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.btn, s.btnPrimary, pressed && s.pressed]}
            onPress={() => router.push("/chat")}
          >
            <Text style={s.btnText}>💬 Aller au chatroom</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.btn,
              s.btnSecondary,
              pressed && s.pressed,
            ]}
            onPress={() => router.push("/account")}
          >
            <Text style={s.btnTextSecondary}>👤 Mon compte</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [s.signOutBtn, pressed && s.pressed]}
          onPress={handleSignOut}
        >
          <Text style={s.signOutText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    gap: 16,
    alignItems: "center",
  },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    color: "#efefef",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  btn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#0070f3",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  btnTextSecondary: {
    color: "#efefef",
    fontWeight: "600",
    fontSize: 15,
  },
  signOutBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: "#6b7280",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
});
