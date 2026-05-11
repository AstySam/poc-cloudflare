import { CSSProperties, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from '@/utils/auth-client';

const T = {
  bg: "#0f0f0f",
  surface: "#1a1a1a",
  border: "#2a2a2a",
  text: "#efefef",
  muted: "#9ca3af",
  accent: "#0070f3",
  error: "#f87171",
} as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log(
      "[RegisterPage] Submitting sign-up — name:",
      name,
      "email:",
      email,
    );

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    const { error: signUpError } = result;

    setLoading(false);

    if (signUpError) {
      console.error("[RegisterPage] Sign-up failed:", {
        status: signUpError.status,
        code: signUpError.code,
        message: signUpError.message,
      });
      setError(signUpError.message ?? "Registration failed. Please try again.");
      return;
    }

    console.log("[RegisterPage] Sign-up succeeded — redirecting to /login");
    navigate("/login");
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Créer un compte</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div style={s.field}>
            <label htmlFor="name" style={s.label}>
              Nom
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={s.input}
              disabled={loading}
            />
          </div>

          <div style={s.field}>
            <label htmlFor="email" style={s.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              disabled={loading}
            />
          </div>

          <div style={s.field}>
            <label htmlFor="password" style={s.label}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              disabled={loading}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p style={s.footer}>
          Déjà un compte ?{" "}
          <Link to="/login" style={s.link}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.bg,
    padding: "1rem",
  },
  card: {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    padding: "2rem",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
    color: T.text,
    textAlign: "center",
  },
  field: {
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: T.muted,
  },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${T.border}`,
    backgroundColor: T.bg,
    color: T.text,
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  error: {
    color: T.error,
    fontSize: "0.85rem",
    marginBottom: "0.75rem",
  },
  btn: {
    width: "100%",
    padding: "8px 16px",
    background: T.accent,
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  footer: {
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: "#6b7280",
    textAlign: "center",
  },
  link: {
    color: T.accent,
    textDecoration: "none",
    fontWeight: 500,
  },
};
