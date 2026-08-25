const INK = "#111111", SOFT = "#6B6B5E";

// Plain HTML form, no client JS: the POST hits the logout route handler, which
// clears the cookie and redirects on to Keycloak's end-session endpoint.
export default function SessionBar({ username }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 12,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "'Georgia','Times New Roman',serif",
        fontSize: 11,
        color: SOFT,
        background: "rgba(250,250,247,0.92)",
        border: "1px solid #e5e5e0",
        borderRadius: 8,
        padding: "5px 8px",
      }}
    >
      {username && <span>{username}</span>}
      <form action="/api/auth/logout" method="post" style={{ margin: 0 }}>
        <button
          type="submit"
          style={{
            fontFamily: "inherit",
            fontSize: 11,
            fontWeight: 700,
            color: INK,
            background: "transparent",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "3px 8px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
