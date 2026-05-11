import { signOut, useSession } from "@/utils/auth-client";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE } from "@/utils/api";

const API = API_BASE;

export default function ChatScreen() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const pseudo = session?.user?.name ?? "anonymous";

  /* ── guard: redirect to login if unauthenticated ───────── */
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending]);

  /* ── rooms sidebar ─────────────────────────────────────── */
  const [rooms, setRooms] = useState<string[]>([]);

  /* ── join state ────────────────────────────────────────── */
  const [roomInput, setRoomInput] = useState("");
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  /* ── chat state ────────────────────────────────────────── */
  const [messages, setMessages] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState<string>("");
  const [text, setText] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  /* ── fetch rooms every 3 s ─────────────────────────────── */
  useEffect(() => {
    let alive = true;

    async function loadRooms() {
      try {
        console.log("[ChatScreen] Fetching /rooms");
        const res = await fetch(`${API}/rooms`, { credentials: "include" });
        if (!res.ok) throw new Error(`/rooms → ${res.status}`);
        const data: string[] = await res.json();
        console.log("[ChatScreen] Rooms:", data);
        if (alive) setRooms(data);
      } catch (err) {
        console.error("[ChatScreen] Failed to load rooms:", err);
      }
    }

    loadRooms();
    const id = setInterval(loadRooms, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* ── fetch active users every 5 s ──────────────────────── */
  useEffect(() => {
    if (!joinedRoom) return;
    let alive = true;

    async function loadUsers() {
      try {
        console.log("[ChatScreen] Fetching users for room:", joinedRoom);
        const res = await fetch(
          `${API}/do/roomuser/${encodeURIComponent(joinedRoom!)}/list`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error(`/do/roomuser → ${res.status}`);
        const data: string[] = await res.json();
        console.log("[ChatScreen] Active users:", data);
        if (alive) setActiveUsers(data.length ? data.join(", ") : "(aucun)");
      } catch (err) {
        console.error("[ChatScreen] Failed to load users:", err);
        if (alive) setActiveUsers("(erreur)");
      }
    }

    loadUsers();
    const id = setInterval(loadUsers, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [joinedRoom]);

  /* ── auto-scroll on new messages ───────────────────────── */
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  /* ── cleanup WS on unmount ─────────────────────────────── */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        console.log("[ChatScreen] Closing WebSocket on unmount");
        wsRef.current.close();
      }
    };
  }, []);

  /* ── join room ─────────────────────────────────────────── */
  async function handleJoin() {
    const room = roomInput.trim();
    if (!room) return;

    setJoinError("");
    setJoining(true);
    console.log("[ChatScreen] Joining room:", room, "pseudo:", pseudo);

    try {
      const res = await fetch(`${API}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, pseudo }),
      });
      console.log("[ChatScreen] POST /join →", res.status);
      if (!res.ok) throw new Error(`POST /join → ${res.status}`);
    } catch (err: any) {
      console.error("[ChatScreen] /join failed:", err);
      setJoinError(err?.message ?? "Impossible de rejoindre ce salon");
      setJoining(false);
      return;
    }

    /* open WebSocket */
    if (wsRef.current) wsRef.current.close();

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsHost = API_BASE.replace(/^https?:\/\//, "");
    const wsUrl = `${proto}://${wsHost}/chat/${room}`;
    console.log("[ChatScreen] Opening WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ChatScreen] WebSocket connected");
      setJoining(false);
      setJoinedRoom(room);
      setMessages([]);
    };

    ws.onclose = (e) =>
      console.log("[ChatScreen] WebSocket closed:", e.code, e.reason);

    ws.onerror = (e) => {
      console.error("[ChatScreen] WebSocket error:", e);
      setJoining(false);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "history") {
          console.log(
            "[ChatScreen] History:",
            data.messages.length,
            "messages",
          );
          setMessages(data.messages);
        } else {
          console.log("[ChatScreen] New message:", data.message);
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error("[ChatScreen] Failed to parse WS message:", e.data, err);
      }
    };
  }

  /* ── send message ──────────────────────────────────────── */
  function handleSend() {
    const trimmed = text.trim();
    if (
      !trimmed ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;
    console.log("[ChatScreen] Sending:", trimmed);
    wsRef.current.send(JSON.stringify({ pseudo, text: trimmed }));
    setText("");
  }

  /* ── sign out ──────────────────────────────────────────── */
  async function handleSignOut() {
    console.log("[ChatScreen] Signing out");
    await signOut();
    router.replace("/login");
  }

  /* ── loading session ───────────────────────────────────── */
  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0070f3" />
      </View>
    );
  }

  /* ══════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════ */
  return (
    <View style={styles.root}>
      {/* ── Sidebar ──────────────────────────────────────── */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>💬 Salons</Text>

        <FlatList
          data={rooms}
          keyExtractor={(r) => r}
          style={styles.roomList}
          ListEmptyComponent={
            <Text style={styles.roomEmpty}>Aucun salon actif</Text>
          }
          renderItem={({ item: r }) => (
            <Pressable
              style={[
                styles.roomItem,
                joinedRoom === r && styles.roomItemActive,
              ]}
              onPress={() => setRoomInput(r)}
            >
              <Text
                style={[
                  styles.roomItemText,
                  joinedRoom === r && styles.roomItemTextActive,
                ]}
              >
                👉 {r}
              </Text>
            </Pressable>
          )}
        />

        <View style={styles.sidebarFooter}>
          <Text style={styles.username} numberOfLines={1}>
            {pseudo}
          </Text>
          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Main ─────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!joinedRoom ? (
          /* Join form */
          <View style={styles.joinWrap}>
            <View style={styles.joinCard}>
              <Text style={styles.joinTitle}>Rejoindre un salon</Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={[styles.input, styles.joinInput]}
                  placeholder="Nom du salon"
                  placeholderTextColor="#6b7280"
                  value={roomInput}
                  onChangeText={setRoomInput}
                  onSubmitEditing={handleJoin}
                  returnKeyType="go"
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    pressed && styles.btnPressed,
                    joining && styles.btnDisabled,
                  ]}
                  onPress={handleJoin}
                  disabled={joining}
                >
                  {joining ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>Rejoindre</Text>
                  )}
                </Pressable>
              </View>
              {joinError ? (
                <Text style={styles.errorText}>{joinError}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          /* Chat panel */
          <View style={styles.chatPanel}>
            {/* Active users */}
            <View style={styles.usersBar}>
              <Text style={styles.usersLabel}>Utilisateurs actifs : </Text>
              <Text style={styles.usersValue}>{activeUsers || "…"}</Text>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesBox}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.length === 0 && (
                <Text style={styles.emptyMsg}>
                  Aucun message pour l'instant…
                </Text>
              )}
              {messages.map((m, i) => (
                <Text key={i} style={styles.message}>
                  {m}
                </Text>
              ))}
            </ScrollView>

            {/* Input row */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Ton message…"
                placeholderTextColor="#6b7280"
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleSend}
              >
                <Text style={styles.btnText}>Envoyer</Text>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0f0f0f",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
  },

  /* sidebar */
  sidebar: {
    width: 200,
    backgroundColor: "#1a1a1a",
    borderRightWidth: 1,
    borderRightColor: "#2a2a2a",
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: "column",
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#efefef",
    marginBottom: 12,
  },
  roomList: {
    flex: 1,
  },
  roomEmpty: {
    fontSize: 12,
    color: "#6b7280",
  },
  roomItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  roomItemActive: {
    backgroundColor: "rgba(0,112,243,0.12)",
  },
  roomItemText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  roomItemTextActive: {
    color: "#0070f3",
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingTop: 12,
    gap: 8,
  },
  username: {
    fontSize: 12,
    fontWeight: "600",
    color: "#efefef",
  },
  signOutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  signOutText: {
    fontSize: 12,
    color: "#9ca3af",
  },

  /* main */
  main: {
    flex: 1,
  },

  /* join form */
  joinWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  joinCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    gap: 12,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#efefef",
  },
  joinRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  joinInput: {
    flex: 1,
  },

  /* chat panel */
  chatPanel: {
    flex: 1,
    flexDirection: "column",
  },
  usersBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    flexWrap: "wrap",
  },
  usersLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },
  usersValue: {
    fontSize: 12,
    color: "#efefef",
  },
  messagesBox: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  messagesContent: {
    paddingBottom: 10,
    gap: 4,
  },
  message: {
    color: "#efefef",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyMsg: {
    color: "#6b7280",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
  },
  messageInput: {
    flex: 1,
  },

  /* shared */
  input: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    color: "#efefef",
    fontSize: 14,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#0070f3",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
  },
});
