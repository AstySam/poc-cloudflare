import { CSSProperties, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authClient } from '@/utils/auth-client';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div style={s.center}>
        <div style={s.spinner} aria-label="Chargement…" />
      </div>
    );
  }

  if (!session) {
    console.warn("[ProtectedRoute] No session — redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const s: Record<string, CSSProperties> = {
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
  },
  spinner: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    border: "3px solid #2a2a2a",
    borderTopColor: "#0070f3",
    animation: "spin 0.75s linear infinite",
  },
};
