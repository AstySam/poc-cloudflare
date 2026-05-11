import {
  CSSProperties,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from '@/utils/auth-client';

import { API_BASE } from '@/utils/api';

const BASE = API_BASE;

const T = {
  bg: "#0f0f0f",
  surface: "#1a1a1a",
  border: "#2a2a2a",
  text: "#efefef",
  muted: "#9ca3af",
  accent: "#0070f3",
  error: "#f87171",
} as const;

/* ── types ─────────────────────────────────────────────────── */
type Msg = string;

/* ══════════════════════════════════════════════════════════════
   ChatPage
══════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  /* sidebar */
  const [rooms, setRooms] = useState<string[]>([]);

  /* join form */
  const [roomInput, setRoomInput] = useState("");
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");

  /* chat panel */
  const [messages, setMessages] = useState<Msg[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [text, setText] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const pseudo = session?.user?.name ?? "anonymous";

  /* ── fetch rooms every 3 s ───────────────────────────────── */
  useEffect(() => {
    let alive = true;

    async function fetchRooms() {
      try {
        console.log("[ChatPage] Fetching /rooms");
        const res = await fetch(`${BASE}/rooms`, { credentials: "include" });
        if (!res.ok) throw new Error(`/rooms → ${res.status}`);
        const data: string[] = await res.json();
        console.log("[ChatPage] Rooms:", data);
        if (alive) setRooms(data);
      } catch (err) {
        console.error("[ChatPage] Failed to fetch rooms:", err);
      }
    }

    fetchRooms();
    const id = setInterval(fetchRooms, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* ── fetch active users every 5 s when in a room ────────── */
  useEffect(() => {
    if (!joinedRoom) return;
    let alive = true;

    async function fetchUsers() {
      try {
        console.log("[ChatPage] Fetching users for room:", joinedRoom);
        const res = await fetch(`${BASE}/do/roomuser/${joinedRoom}/list`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`/do/roomuser → ${res.status}`);
        const data: string[] = await res.json();
        console.log("[ChatPage] Users in room:", data);
        if (alive) setUsers(data);
      } catch (err) {
        console.error("[ChatPage] Failed to fetch users:", err);
      }
    }

    fetchUsers();
    const id = setInterval(fetchUsers, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [joinedRoom]);

  /* ── auto-scroll messages ────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── cleanup WS on unmount ───────────────────────────────── */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        console.log("[ChatPage] Closing WebSocket on unmount");
        wsRef.current.close();
      }
    };
  }, []);

  /* ── join room ───────────────────────────────────────────── */
  async function handleJoin() {
    const room = roomInput.trim();
    if (!room) return;

    setJoinError("");
    console.log("[ChatPage] Joining room:", room, "as pseudo:", pseudo);

    try {
      const res = await fetch(`${BASE}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, pseudo }),
      });
      console.log("[ChatPage] POST /join →", res.status);
      if (!res.ok) throw new Error(`POST /join → ${res.status}`);
    } catch (err: any) {
      console.error("[ChatPage] /join failed:", err);
      setJoinError(err?.message ?? "Impossible de rejoindre la room");
      return;
    }

    /* open WebSocket */
    if (wsRef.current) {
      wsRef.current.close();
    }

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsHost = BASE.replace(/^https?:\/\//, "");
    const wsUrl = `${proto}://${wsHost}/chat/${room}`;
    console.log("[ChatPage] Opening WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("[ChatPage] WebSocket connected");
    ws.onclose = (e) =>
      console.log("[ChatPage] WebSocket closed:", e.code, e.reason);
    ws.onerror = (e) => console.error("[ChatPage] WebSocket error:", e);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "history") {
          console.log(
            "[ChatPage] Received history:",
            data.messages.length,
            "messages",
          );
          setMessages(data.messages);
        } else {
          console.log("[ChatPage] Received message:", data.message);
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error("[ChatPage] Failed to parse WS message:", e.data, err);
      }
    };

    setMessages([]);
    setJoinedRoom(room);
  }

  /* ── send message ────────────────────────────────────────── */
  function handleSend() {
    const trimmed = text.trim();
    if (
      !trimmed ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;

    console.log("[ChatPage] Sending message:", trimmed);
    wsRef.current.send(JSON.stringify({ pseudo, text: trimmed }));
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  /* ── sign out ────────────────────────────────────────────── */
  async function handleSignOut() {
    console.log("[ChatPage] Signing out");
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  /* ══════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="chat-root">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={s.sidebar}>
        <p style={s.sidebarTitle}>💬 Salons</p>

        <div style={s.roomList}>
          {rooms.length === 0 ? (
            <p style={s.roomEmpty}>Aucune room active</p>
          ) : (
            rooms.map((r) => (
              <button
                key={r}
                style={{
                  ...s.roomItem,
                  ...(joinedRoom === r ? s.roomItemActive : {}),
                }}
                onClick={() => setRoomInput(r)}
              >
                # {r}
              </button>
            ))
          )}
        </div>

        <div style={s.sidebarFooter}>
          <p style={s.username} title={session?.user?.email ?? ""}>
            {pseudo}
          </p>
          <button onClick={handleSignOut} style={s.signOutBtn}>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main style={s.main}>
        {!joinedRoom ? (
          /* Join form */
          <div style={s.joinWrap}>
            <div style={s.joinCard}>
              <h2 style={s.joinTitle}>Rejoindre une room</h2>
              <div style={s.joinRow}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  placeholder="Nom de la room"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <button style={s.btn} onClick={handleJoin}>
                  Rejoindre
                </button>
              </div>
              {joinError && <p style={s.error}>{joinError}</p>}
            </div>
          </div>
        ) : (
          /* Chat panel */
          <div style={s.chatPanel}>
            {/* Active users */}
            <div style={s.usersBar}>
              <span style={s.usersLabel}>Connectés :</span>
              <span style={s.usersNames}>
                {users.length === 0 ? "—" : users.join(", ")}
              </span>
            </div>

            {/* Messages */}
            <div style={s.messagesBox}>
              {messages.length === 0 && (
                <p style={s.muted}>Aucun message pour l'instant…</p>
              )}
              {messages.map((m, i) => (
                <p key={i} style={s.message}>
                  {m}
                </p>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div style={s.inputRow}>
              <input
                style={{ ...s.input, flex: 1 }}
                placeholder="Votre message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button style={s.btn} onClick={handleSend}>
                Envoyer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────── */
const s: Record<string, CSSProperties> = {
  /* sidebar */
  sidebar: {
    width: "220px",
    flexShrink: 0,
    backgroundColor: T.surface,
    borderRight: `1px solid ${T.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "1rem 0.75rem",
    gap: "0.5rem",
  },
  sidebarTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: T.text,
    marginBottom: "0.5rem",
  },
  roomList: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    overflowY: "auto",
  },
  roomEmpty: {
    fontSize: "0.8rem",
    color: T.muted,
  },
  roomItem: {
    background: "none",
    border: "none",
    textAlign: "left",
    padding: "6px 8px",
    borderRadius: "6px",
    color: T.muted,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  roomItemActive: {
    backgroundColor: "#0070f320",
    color: T.accent,
  },
  sidebarFooter: {
    borderTop: `1px solid ${T.border}`,
    paddingTop: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  username: {
    fontSize: "0.8rem",
    color: T.text,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  signOutBtn: {
    padding: "6px 10px",
    background: "transparent",
    border: `1px solid ${T.border}`,
    borderRadius: "6px",
    color: T.muted,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  /* main */
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  /* join */
  joinWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  joinCard: {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "8px",
    padding: "2rem",
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  joinTitle: {
    color: T.text,
    fontSize: "1.2rem",
    fontWeight: 600,
  },
  joinRow: {
    display: "flex",
    gap: "0.5rem",
  },
  /* chat */
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0",
    overflow: "hidden",
  },
  usersBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: T.surface,
    borderBottom: `1px solid ${T.border}`,
    flexWrap: "wrap",
  },
  usersLabel: {
    fontSize: "0.8rem",
    color: T.muted,
    marginRight: "0.25rem",
  },
  usersNames: {
    fontSize: "0.85rem",
    color: T.text,
  },
  messagesBox: {
    height: "400px",
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  message: {
    color: T.text,
    fontSize: "0.95rem",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  muted: {
    color: T.muted,
    fontSize: "0.85rem",
  },
  inputRow: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderTop: `1px solid ${T.border}`,
    backgroundColor: T.surface,
  },
  /* shared */
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${T.border}`,
    backgroundColor: T.bg,
    color: T.text,
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    padding: "8px 16px",
    background: T.accent,
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  error: {
    color: T.error,
    fontSize: "0.85rem",
  },
};
