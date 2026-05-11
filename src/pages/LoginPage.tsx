import { CSSProperties, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from '@/utils/auth-client';

/* ── dark theme tokens ─────────────────────────────── */
const T = {
  bg: "#0f0f0f",
  surface: "#1a1a1a",
  border: "#2a2a2a",
  text: "#efefef",
  muted: "#9ca3af",
  accent: "#0070f3",
  error: "#f87171",
} as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log("[LoginPage] Submitting email sign-in — email:", email);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    const { error: signInError } = result;

    setLoading(false);

    if (signInError) {
      console.error("[LoginPage] Email sign-in failed:", {
        status: signInError.status,
        code: signInError.code,
        message: signInError.message,
      });
      setError(signInError.message ?? "Sign in failed. Please try again.");
      return;
    }

    console.log("[LoginPage] Email sign-in succeeded — redirecting to /chat");
    navigate("/chat");
  }

  async function handleGitHub() {
    setError(null);
    setSocialLoading(true);

    console.log("[LoginPage] Starting GitHub OAuth flow");

    const result = await authClient.signIn.social({
      provider: "github",
      callbackURL: "http://localhost:3000/chat",
    });

    const { error: socialError } = result;

    setSocialLoading(false);

    if (socialError) {
      console.error("[LoginPage] GitHub sign-in failed:", {
        status: socialError.status,
        code: socialError.code,
        message: socialError.message,
      });
      setError(
        socialError.message ?? "GitHub sign in failed. Please try again.",
      );
    } else {
      console.log("[LoginPage] GitHub OAuth redirect initiated");
    }
  }

  const isDisabled = loading || socialLoading;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Connexion</h1>

        <form onSubmit={handleSubmit} noValidate>
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
              disabled={isDisabled}
            />
          </div>

          <div style={s.field}>
            <label htmlFor="password" style={s.label}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              disabled={isDisabled}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={s.btn} disabled={isDisabled}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.divLine} />
          <span style={s.divText}>ou</span>
          <span style={s.divLine} />
        </div>

        <button
          type="button"
          onClick={handleGitHub}
          style={{ ...s.btn, ...s.btnGhost }}
          disabled={isDisabled}
        >
          <GitHubIcon />
          {socialLoading ? "Redirection…" : "Continuer avec GitHub"}
        </button>

        <p style={s.footer}>
          Pas encore de compte ?{" "}
          <Link to="/register" style={s.link}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  btnGhost: {
    background: "#1f1f1f",
    border: `1px solid ${T.border}`,
    marginTop: "0",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "1.25rem 0",
  },
  divLine: {
    flex: 1,
    height: "1px",
    backgroundColor: T.border,
    display: "block",
  },
  divText: {
    fontSize: "0.75rem",
    color: "#6b7280",
    whiteSpace: "nowrap",
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
