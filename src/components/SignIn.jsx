const INK = "#111111", SOFT = "#6B6B5E", Y = "#FFE500";

const MESSAGES = {
  expired: "That sign-in attempt timed out. Please try again.",
  failed: "Sign-in could not be completed. Please try again.",
};

export default function SignIn({ error }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: INK,
        color: "#fff",
        fontFamily: "'Georgia','Times New Roman',serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 44, letterSpacing: -1, marginBottom: 8 }}>
        NAI<span style={{ color: Y }}>:</span>Eve
      </div>
      <p style={{ color: SOFT, maxWidth: 380, lineHeight: 1.6, marginBottom: 28 }}>
        Sign in with your Columbia account to continue.
      </p>

      {error && (
        <p
          role="alert"
          style={{ color: Y, maxWidth: 380, lineHeight: 1.6, marginBottom: 20, fontSize: 14 }}
        >
          {MESSAGES[error] ?? MESSAGES.failed}
        </p>
      )}

      <a
        href="/api/auth/login"
        style={{
          display: "inline-block",
          background: Y,
          color: INK,
          fontWeight: 700,
          fontSize: 15,
          padding: "13px 26px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        Sign in
      </a>
    </div>
  );
}
