import ReviewForm from "./components/review-form";

export default function Home() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#101010" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 56,
          minWidth: 56,
          borderRight: "1px solid #252525",
          background: "#141414",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 16,
          paddingBottom: 16,
          gap: 8,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6096ff 0%, #02c598 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>

        {/* Nav icons */}
        <NavIcon active>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </NavIcon>
        <NavIcon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </NavIcon>
        <NavIcon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </NavIcon>

        <div style={{ flex: 1 }} />

        {/* Bottom icon */}
        <NavIcon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </NavIcon>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <ReviewForm />
      </main>
    </div>
  );
}

function NavIcon({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#f2f2f2" : "#8f8f8f",
        background: active ? "#252525" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </div>
  );
}
