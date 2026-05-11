import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from '@/utils/auth-client';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    console.log(
      "[DashboardPage] Session state — isPending:",
      isPending,
      "session:",
      session,
    );
    if (!isPending && !session) {
      console.warn("[DashboardPage] No active session — redirecting to /login");
      navigate("/login", { replace: true });
    }
  }, [isPending, session, navigate]);

  if (isPending) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} aria-label="Loading" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  async function handleSignOut() {
    console.log("[DashboardPage] Signing out");
    const { error } = await authClient.signOut();
    if (error) {
      console.error("[DashboardPage] Sign-out error:", error);
    } else {
      console.log("[DashboardPage] Sign-out succeeded — redirecting to /login");
    }
    navigate("/login", { replace: true });
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.greeting}>Hello, {session.user.name} 👋</h1>
        <p style={styles.email}>{session.user.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          style={styles.signOutButton}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    border: "3px solid #e5e7eb",
    borderTopColor: "#2563eb",
    animation: "spin 0.75s linear infinite",
  },
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "0.75rem",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    padding: "2rem",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  greeting: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "0.5rem",
  },
  email: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginBottom: "1.5rem",
  },
  signOutButton: {
    padding: "0.625rem 1.5rem",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.375rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
