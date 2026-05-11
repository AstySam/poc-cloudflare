import { useSession } from "@/utils/auth-client";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AccountScreen() {
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

  const user = session?.user;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Informations du compte</Text>

        <Row label="ID" value={user?.id} />
        <Row label="Nom" value={user?.name} />
        <Row label="Email" value={user?.email} />
        <Row
          label="Email vérifié"
          value={user?.emailVerified ? "✅ Oui" : "❌ Non"}
        />
        <Row
          label="Compte créé le"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—"
          }
        />
        <Row
          label="Dernière mise à jour"
          value={
            user?.updatedAt
              ? new Date(user.updatedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—"
          }
        />
      </View>

      <Pressable
        style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
        onPress={() => router.back()}
      >
        <Text style={s.backText}>← Retour au dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1} selectable>
        {value ?? "—"}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  content: {
    padding: 24,
    alignItems: "center",
    gap: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0070f3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#efefef",
  },
  email: {
    fontSize: 13,
    color: "#9ca3af",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  rowLabel: {
    fontSize: 14,
    color: "#9ca3af",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    color: "#efefef",
    flex: 2,
    textAlign: "right",
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backText: {
    color: "#0070f3",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
