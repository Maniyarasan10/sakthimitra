import { useState, useEffect, useRef } from "react";
import { apiFetch } from "./api.js";
import DeviceSettings from "./DeviceSettings.jsx";

// ─── THEME & CONSTANTS ────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0a10",
  surface: "#12121c",
  card: "#1a1a28",
  cardHover: "#22223a",
  border: "#2a2a42",
  accent: "#7c3aed",
  accentLight: "#9f5ff1",
  accentGlow: "rgba(124,58,237,0.25)",
  green: "#10b981",
  greenGlow: "rgba(16,185,129,0.2)",
  orange: "#f59e0b",
  pink: "#ec4899",
  blue: "#3b82f6",
  textPrimary: "#f0f0ff",
  textSecondary: "#8888aa",
  textMuted: "#55556a",
};

const css = (strings, ...vals) => strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ""), "");

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", fill = "none", style = {} }) => {
  const paths = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    dumbbell: <path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7" />,
    salad: <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />,
    chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
    robot: <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></>,
    sparkles: <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />,
    sun: <><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
    user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
    cake: <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 11V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />,
    ruler: <path d="M2 12h20M2 12l4-4M2 12l4 4" />,
    scale: <path d="M12 3v18M6 8h12M6 8l-2 4h4l-2-4M18 8l-2 4h4l-2-4" />,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    fire: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3-1.1 1-2.2 1.5-3.3.5 1.1 1 2.2 1.5 3.3z" />,
    rocket: <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.1 2.1 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.94 5.25-2.81 7.11a22.35 22.35 0 0 1-4.19 2.19z" />,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    medal: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
    cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
    lightning: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    pencil: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
    camera: <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />,
    bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />,
    settings: <circle cx="12" cy="12" r="3" />,
    plane: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    cross: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>,
    play: <polygon points="5 3 19 12 5 21 5 3" />,
    pause: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    hospital: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    alert: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
    bandage: <path d="M10 2h4v20h-4zM2 10h20v4H2z" />,
    pill: <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />,
    flag: <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />,
    bluetooth: <path d="M7 7l10 5-10 5V7z M7 7l10 5-10 5" />,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {paths[name] || null}
    </svg>
  );
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${COLORS.bg}; color: ${COLORS.textPrimary}; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${COLORS.surface}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
    h1,h2,h3,h4,h5 { font-family: 'Syne', sans-serif; }
    button { cursor: pointer; border: none; outline: none; font-family: 'DM Sans', sans-serif; }
    input, textarea, select { font-family: 'DM Sans', sans-serif; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes glow { 0%,100% { box-shadow: 0 0 20px ${COLORS.accentGlow}; } 50% { box-shadow: 0 0 40px rgba(124,58,237,0.4); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .fadeUp { animation: fadeUp 0.5s ease both; }
    .glow { animation: glow 3s ease-in-out infinite; }
  `}</style>
);

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", style = {}, disabled }) => {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 12, fontWeight: 600, transition: "all 0.2s", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontSize: size === "sm" ? 13 : size === "lg" ? 17 : 15,
    padding: size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px",
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`, color: "#fff", boxShadow: `0 4px 20px ${COLORS.accentGlow}` },
    ghost: { background: "transparent", color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
    green: { background: `linear-gradient(135deg, #059669, ${COLORS.green})`, color: "#fff", boxShadow: `0 4px 20px ${COLORS.greenGlow}` },
    danger: { background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff" },
    surface: { background: COLORS.card, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Card = ({ children, style = {}, glow }) => (
  <div style={{
    background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16,
    padding: 24, transition: "all 0.3s", ...(glow ? { boxShadow: `0 0 30px ${COLORS.accentGlow}` } : {}), ...style,
  }}>{children}</div>
);

const Badge = ({ children, color = COLORS.accent }) => (
  <span style={{
    background: color + "22", color, fontSize: 11, fontWeight: 700, padding: "4px 10px",
    borderRadius: 100, border: `1px solid ${color}44`, letterSpacing: 0.5, textTransform: "uppercase",
  }}>{children}</span>
);

const ProgressBar = ({ value, max = 100, color = COLORS.accent, height = 6 }) => (
  <div style={{ background: COLORS.border, borderRadius: height, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min((value / max) * 100, 100)}%`, height: "100%",
      background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: height, transition: "width 0.8s ease",
    }} />
  </div>
);

const StatCard = ({ label, value, icon, color = COLORS.accent, delta }) => (
  <Card style={{ textAlign: "center" }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne", color }}>{value}</div>
    <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{label}</div>
    {delta && <div style={{ fontSize: 12, color: COLORS.green, marginTop: 4 }}>↑ {delta}</div>}
  </Card>
);

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const Navbar = ({ page, setPage, user, darkMode, setDarkMode, setUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = user
    ? [
        { id: "dashboard", label: "Dashboard", icon: <Icon name="home" size={16} /> },
        { id: "workouts", label: "Workouts", icon: <Icon name="dumbbell" size={16} /> },
        { id: "nutrition", label: "Nutrition", icon: <Icon name="salad" size={16} /> },
        { id: "progress", label: "Progress", icon: <Icon name="chart" size={16} /> },
        { id: "coach", label: "AI Coach", icon: <Icon name="robot" size={16} /> },
        { id: "devices", label: "Devices", icon: <Icon name="settings" size={16} /> },
      ]
    : [];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: COLORS.surface + "ee", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div onClick={() => setPage(user ? "dashboard" : "home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="sparkles" size={18} color="#fff" /></div>
          <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>ArogyaMitra</span>
        </div>
        {user && (
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                background: page === item.id ? COLORS.accentGlow : "transparent",
                border: "none", color: page === item.id ? COLORS.accentLight : COLORS.textSecondary,
                padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
              }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setDarkMode(!darkMode)} style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8,
          padding: "6px 12px", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center"
        }}>{darkMode ? <Icon name="sun" size={18} /> : <Icon name="moon" size={18} />}</button>
        {user ? (
          <>
            <div onClick={() => setPage("profile")} style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "6px 14px",
            }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                {user.name?.[0] || "U"}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</span>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => { setUser(null); localStorage.removeItem('auth_token'); setPage("home"); }} style={{ fontSize: 13 }}>Logout</Btn>
          </>
        ) : (
          <>
            <Btn variant="ghost" size="sm" onClick={() => setPage("login")}>Login</Btn>
            <Btn size="sm" onClick={() => setPage("register")}>Get Started</Btn>
          </>
        )}
      </div>
    </nav>
  );
};

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage = ({ setPage }) => {
  const features = [
    { icon: <Icon name="robot" size={28} />, title: "AI-Powered Plans", desc: "Personalized workout and nutrition plans generated by Groq LLaMA-3.3-70B advanced AI" },
    { icon: <Icon name="calendar" size={28} />, title: "Smart Scheduling", desc: "Automatic Google Calendar integration for seamless plan management" },
    { icon: <Icon name="target" size={28} />, title: "Goal Tracking", desc: "Track your progress with detailed analytics and achievement badges" },
    { icon: <Icon name="heart" size={28} />, title: "Charity Impact", desc: "Turn your fitness journey into charitable donations automatically" },
  ];
  const stats = [
    { val: "10K+", label: "Active Users" }, { val: "50K+", label: "Workouts Completed" },
    { val: "₹2L+", label: "Raised for Charity" }, { val: "95%", label: "Success Rate" },
  ];
  const reviews = [
    { text: "ArogyaMitra transformed my fitness journey! The AI plans are spot-on and the charity aspect keeps me motivated.", name: "Priya Sharma", role: "Software Engineer" },
    { text: "Love how it syncs with my Google Calendar. Never miss a workout now!", name: "Rahul Kumar", role: "Student" },
    { text: "The nutrition plans are scientifically sound and easy to follow. Highly recommended!", name: "Anita Patel", role: "Doctor" },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingTop: 64 }}>
      {/* Hero */}
      <section style={{
        position: "relative", padding: "100px 24px 80px", textAlign: "center",
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${COLORS.accentGlow} 0%, transparent 70%)`,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `repeating-linear-gradient(0deg, ${COLORS.textPrimary} 0, ${COLORS.textPrimary} 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, ${COLORS.textPrimary} 0, ${COLORS.textPrimary} 1px, transparent 1px, transparent 60px)`,
        }} />
        <div style={{ marginBottom: 16, animation: "float 4s ease-in-out infinite" }}><Icon name="sparkles" size={48} color={COLORS.accent} /></div>
        <h1 style={{ fontFamily: "Syne", fontSize: "clamp(40px,6vw,72px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
          Your <span style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Fitness</span>
          <br />Companion
        </h1>
        <p style={{ fontSize: 18, color: COLORS.textSecondary, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Transform your health journey with personalized AI-powered workout plans, nutrition guidance, and automatic charity donations.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn size="lg" onClick={() => setPage("register")} style={{ animation: "glow 3s infinite", gap: 12 }}>
            Start Free Journey <Icon name="arrowRight" size={18} />
          </Btn>
          <Btn variant="ghost" size="lg" onClick={() => setPage("login")}>Already a Member?</Btn>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 64, flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "20px 32px", minWidth: 140,
            }}>
              <div style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, color: COLORS.accentLight }}>{s.val}</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontFamily: "Syne", fontSize: 40, fontWeight: 800, marginBottom: 12 }}>
          Why Choose <span style={{ color: COLORS.accentLight }}>ArogyaMitra?</span>
        </h2>
        <p style={{ textAlign: "center", color: COLORS.textSecondary, marginBottom: 48, fontSize: 16 }}>
          Experience the future of fitness with our AI-powered platform that adapts to your lifestyle
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <Card key={i} style={{ textAlign: "center", animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                background: `linear-gradient(135deg, ${COLORS.accent}33, ${COLORS.pink}33)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding: "80px 24px", background: COLORS.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontFamily: "Syne", fontSize: 40, fontWeight: 800, marginBottom: 8 }}>
            What Our <span style={{ color: COLORS.accentLight }}>Users Say</span>
          </h2>
          <p style={{ textAlign: "center", color: COLORS.textSecondary, marginBottom: 48 }}>Join thousands of satisfied users who transformed their lives</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
            {reviews.map((r, i) => (
              <Card key={i}>
                <div style={{ color: COLORS.orange, marginBottom: 12, display: "flex", gap: 2 }}>{[1,2,3,4,5].map(s => <Icon key={s} name="star" size={16} fill={COLORS.orange} color={COLORS.orange} />)}</div>
                <p style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>"{r.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{r.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{r.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <Card style={{ maxWidth: 600, margin: "0 auto", padding: "48px 40px", background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.surface})` }}>
          <h2 style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Ready to Transform Your Life?</h2>
          <p style={{ color: COLORS.textSecondary, marginBottom: 32 }}>Join ArogyaMitra today and start your personalized fitness journey with AI guidance</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <Btn size="lg" onClick={() => setPage("register")}>Start Your Journey <Icon name="sparkles" size={18} /></Btn>
            <Btn variant="ghost" size="lg" onClick={() => setPage("login")}>Already a Member? <Icon name="arrowRight" size={18} /></Btn>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", color: COLORS.green, fontSize: 13, flexWrap: "wrap" }}>
            {[ "Free to start", "No credit card required", "Cancel anytime" ].map(t => <span key={t} style={{display:"flex", alignItems:"center", gap:6}}><Icon name="check" size={14} /> {t}</span>)}
          </div>
        </Card>
      </section>
    </div>
  );
};

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
const AuthPage = ({ mode, setPage, setUser }) => {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", fullName: "", age: "", gender: "", height: "", weight: "" });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!form.username || !form.password) { setError("Please fill required fields."); return; }
    // Client-side validation to avoid backend 422 errors
    if ((form.username || "").trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    if ((form.password || "").length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "register" && form.password !== form.confirmPassword) { setError("Passwords don't match."); return; }
    if (mode === "register" && form.email) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(form.email)) { setError("Please enter a valid email address."); return; }
    }

    (async () => {
      try {
        if (mode === "register") {
          const payload = {
            username: form.username,
            email: form.email || form.username,
            password: form.password,
            full_name: form.fullName || form.username,
            age: Number(form.age) || 30,
            gender: form.gender || 'Male',
            height: Number(form.height) || 170,
            weight: Number(form.weight) || 70,
            fitness_level: form.fitness_level || 'beginner',
            fitness_goal: form.fitness_goal || 'general_fitness',
          };
          const res = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
          if (res && res.access_token) {
            localStorage.setItem('auth_token', res.access_token);
            const me = res.user;
            const mapped = { name: me.full_name || me.username, username: me.username, email: me.email, age: me.age, gender: me.gender, height: me.height_cm, weight: me.weight_kg, fitness_level: me.fitness_level, fitness_goal: me.fitness_goal };
            setUser(mapped);
            setPage('dashboard');
            return;
          } else {
            setError('Registration failed');
            return;
          }
        } else {
          // login
          const payload = { username: form.username, password: form.password };
          const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
          if (res && res.access_token) {
            localStorage.setItem('auth_token', res.access_token);
            const me = res.user;
            const mapped = { name: me.full_name || me.username, username: me.username, email: me.email, age: me.age, gender: me.gender, height: me.height_cm, weight: me.weight_kg, fitness_level: me.fitness_level, fitness_goal: me.fitness_goal };
            setUser(mapped);
            setPage('dashboard');
            return;
          } else if (res && res.detail) {
            setError(res.detail);
            return;
          } else {
            setError('Login failed');
            return;
          }
        }
      } catch (err) {
        setError(err.message || String(err));
      }
    })();
  };

  const Input = ({ placeholder, type = "text", field, icon }) => {
    const autoComplete = type === 'email' ? 'email' : (field.toLowerCase().includes('password') ? (mode === 'login' ? 'current-password' : 'new-password') : (field === 'username' ? 'username' : undefined));
    const ref = useRef(null);
    const [local, setLocal] = useState(form[field] ?? "");

    useEffect(() => {
      setLocal(form[field] ?? "");
    }, [form[field]]);

    const handleChange = (value) => {
      setLocal(value);
      setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div
        style={{ position: "relative" }}
        onClick={() => { if (ref.current) { ref.current.focus(); } }}
      >
        <div aria-hidden style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.5, display: "flex", pointerEvents: "none", userSelect: "none" }}>{icon}</div>
        <input
          ref={ref}
          name={field}
          aria-label={placeholder}
          type={type} placeholder={placeholder} value={local}
          autoComplete={autoComplete}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const container = e.target.closest('[data-form="auth-form"]');
              if (container) {
                const focusables = container.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
                const elements = Array.from(focusables);
                const idx = elements.indexOf(e.target);
                if (idx > -1 && idx < elements.length - 1) {
                  elements[idx + 1].focus();
                } else {
                  handleSubmit();
                }
              } else {
                handleSubmit();
              }
            }
          }}
          style={{
            position: "relative", zIndex: 1, width: "100%", padding: "12px 14px 12px 40px", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, color: COLORS.textPrimary, fontSize: 14, outline: "none", transition: "border 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = COLORS.accent; e.target.style.boxShadow = `0 4px 20px ${COLORS.accentGlow}`; }}
          onBlur={e => { e.target.style.borderColor = COLORS.border; e.target.style.boxShadow = "none"; }}
        />
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 64, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: COLORS.textSecondary, fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Icon name="arrowLeft" size={16} /> Back to Home</button>
        <Card style={{ padding: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="sparkles" size={28} color="#fff" /></div>
            <h2 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              {mode === "login" ? "Welcome Back!" : "Join ArogyaMitra!"}
            </h2>
            <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              {mode === "login" ? "Continue your fitness journey with ArogyaMitra" : "Start your AI-powered fitness journey today"}
            </p>
          </div>

          {mode === "login" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {["User Login", "Admin Login"].map((t, i) => (
                <button key={t} style={{
                  flex: 1, padding: "10px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer",
                  background: i === 0 ? COLORS.card : "transparent",
                  border: `1px solid ${i === 0 ? COLORS.accent : COLORS.border}`,
                  color: i === 0 ? COLORS.accentLight : COLORS.textSecondary,
                }}>{t}</button>
              ))}
            </div>
          )}

          <div data-form="auth-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && <Input placeholder="Full Name" field="fullName" icon={<Icon name="user" size={18} />} />}
            <Input placeholder={mode === "login" ? "Username or Email" : "Username"} field="username" icon={<Icon name="user" size={18} />} />
            {mode === "register" && <Input placeholder="Email Address" type="email" field="email" icon={<Icon name="mail" size={18} />} />}

            {mode === "register" && (
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Icon name="dumbbell" size={14} /> Personal Information (Optional)</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input placeholder="Age (e.g., 25)" type="number" field="age" icon={<Icon name="cake" size={18} />} />
                  <select name="gender" aria-label="Gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{
                    padding: "12px 14px", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    borderRadius: 10, color: form.gender ? COLORS.textPrimary : COLORS.textMuted, fontSize: 14,
                  }}>
                    <option value="">Select Gender</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  <Input placeholder="Height (cm)" type="number" field="height" icon={<Icon name="ruler" size={18} />} />
                  <Input placeholder="Weight (kg)" type="number" field="weight" icon={<Icon name="scale" size={18} />} />
                </div>
              </div>
            )}

            <Input placeholder="Password" type="password" field="password" icon={<Icon name="lock" size={18} />} />
            {mode === "register" && (
              <>
                <Input placeholder="Confirm Password" type="password" field="confirmPassword" icon={<Icon name="lock" size={18} />} />
                {form.password && (
                  <div>
                    <ProgressBar value={form.password.length} max={20} color={form.password.length > 12 ? COLORS.green : form.password.length > 8 ? COLORS.orange : "#ef4444"} />
                    <span style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, display: "block" }}>
                      {form.password.length > 12 ? "Strong" : form.password.length > 8 ? "Medium" : "Weak"}
                    </span>
                  </div>
                )}
              </>
            )}

            {error && <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{error}</div>}

            <Btn onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", padding: "14px" }}>
              {mode === "login" ? <><Icon name="arrowRight" size={18} /> Sign In</> : <><Icon name="user" size={18} /> Create My Account</>}
            </Btn>

            <p style={{ textAlign: "center", fontSize: 13, color: COLORS.textSecondary }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setPage(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: COLORS.accentLight, cursor: "pointer", fontWeight: 600 }}>
                {mode === "login" ? "Join here" : "Sign in here"}
              </button>
            </p>

            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                {[[<Icon name="robot" size={20} />, "AI Plans"], [<Icon name="calendar" size={20} />, "Auto Schedule"], [<Icon name="chart" size={20} />, "Progress Track"], [<Icon name="heart" size={20} />, "Charity Impact"]].map(([icon, label], i) => (
                  <div key={i} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, color: COLORS.textSecondary }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>{label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, setPage }) => {
  const quickActions = [
    { icon: <Icon name="heart" size={20} />, title: "Start Health Assessment", desc: "Get AI-powered personalized plans", link: "assessment", cta: "Get Started" },
    { icon: <Icon name="robot" size={20} />, title: "Ask AROMI Coach", desc: "Chat with your health companion", link: "coach", cta: "Connect Now" },
    { icon: <Icon name="chart" size={20} />, title: "Track Progress", desc: "Log your daily fitness metrics", link: "progress", cta: "Get Started" },
    { icon: <Icon name="chat" size={20} />, title: "AI Fitness Coach", desc: "Chat with your personal AI trainer", link: "coach", cta: "Get Started" },
  ];

  return (
    <div style={{ padding: "80px 24px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: 32, fontWeight: 800 }}>Welcome back, <span style={{ color: COLORS.accentLight }}>{user.name}!</span> 👋</h1>
          <p style={{ color: COLORS.textSecondary, marginTop: 4 }}>Ready to continue your fitness journey? Let's make today count! 💪</p>
        </div>
        <div style={{ animation: "float 3s ease-in-out infinite" }}><Icon name="fire" size={40} color={COLORS.orange} fill={COLORS.orange} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><Icon name="sparkles" size={18} /> Quick Actions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {quickActions.map((q, i) => (
                <Card key={i} style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => setPage(q.link)}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.accent}33, ${COLORS.pink}33)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{q.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{q.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 }}>{q.desc}</div>
                  <span style={{ fontSize: 13, color: COLORS.accentLight, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>{q.cta} <Icon name="arrowRight" size={14} /></span>
                </Card>
              ))}
            </div>
          </div>

          <Card style={{ background: `linear-gradient(135deg, ${COLORS.green}22, ${COLORS.card})`, border: `1px solid ${COLORS.green}44` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={20} color="#fff" /></div>
              <div>
                <div style={{ fontWeight: 600 }}>Google Calendar Connected</div>
                <div style={{ fontSize: 12, color: COLORS.green, display: "flex", alignItems: "center", gap: 4 }}><Icon name="mail" size={12} /> {user.email}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Your fitness plans will automatically sync to your Google Calendar!</div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="clock" size={18} />
              <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>Today's Remaining Tasks</h3>
            </div>
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ marginBottom: 12 }}><Icon name="rocket" size={40} color={COLORS.accent} /></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No plan created yet</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Start your fitness journey by completing health assessment!</div>
              <Btn size="sm" onClick={() => setPage("assessment")} style={{ marginTop: 16 }}>Start Assessment</Btn>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.surface})` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon name="heart" size={18} color={COLORS.pink} fill={COLORS.pink} />
                  <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>Charity Impact 💖</h3>
                </div>
                <p style={{ fontSize: 12, color: COLORS.textSecondary }}>Your fitness = Their health</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="medal" size={18} color="#fff" /></div>
            </div>

            <div style={{ background: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Amount Donated</div>
              <div style={{ fontFamily: "Syne", fontSize: 32, fontWeight: 800, color: COLORS.green }}>₹0</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>via your workouts & meals</div>
              <Badge color={COLORS.orange}>Level: Bronze</Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["People Impacted", "0"], ["Calories Burned", "0"], ["Workouts Done", "0"], ["Healthy Meals", "0"]].map(([label, val]) => (
                <div key={label} style={{ background: COLORS.surface, borderRadius: 10, padding: "12px" }}>
                  <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800 }}>{val}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
              🏋️ Workouts: ₹0 (₹5 each)&nbsp;&nbsp;🔥 Calories: ₹0 (₹1 per 10 cal)&nbsp;&nbsp;➤ Meals: ₹0 (₹2 each)
            </div>
            <Btn variant="ghost" style={{ width: "100%", justifyContent: "center" }} disabled>No Donation Available</Btn>
            <div style={{ marginTop: 12, fontSize: 12, color: COLORS.pink, textAlign: "center" }}>
              ✨ Keep going! Every calorie brings hope to someone in need! ❤️
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="calendar" size={18} />
              <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>Tomorrow's Schedule</h3>
            </div>
            <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.textSecondary }}>
              <div style={{ marginBottom: 8 }}><Icon name="calendar" size={36} /></div>
              <div>No schedule set</div>
              <button onClick={() => setPage("workouts")} style={{ background: "none", border: "none", color: COLORS.accentLight, cursor: "pointer", fontSize: 13, marginTop: 8 }}>Create your plan</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── HEALTH ASSESSMENT ────────────────────────────────────────────────────────
const HealthAssessment = ({ setPage }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);

  const questions = [
    { id: "age", label: "What is your age?", icon: <Icon name="cake" size={24} />, type: "number", placeholder: "e.g., 22" },
    { id: "gender", label: "What is your gender?", icon: <Icon name="user" size={24} />, type: "choice", options: ["Male", "Female", "Other"] },
    { id: "height", label: "What is your height (in cm)?", icon: <Icon name="ruler" size={24} />, type: "number", placeholder: "e.g., 170" },
    { id: "weight", label: "What is your weight (in kg)?", icon: <Icon name="scale" size={24} />, type: "number", placeholder: "e.g., 70" },
    { id: "fitness_level", label: "What is your current fitness level?", icon: <Icon name="dumbbell" size={24} />, type: "choice", options: ["Beginner", "Intermediate", "Advanced"] },
    { id: "goal", label: "What is your primary fitness goal?", icon: <Icon name="target" size={24} />, type: "choice", options: ["Weight Loss", "Muscle Gain", "General Fitness", "Strength Training", "Endurance"] },
    { id: "workout_place", label: "Where do you prefer to work out?", icon: <Icon name="home" size={24} />, type: "choice", options: ["Home", "Gym", "Outdoor", "Mixed"] },
    { id: "workout_time", label: "When do you prefer to work out?", icon: <Icon name="clock" size={24} />, type: "choice", options: ["Morning", "Evening"] },
    { id: "medical_history", label: "Do you have any medical history? (Optional)", icon: <Icon name="hospital" size={24} />, type: "text", placeholder: "e.g., Heart condition, Hypertension, etc." },
    { id: "health_conditions", label: "Do you have any current health conditions? (Optional)", icon: <Icon name="alert" size={24} />, type: "text", placeholder: "e.g., Diabetes, Asthma, Arthritis, etc." },
    { id: "injuries", label: "Any past or present injuries? (Optional)", icon: <Icon name="bandage" size={24} />, type: "text", placeholder: "e.g., Lower back pain, Knee injury, etc." },
    { id: "allergies", label: "Do you have any food allergies? (Optional)", icon: <Icon name="salad" size={24} />, type: "text", placeholder: "e.g., Peanuts, Dairy, Gluten, etc." },
    { id: "medications", label: "Are you taking any medications? (Optional)", icon: <Icon name="pill" size={24} />, type: "text", placeholder: "e.g., Blood pressure medication, etc." },
    { id: "calendar", label: "Would you like to sync your plan to Google Calendar?", icon: <Icon name="calendar" size={24} />, type: "calendar" },
  ];

  const q = questions[step];
  const progress = Math.round(((step + 1) / questions.length) * 100);

  const handleNext = () => {
    if (step < questions.length - 1) setStep(step + 1);
    else {
      setGenerating(true);
      setTimeout(() => { setGenerating(false); setPage("workouts"); }, 2500);
    }
  };

  if (generating) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: 24, animation: "spin 2s linear infinite" }}><Icon name="lightning" size={64} color={COLORS.accent} fill={COLORS.accent} /></div>
        <h2 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Generating Your Personalized Plan...</h2>
        <p style={{ color: COLORS.textSecondary }}>Our AI is crafting your perfect fitness journey</p>
        <div style={{ width: 200, margin: "24px auto 0" }}>
          <ProgressBar value={75} color={COLORS.accent} height={8} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, color: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}><Icon name="chart" size={28} /> Smart Fitness Planner</h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 6 }}>Answer a few questions to get your personalized plan</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: COLORS.textSecondary }}>
            <span>Question {step + 1} of {questions.length}</span>
            <span>{progress}% Complete</span>
          </div>
          <ProgressBar value={step + 1} max={questions.length} color={COLORS.accent} height={8} />
        </div>

        <Card style={{ padding: 32 }}>
          <h3 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
            <span style={{marginRight: 10, verticalAlign: "middle"}}>{q.icon}</span> {q.label}
          </h3>

          {q.type === "number" && (
            <input type="number" placeholder={q.placeholder} value={answers[q.id] || ""}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              style={{ width: "100%", padding: "14px 16px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, fontSize: 18, fontFamily: "Syne", outline: "none" }} />
          )}
          {q.type === "text" && (
            <textarea placeholder={q.placeholder} value={answers[q.id] || ""}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} rows={3}
              style={{ width: "100%", padding: "14px 16px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, fontSize: 14, outline: "none", resize: "none" }} />
          )}
          {q.type === "choice" && (
            <div style={{ display: "grid", gridTemplateColumns: q.options.length > 3 ? "1fr 1fr" : "1fr 1fr", gap: 12 }}>
              {q.options.map(opt => (
                <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })} style={{
                  padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  background: answers[q.id] === opt ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` : COLORS.surface,
                  border: `1px solid ${answers[q.id] === opt ? COLORS.accent : COLORS.border}`,
                  color: answers[q.id] === opt ? "#fff" : COLORS.textPrimary,
                }}>{opt}</button>
              ))}
            </div>
          )}
          {q.type === "calendar" && (
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>✓</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><Icon name="calendar" size={16} /> Automatically sync plans to my Google Calendar</div>
                  <div style={{ fontSize: 13, color: COLORS.green }}>✨ Your workout and nutrition schedule will be added to your Google Calendar for easy tracking</div>
                  <div style={{ fontSize: 12, color: COLORS.orange, marginTop: 6 }}>⚠️ Note: Make sure to connect your Google Calendar first from the Dashboard!</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <Btn variant="surface" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}>← Previous</Btn>
            <Btn onClick={handleNext}>
              {step === questions.length - 1 ? <span style={{display:"flex", alignItems:"center", gap:6}}>Generate Plan <Icon name="lightning" size={16} /></span> : "Next >"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── WORKOUT PLANS ────────────────────────────────────────────────────────────
const WorkoutPlans = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  const [workoutActive, setWorkoutActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const weekPlan = [
    { day: "Monday", focus: "Full Body Strength", duration: 45, exercises: 4, time: "6:00 AM - 7:00 AM", isToday: false },
    { day: "Tuesday", focus: "Cardio & Core", duration: 30, exercises: 3, time: "6:30 AM - 7:00 AM", isToday: false },
    { day: "Wednesday", focus: "Rest Day", duration: 0, exercises: 0, time: "", isToday: false, isRest: true },
    { day: "Thursday", focus: "Upper Body and Cardio", duration: 45, exercises: 3, time: "6:00 AM - 7:00 AM", isToday: true },
    { day: "Friday", focus: "Lower Body and Core", duration: 45, exercises: 3, time: "6:30 AM - 8:00 AM", isToday: false },
    { day: "Saturday", focus: "Back and Biceps", duration: 45, exercises: 4, time: "6:30 AM - 7:45 AM", isToday: false },
    { day: "Sunday", focus: "Cardio Day", duration: 40, exercises: 3, time: "7:00 AM - 7:40 AM", isToday: false },
  ];

  const todayExercises = [
    { id: 1, name: "Diamond Push-ups", sets: 3, reps: "12-15", rest: "60s", desc: "Start in a plank position with your hands closer together than shoulder-width apart, and your index fingers and thumbs forming a diamond shape, lower your body down until your chest almost touches the ground" },
    { id: 2, name: "Mountain Climbers", sets: 3, reps: "30-60 seconds", rest: "60s", desc: "Start in a plank position, bring one knee up towards your chest, then quickly switch to the other knee, mimicking the motion of running" },
    { id: 3, name: "Jumping Jacks", sets: 3, reps: "30-60 seconds", rest: "60s", desc: "Stand with your feet together, jump your feet out to the sides while raising your arms above your head, then quickly return to the starting position" },
  ];

  useEffect(() => {
    let interval;
    if (workoutActive) { interval = setInterval(() => setTimer(t => t + 1), 1000); }
    return () => clearInterval(interval);
  }, [workoutActive]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleComplete = () => {
    setWorkoutActive(false); setSelectedExercise(null); setShowComplete(true);
    setTimeout(() => setShowComplete(false), 4000);
  };

  return (
    <div style={{ padding: "80px 24px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {showComplete && (
        <div style={{
          position: "fixed", inset: 0, background: "#000a", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Card style={{ maxWidth: 480, width: "100%", textAlign: "center", padding: 48 }}>
            <div style={{ marginBottom: 16 }}><Icon name="sparkles" size={64} color={COLORS.orange} /></div>
            <h2 style={{ fontFamily: "Syne", fontSize: 32, fontWeight: 800, color: COLORS.accentLight, marginBottom: 8 }}>🏆 Workout Complete!</h2>
            <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Amazing effort today! You crushed it! 💪</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[[<Icon name="fire" size={20} />, "14", "Calories Burned"], [<Icon name="check" size={20} />, "3", "Sets Completed"], [<Icon name="dumbbell" size={20} />, timer > 0 ? Math.ceil(timer / 60) : "4", "Minutes Worked"], [<Icon name="rocket" size={20} />, "0%", "Average Intensity"]].map(([icon, val, label], i) => (
                <div key={i} style={{ background: COLORS.surface, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, color: COLORS.accentLight }}>{val}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>🏆 What You Achieved Today</div>
              {["Improved cardiovascular endurance", "Built muscle strength and tone", "Boosted metabolism for the day", "Enhanced energy levels", "Progressed towards your fitness goals"].map(a => (
                <div key={a} style={{ fontSize: 13, color: COLORS.green, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={12} /> {a}</div>
              ))}
            </div>
            <Btn style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #f59e0b, #f97316)" }} onClick={() => setShowComplete(false)}>Keep Going! <Icon name="rocket" size={16} /></Btn>
          </Card>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, color: COLORS.accentLight }}>💪 Workout Plans</h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>AI-powered personalized workout plans</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["today", "week"].map(t => (
            <Btn key={t} variant={activeTab === t ? "primary" : "surface"} size="sm" onClick={() => setActiveTab(t)}>
              {t === "today" ? <><Icon name="calendar" size={14} /> Today</> : <><Icon name="calendar" size={14} /> This Week</>}
            </Btn>
          ))}
        </div>
      </div>

      {activeTab === "today" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedExercise ? "1fr 1fr" : "1fr", gap: 24 }}>
          <div>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><Icon name="activity" size={20} /> Today's Workout <Icon name="dumbbell" size={18} /></h2>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Upper Body and Cardio</h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
                    <span style={{display:"flex", alignItems:"center", gap:4}}><Icon name="clock" size={13} /> 45 minutes</span><span style={{display:"flex", alignItems:"center", gap:4}}><Icon name="dumbbell" size={13} /> 3 exercises</span>
                  </div>
                  <Badge color={COLORS.orange}><span style={{display:"flex", alignItems:"center", gap:4}}><Icon name="clock" size={11} /> Recommended Time: 6:00 AM - 7:00 AM</span></Badge>
                </div>
                <Badge color={completedExercises[1] ? COLORS.green : "#ef4444"}>
                  {Object.keys(completedExercises).length > 0 ? "In Progress" : "Incomplete"}
                </Badge>
              </div>
              <div style={{ background: COLORS.surface, borderRadius: 10, padding: "12px 16px", marginTop: 16 }}>
                <span style={{ color: COLORS.orange, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Icon name="fire" size={13} /> Warm-up</span>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>5-minute jogging in place or jumping jacks</div>
              </div>
            </Card>

            {todayExercises.map(ex => (
              <Card key={ex.id} style={{ marginBottom: 16, cursor: "pointer", border: selectedExercise?.id === ex.id ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}` }}
                onClick={() => setSelectedExercise(ex)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, flex: 1 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", border: `2px solid ${completedExercises[ex.id] ? COLORS.green : COLORS.border}`,
                      background: completedExercises[ex.id] ? COLORS.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                    }}>{completedExercises[ex.id] ? <Icon name="check" size={12} color="#fff" /> : ""}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, textDecoration: completedExercises[ex.id] ? "line-through" : "none", color: completedExercises[ex.id] ? COLORS.textMuted : COLORS.textPrimary }}>{ex.name}</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <Badge color={COLORS.accent}>Sets: {ex.sets}</Badge>
                        <Badge color={COLORS.blue}>Reps: {ex.reps}</Badge>
                        <Badge color={COLORS.green}>Rest: {ex.rest}</Badge>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{ex.desc}</div>
                      {completedExercises[ex.id] && <div style={{ fontSize: 12, color: COLORS.green, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="check" size={12} /> Exercise completed</div>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedExercise(ex); }} style={{
                    width: 36, height: 36, borderRadius: "50%", background: COLORS.accent, border: "none", color: "#fff", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
                  }}><Icon name="play" size={16} fill="#fff" /></button>
                </div>
              </Card>
            ))}
          </div>

          {selectedExercise && (
            <div style={{ position: "sticky", top: 80 }}>
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "Syne", fontWeight: 700 }}>{selectedExercise.name}</h3>
                  <button onClick={() => setSelectedExercise(null)} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer" }}><Icon name="cross" size={20} /></button>
                </div>
                <div style={{ width: "100%", aspectRatio: "16/9", background: COLORS.surface, borderRadius: 10, overflow: "hidden", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSecondary }}>
                  <MiniTracker exercise={selectedExercise} />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Icon name="menu" size={12} /> Instructions</div>
                <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>{selectedExercise.desc}</p>

                {!workoutActive ? (
                  <Btn style={{ width: "100%", justifyContent: "center" }} onClick={() => setWorkoutActive(true)}><Icon name="play" size={16} /> Start Workout</Btn>
                ) : (
                  <Btn variant="danger" style={{ width: "100%", justifyContent: "center" }} onClick={() => setWorkoutActive(false)}><Icon name="pause" size={16} /> Pause Workout</Btn>
                )}
              </Card>

              <Card>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>📊 Workout Progress</div>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, color: COLORS.accentLight, animation: workoutActive ? "pulse 1s infinite" : "none" }}>
                    {formatTime(timer)}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Time Remaining</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[["3", "Sets Left", COLORS.accent], [selectedExercise.reps, "Reps/Set", COLORS.green], ["0", "Detected", COLORS.orange]].map(([val, label, color]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>
                  <span>Overall Progress</span><span>99%</span>
                </div>
                <ProgressBar value={99} color={COLORS.green} height={8} />

                <div style={{ marginTop: 16, background: COLORS.surface, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>💪 Pro Tips</div>
                  {["Keep consistent movement throughout", "Control the speed - don't rush", "Breathe in and out steadily", "The camera tracks your movements"].map(t => (
                    <div key={t} style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 3 }}>✓ {t}</div>
                  ))}
                </div>

                {workoutActive && (
                  <Btn variant="green" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={() => {
                    setCompletedExercises({ ...completedExercises, [selectedExercise.id]: true });
                    handleComplete();
                  }}><Icon name="check" size={16} /> Complete Exercise</Btn>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === "week" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {weekPlan.map((day, i) => (
            <Card key={day.day} style={{ border: day.isToday ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>
                      {day.isToday && <Icon name="star" size={16} fill={COLORS.accent} color={COLORS.accent} style={{marginRight: 6}} />}{day.day}
                    </span>
                    {day.isToday && <Badge color={COLORS.accent}>TODAY</Badge>}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: day.isRest ? COLORS.textSecondary : COLORS.textPrimary }}>{day.focus}</div>
                  {!day.isRest && (
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: COLORS.textSecondary }}>
                      <span style={{display:"flex", alignItems:"center", gap:4}}><Icon name="clock" size={13} /> {day.duration} min</span>
                      <span style={{display:"flex", alignItems:"center", gap:4}}><Icon name="dumbbell" size={13} /> {day.exercises} exercises</span>
                      {day.time && <Badge color={COLORS.orange}><span style={{display:"flex", alignItems:"center", gap:4}}><Icon name="clock" size={11} /> {day.time}</span></Badge>}
                    </div>
                  )}
                  {day.isRest && <Badge color={COLORS.green}>Rest Day</Badge>}
                </div>
                {!day.isRest && <button style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 12px", color: COLORS.textSecondary, cursor: "pointer" }}><Icon name="menu" size={14} /></button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── NUTRITION PLAN ───────────────────────────────────────────────────────────
const NutritionPlan = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [completedMeals, setCompletedMeals] = useState({});

  const todayMeals = [
    { id: "b", time: "7:00 AM", type: "Breakfast", icon: <Icon name="sun" size={16} />, name: "Dosa with Sambar and Coconut Chutney", calories: 350, ingredients: ["Dosa", "Sambar", "Coconut", "Chana", "Cumin", "Coriander"] },
    { id: "l", time: "12:30 PM", type: "Lunch", icon: <Icon name="sun" size={16} />, name: "Whole Wheat Roti with Paneer and Mixed Vegetables", calories: 450, ingredients: ["Whole Wheat Roti", "Paneer", "Onions", "Tomatoes", "Cumin", "Coriander", "Fenugreek"] },
    { id: "d", time: "7:30 PM", type: "Dinner", icon: <Icon name="moon" size={16} />, name: "Grilled Fish with Quinoa and Steamed Vegetables", calories: 400, ingredients: ["Fish", "Quinoa", "Broccoli", "Carrots", "Cumin", "Cardamom"] },
    { id: "s1", time: "", type: "Snack", icon: <Icon name="salad" size={16} />, name: "Cucumber and Tomato Salad", calories: 50, ingredients: [] },
    { id: "s2", time: "", type: "Snack", icon: <Icon name="salad" size={16} />, name: "Roasted Makhana", calories: 150, ingredients: [] },
  ];

  const weekDays = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekMeals = {
    Tuesday: [{ type: "Breakfast", name: "Idli with Sambar and Coconut Chutney", cal: 300 }, { type: "Lunch", name: "Whole Wheat Roti with Rajma and Mixed Vegetables", cal: 450 }, { type: "Dinner", name: "Grilled Fish with Brown Rice and Steamed Vegetables", cal: 400 }, { type: "Snack", name: "Roasted Chana", cal: 120 }],
    Wednesday: [{ type: "Breakfast", name: "Upma with Vegetables and Coconut", cal: 300 }, { type: "Lunch", name: "Brown Rice with Chole and Mixed Vegetables", cal: 500 }, { type: "Dinner", name: "Grilled Chicken with Roasted Vegetables and Brown Rice", cal: 400 }, { type: "Snack", name: "Fresh Fruit Juice", cal: 100 }, { type: "Snack2", name: "Roasted Moong Dal", cal: 120 }],
  };

  const shopping = ["Cumin (×20)", "Coriander (×12)", "Brown Rice (×8)", "Onions (×7)", "Tomatoes (×7)", "Fenugreek (×7)", "Broccoli (×7)", "Cardamom (×7)", "Coconut (×5)", "Carrots (×4)", "Chana (×4)", "Paneer (×3)", "Fish (×3)", "Quinoa (×3)"];

  return (
    <div style={{ padding: "80px 24px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}><Icon name="flag" size={28} /> <span style={{ color: COLORS.accentLight }}>Indian Nutrition Plans</span></h1>
        <p style={{ color: COLORS.textSecondary, marginTop: 4 }}>AI-powered traditional Indian meal planning for optimal nutrition 💚</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["today", <><Icon name="calendar" size={14} /> Today</>], ["week", <><Icon name="calendar" size={14} /> This Week</>], ["grocery", <><Icon name="cart" size={14} /> Shopping List</>]].map(([id, label]) => (
          <Btn key={id} variant={activeTab === id ? "primary" : "surface"} size="sm" onClick={() => setActiveTab(id)}>{label}</Btn>
        ))}
      </div>

      {activeTab === "today" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {todayMeals.map(meal => (
            <Card key={meal.id} style={{ border: completedMeals[meal.id] ? `1px solid ${COLORS.green}` : `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  {meal.time && <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><Icon name="clock" size={12} /> {meal.time}</div>}
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accentLight, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>{meal.icon} {meal.type}</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>{meal.name}</div>
                </div>
                <button onClick={() => setCompletedMeals({ ...completedMeals, [meal.id]: !completedMeals[meal.id] })} style={{
                  width: 28, height: 28, borderRadius: "50%", border: `2px solid ${completedMeals[meal.id] ? COLORS.green : COLORS.border}`,
                  background: completedMeals[meal.id] ? COLORS.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>{completedMeals[meal.id] ? <Icon name="check" size={14} color="#fff" /> : ""}</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                {[["Calories", meal.calories], ["Protein", "0g"], ["Carbs", "0g"], ["Fat", "0g"]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 700 }}>{val}</div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}</div>
                  </div>
                ))}
              </div>
              {meal.ingredients.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>Ingredients:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {meal.ingredients.map(ing => <Badge key={ing} color={COLORS.green}>{ing}</Badge>)}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeTab === "week" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {weekDays.map((day) => (
            <Card key={day} style={{ border: day === "Thursday" ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}` }}>
              <h3 style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                📅 {day} {day === "Thursday" && <Badge color={COLORS.green}>Today</Badge>}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {(weekMeals[day] || todayMeals.slice(0, 4).map(m => ({ type: m.type, name: m.name, cal: m.calories }))).map((m, i) => (
                  <div key={i} style={{ background: COLORS.surface, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, color: COLORS.accentLight, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>{[<Icon name="sun" size={12} />, <Icon name="sun" size={12} />, <Icon name="moon" size={12} />, <Icon name="salad" size={12} />][i] || <Icon name="salad" size={12} />} {m.type}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 4 }}><Icon name="fire" size={12} /> {m.cal} cal &nbsp; <Icon name="dumbbell" size={12} /> 0g</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "grocery" && (
        <Card>
          <h2 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}><Icon name="cart" size={20} /> Weekly Shopping List</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shopping.map(item => {
              const name = item.split(" (")[0];
              const qty = item.match(/×\d+/)?.[0] || "";
              return (
                <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: COLORS.surface, borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={12} color="#fff" /></div>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{qty}</span>
                    <a href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(name)}`} target="_blank" rel="noreferrer" style={{ background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Icon name="cart" size={12} /> Buy <Icon name="arrowRight" size={12} /></a>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── PROGRESS TRACKING ────────────────────────────────────────────────────────
// Lightweight SVG chart used for progress visualizations
const Chart = ({ data = [], labels = [], width = 640, height = 180, color = COLORS.accent }) => {
  const padX = 24;
  const padY = 16;
  const w = width;
  const h = height;
  const max = Math.max(...data, 1);
  const stepX = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const points = data.map((v, i) => `${padX + i * stepX},${h - padY - (v / max) * (h - padY * 2)}`);
  const poly = points.join(" ");
  return (
    <div style={{ width: w, overflow: "visible" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points={`${padX},${h - padY} ${poly} ${w - padX},${h - padY}`} fill="url(#g1)" opacity={0.9} />
        {data.map((v, i) => {
          const [cx, cy] = points[i].split(",");
          return <circle key={i} cx={Number(cx)} cy={Number(cy)} r={3} fill={color} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: COLORS.textSecondary, fontSize: 12, width: w - padX * 2, marginLeft: padX }}>
        {labels.map((l, i) => (<div key={i} style={{ textAlign: "center", minWidth: 24 }}>{l}</div>))}
      </div>
    </div>
  );
};

// Tracker component with day/week/month views and simple sample data
const Tracker = ({ exercise = null, small = false }) => {
  const [view, setView] = useState("week");

  // deterministic pseudo-random seed from exercise id or name
  const seed = (exercise && (exercise.id || exercise.name?.length)) || 7;
  const makeData = (n, seedVal) => {
    const arr = Array.from({ length: n }, (_, i) => {
      const base = Math.abs(Math.sin((i + seedVal) * 12.9898) * 43758.5453) % 1;
      return Math.round((base * 60) + (seedVal % 10));
    });
    return arr;
  };

  let data, labels;
  if (view === "day") {
    data = makeData(24, seed);
    labels = ["00h", "04h", "08h", "12h", "16h", "20h", "24h"];
  } else if (view === "month") {
    data = makeData(30, seed + 3);
    labels = ["W1", "W2", "W3", "W4", "W5"];
  } else {
    data = makeData(7, seed + 1);
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  const total = data.reduce((s, v) => s + v, 0);
  const avg = Math.round(total / data.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: small ? "center" : "stretch" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, width: "100%" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant={view === "day" ? "primary" : "surface"} size="sm" onClick={() => setView("day")}>Day</Btn>
          <Btn variant={view === "week" ? "primary" : "surface"} size="sm" onClick={() => setView("week")}>Week</Btn>
          <Btn variant={view === "month" ? "primary" : "surface"} size="sm" onClick={() => setView("month")}>Month</Btn>
        </div>
        <div style={{ textAlign: "right", color: COLORS.textSecondary, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: COLORS.accentLight }}>{avg}</div>
          <div style={{ fontSize: 11 }}>avg / session</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: small ? "8px 0" : "16px 0" }}>
        <Chart data={data} labels={labels} width={small ? 320 : 720} height={small ? 120 : 180} />
      </div>
    </div>
  );
};

// Compact tracker used inside exercise detail
const MiniTracker = ({ exercise }) => {
  return (
    <div style={{ width: "100%", padding: 12, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{exercise?.name || "Activity"} — Smart Tracking</div>
      <Tracker exercise={exercise} small={true} />
    </div>
  );
};
const ProgressTracking = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [btStatus, setBtStatus] = useState("No device connected");
  const [deviceName, setDeviceName] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [steps, setSteps] = useState(null);
  const [collectedData, setCollectedData] = useState({});

  useEffect(() => {
    let hrChar = null;
    let device = null;

    async function connectBluetooth() {
      if (!navigator.bluetooth) {
        setBtStatus("Web Bluetooth not supported in this browser");
        return;
      }
      try {
        setBtStatus("Requesting device...");
        device = await navigator.bluetooth.requestDevice({ filters: [{ services: ["heart_rate"] }], optionalServices: ["battery_service"] });
        setDeviceName(device.name || device.id);
        setBtStatus(`Connecting to ${device.name || device.id}...`);
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService("heart_rate");
        hrChar = await service.getCharacteristic("heart_rate_measurement");
        await hrChar.startNotifications();
        hrChar.addEventListener("characteristicvaluechanged", e => {
          const value = e.target.value;
          // parse heart rate per BLE spec (first byte flags)
          const flags = value.getUint8(0);
          let offset = 1;
          let hr = null;
          if (flags & 0x01) { // uint16
            hr = value.getUint16(offset, /*littleEndian=*/true);
            offset += 2;
          } else {
            hr = value.getUint8(offset);
            offset += 1;
          }
          setHeartRate(hr);
          setBtStatus(`Connected: ${device.name || device.id} — HR ${hr} bpm`);
          setCollectedData(d => ({ ...d, heart_rate: hr, device: device.name || device.id }));
        });

        device.addEventListener('gattserverdisconnected', () => {
          setBtStatus('Device disconnected');
          setDeviceName(null);
        });
      } catch (err) {
        setBtStatus('Bluetooth error: ' + (err.message || err));
      }
    }

    async function generatePlanHandler() {
      setBtStatus(prev => prev + ' · Generating plan...');
      const payload = {
        age: 30,
        gender: 'Male',
        height: 170,
        weight: 70,
        fitness_level: 'beginner',
        fitness_goal: 'general_fitness',
        // include device-collected metrics when available
        heart_rate_rest: collectedData.heart_rate || null,
        device: collectedData.device || null,
      };

      try {
        const res = await apiFetch('/api/workouts/generate', { method: 'POST', body: JSON.stringify(payload) });
        if (res && res.plan) {
          setBtStatus('Plan generated and saved to your account');
        } else if (res && res.message) {
          setBtStatus('Plan generation: ' + res.message);
        } else {
          setBtStatus('Plan generated (no detail).');
        }
      } catch (err) {
        // Fallback local heuristic plan (quick client-side plan)
        setBtStatus('Could not reach server, creating local plan...');
        const localPlan = {
          plan_title: 'Local Quick Plan',
          plan_description: 'Generated locally from device metrics',
          weekly_schedule: { Monday: { focus: 'Full Body', is_rest_day: false } },
        };
        setCollectedData(d => ({ ...d, local_plan: localPlan }));
      }
    }

    function onConnectEvent() { connectBluetooth(); }
    function onGenerateEvent() { generatePlanHandler(); }

    window.addEventListener('connect-bluetooth', onConnectEvent);
    window.addEventListener('generate-plan', onGenerateEvent);

    return () => {
      window.removeEventListener('connect-bluetooth', onConnectEvent);
      window.removeEventListener('generate-plan', onGenerateEvent);
      if (hrChar) {
        try { hrChar.stopNotifications(); } catch (e) {}
      }
    };
  }, [collectedData]);
  const achievements = [
    { icon: <Icon name="user" size={28} />, title: "First Step", desc: "Complete your first workout", progress: 100, pts: "+10 pts", done: true },
    { icon: <Icon name="dumbbell" size={28} />, title: "Workout Warrior", desc: "Complete 5 workouts", progress: 20 },
    { icon: <Icon name="dumbbell" size={28} />, title: "Beast Mode", desc: "Complete 10 workouts", progress: 10 },
    { icon: <Icon name="salad" size={28} />, title: "Nutrition Ninja", desc: "Track 5 meals", progress: 0 },
    { icon: <Icon name="lightning" size={28} />, title: "Exercise Excellence", desc: "Complete 25 exercises", progress: 40 },
    { icon: <Icon name="fire" size={28} />, title: "Fire Starter", desc: "Burn 500 calories", progress: 6 },
    { icon: <Icon name="fire" size={28} />, title: "Fire Master", desc: "Burn 1000 calories", progress: 3 },
    { icon: <Icon name="calendar" size={28} />, title: "Consistency Counts", desc: "Achieve 3-day streak", progress: 33 },
    { icon: <Icon name="medal" size={28} />, title: "Streak King", desc: "Achieve 7-day streak", progress: 14 },
    { icon: <Icon name="scale" size={28} />, title: "Weight Loss Winner", desc: "Lose 2kg", progress: 0 },
    { icon: <Icon name="sparkles" size={28} />, title: "Major Transformation", desc: "Lose 5kg", progress: 0 },
  ];

  const stats = [
    { icon: <Icon name="chart" size={20} />, label: "Total Workouts", value: "0", delta: "0%", color: COLORS.accent },
    { icon: <Icon name="scale" size={20} />, label: "Weight Loss", value: "0 kg", delta: "0%", color: COLORS.green },
    { icon: <Icon name="fire" size={20} />, label: "Calories Burned", value: "28", delta: "10%", color: COLORS.orange },
    { icon: <Icon name="target" size={20} />, label: "BMI", value: "27.7", delta: "0%", color: COLORS.blue },
  ];

  return (
    <div style={{ padding: "80px 24px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}><Icon name="chart" size={28} /> <span style={{ color: COLORS.accentLight }}>Progress Tracking</span></h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>Monitor your fitness journey with detailed analytics</p>
        </div>
        <select style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, padding: "8px 16px", borderRadius: 10, fontSize: 14 }}>
          <option>Last Month</option><option>Last Week</option><option>Last 3 Months</option><option>Last Year</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["overview", <><Icon name="chart" size={14} /> Overview</>], ["workouts", <><Icon name="dumbbell" size={14} /> Workouts</>], ["nutrition", <><Icon name="salad" size={14} /> Nutrition</>], ["body", <><Icon name="target" size={14} /> Body Metrics</>], ["achievements", <><Icon name="medal" size={14} /> Achievements</>]].map(([id, label]) => (
          <Btn key={id} variant={activeTab === id ? "primary" : "surface"} size="sm" onClick={() => setActiveTab(id)}>{label}</Btn>
        ))}
      </div>

      {/* Device management moved to dedicated Devices page (Device Settings) */}

      {activeTab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 24 }}>
            {stats.map(s => (
              <Card key={s.label}>
                <div style={{ display: "flex", justify: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 2 }}><Icon name="arrowRight" size={12} style={{transform:'rotate(90deg)'}} /> {s.delta}</span>
                </div>
                <div style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{s.label}</div>
              </Card>
            ))}
          </div>
          <Card style={{ textAlign: "center", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ marginRight: 8 }}><Icon name="chart" size={40} color={COLORS.accent} /></div>
                <div>
                  <h3 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Personalized Smart Tracking</h3>
                  <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Toggle between Day / Week / Month to view your performance trends</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, color: COLORS.accentLight }}>Avg {" "} <span style={{ color: COLORS.textPrimary }}> {"20"} </span></div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>avg / session</div>
                </div>
              </div>
            </div>
            <Tracker />
          </Card>
        </>
      )}

      {activeTab === "achievements" && (
        <>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18 }}>🏆 Achievement Progress</h2>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: COLORS.accent }}>1/11</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Achievements Unlocked</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>
              <span>Overall Completion</span><span>1%</span>
            </div>
            <ProgressBar value={1} color={COLORS.accent} height={8} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {achievements.map((a, i) => (
              <Card key={i} style={{ border: a.done ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`, background: a.done ? `linear-gradient(135deg, ${COLORS.accent}22, ${COLORS.card})` : COLORS.card, position: "relative" }}>
                {a.pts && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 12, color: COLORS.green, fontWeight: 700 }}>{a.pts}</div>}
                <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 4, color: a.done ? COLORS.accentLight : COLORS.textPrimary }}>{a.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>{a.desc}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>
                  <span>Progress</span><span>{a.progress}%</span>
                </div>
                <ProgressBar value={a.progress} color={a.done ? COLORS.accent : COLORS.textMuted} height={6} />
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{a.progress}% complete</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {(activeTab === "workouts" || activeTab === "nutrition" || activeTab === "body") && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ marginBottom: 16 }}><Icon name="chart" size={48} color={COLORS.accent} /></div>
          <h3 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Data Yet</h3>
          <p style={{ color: COLORS.textSecondary }}>Complete workouts and track meals to see your {activeTab} analytics here.</p>
        </Card>
      )}
    </div>
  );
};

// ─── AI COACH PAGE ────────────────────────────────────────────────────────────
const AICoachPage = ({ user }) => {
  const [messages, setMessages] = useState([
    { id: 1, from: "ai", text: "Hi there! I'm your AI fitness coach. I'm here to help you with workout plans, nutrition advice, and motivation. What would you like to know?", time: "03:41 PM" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const suggestions = ["What's a good morning routine?", "How many calories should I eat?", "Suggest a travel workout", "Help me with muscle gain"];

  const aiRespondFallback = (userMsg) => {
    const responses = {
      default: "Great question! I'm analyzing your profile to give you the best personalized advice. Based on your fitness level and goals, I recommend staying consistent with your training and nutrition plan. Remember: Progress, not perfection! Keep going!",
    };
    setMessages(prev => [...prev, { id: Date.now(), from: "ai", text: responses.default, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setLoading(false);
  };

  const send = async (text) => {
    const t = text || input;
    if (!t.trim()) return;
    const userMsg = { id: Date.now(), from: "user", text: t, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
      const payload = { message: t, history };
      const res = await apiFetch('/api/coach/chat', { method: 'POST', body: JSON.stringify(payload) });
      if (res && res.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'ai', text: res.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } else {
        aiRespondFallback(t);
      }
    } catch (err) {
      console.error('Chat error', err);
      aiRespondFallback(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  return (
    <div style={{ padding: "80px 24px 24px", maxWidth: 800, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}><Icon name="robot" size={28} /> <span style={{ color: COLORS.accentLight }}>AI Fitness Coach</span></h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>Your personal AI trainer is here to help 24/7</p>
      </div>

      <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map(m => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", gap: 10 }}>
              {m.from === "ai" && (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.green})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="robot" size={18} color="#fff" /></div>
              )}
              <div style={{
                maxWidth: "70%", padding: "12px 16px", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.from === "user" ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` : COLORS.surface,
                color: COLORS.textPrimary, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line",
              }}>
                {m.text}
                <div style={{ fontSize: 10, color: m.from === "user" ? "#ffffff88" : COLORS.textMuted, marginTop: 4 }}>{m.time}</div>
              </div>
              {m.from === "user" && (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {user?.name?.[0] || "U"}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.green})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="robot" size={18} color="#fff" /></div>
              <div style={{ background: COLORS.surface, padding: "12px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, animation: `pulse 1.4s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: "12px 24px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "6px 14px",
                fontSize: 12, color: COLORS.textSecondary, cursor: "pointer", transition: "all 0.2s",
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask me anything about fitness, nutrition, or wellness..."
              style={{ flex: 1, padding: "12px 16px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, color: COLORS.textPrimary, fontSize: 14, outline: "none" }} />
            <button onClick={() => send()} style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plane" size={18} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── AROMI FLOATING WIDGET ────────────────────────────────────────────────────
const AROMIWidget = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "ai", text: "Namaste! I'm AROMI, your personal health companion powered by ArogyaMitra! I have access to your personalized workout and nutrition plans. Tell me about your day, ask about your scheduled workouts and meals, or let me know if you're traveling - I'll help adjust your plans accordingly! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      const msg = userMsg.toLowerCase();
      let reply = "Great question! I'm here to support your wellness journey. Stay consistent and you'll see amazing results!";
      if (msg.includes("snack")) reply = "Hey there, friend! I've got some delicious and healthy snack ideas for you:\n\n• Roasted Makhana (150 cal)\n• Cucumber & Tomato Salad (50 cal)\n• Roasted Chana (120 cal)\n• Fresh Fruit Salad (100 cal)\n\nThese align perfectly with your Indian nutrition plan!";
      if (msg.includes("travel")) reply = "Don't worry about your fitness while traveling! I'll adjust your plan:\n\n• Replace gym workouts with hotel room exercises\n• Walking tours count as cardio!\n• Bodyweight squats, push-ups & planks work anywhere\n• Stay hydrated - drink 3L water daily\n• Look for local healthy food options";
      if (msg.includes("tired") || msg.includes("rest")) reply = "Listen to your body! Rest is crucial for fitness gains. Take today easy - a light walk or stretching is perfect. Your muscles need recovery time to grow stronger. Tomorrow you'll be recharged!";
      setMessages(prev => [...prev, { from: "ai", text: reply }]);
    }, 1000);
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 80, right: 24, width: 380, height: 500, zIndex: 999,
          display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden",
          background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
        }}>
          <div style={{ padding: "16px 20px", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ffffff33", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="robot" size={20} color="#fff" /></div>
              <div>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>AROMI</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Your Health Companion</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><Icon name="cross" size={20} /></button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: m.from === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: m.from === "user" ? COLORS.accent : COLORS.surface,
                  fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line", color: COLORS.textPrimary,
                  border: `1px solid ${m.from === "user" ? COLORS.accent : COLORS.border}`,
                }}>{m.text}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask AROMI anything... 💭"
              style={{ flex: 1, padding: "10px 14px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, fontSize: 13, outline: "none" }} />
            <button onClick={send} style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plane" size={16} /></button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
        background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, border: "none", color: "#fff",
        fontSize: 24, cursor: "pointer", boxShadow: `0 8px 30px ${COLORS.accentGlow}`, zIndex: 1000,
        animation: "glow 3s infinite",
      }}>🤖</button>
    </>
  );
};

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
const ProfilePage = ({ user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", age: "22", gender: "Male", height: "170", weight: "80", phone: "" });
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div style={{ padding: "80px 24px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}><Icon name="user" size={28} /> <span style={{ color: COLORS.accentLight }}>My Profile</span></h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>Manage your account settings and preferences</p>
        </div>
        <Btn size="sm" onClick={() => setEditing(!editing)} variant={editing ? "green" : "ghost"}>
          {editing ? <><Icon name="check" size={14} /> Save Changes</> : <><Icon name="pencil" size={14} /> Edit Profile</>}
        </Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["profile", <><Icon name="user" size={14} /> Profile</>], ["settings", <><Icon name="settings" size={14} /> Settings</>], ["notifications", <><Icon name="bell" size={14} /> Notifications</>], ["privacy", <><Icon name="lock" size={14} /> Privacy</>]].map(([id, label]) => (
          <Btn key={id} variant={activeTab === id ? "primary" : "surface"} size="sm" onClick={() => setActiveTab(id)}>{label}</Btn>
        ))}
      </div>

      {activeTab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
          <Card style={{ textAlign: "center", padding: 32 }}>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800 }}>
                {form.name?.[0] || "A"}
              </div>
              <button style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: COLORS.accent, border: "2px solid " + COLORS.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="camera" size={12} color="#fff" /></button>
            </div>
            <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{form.name}</h2>
            <p style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 }}>{form.email}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["24", "Workouts"], ["18", "Active Days"], ["3kg", "Lost"]].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: COLORS.accentLight }}>{val}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[["Full Name", "name"], ["Email", "email"], ["Phone", "phone"], ["Age", "age"], ["Gender", "gender"], ["Height (cm)", "height"], ["Weight (kg)", "weight"]].map(([label, field]) => (
                <div key={field}>
                  <label style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, display: "block" }}>{label}</label>
                  {field === "gender" ? (
                    <select value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} disabled={!editing}
                      style={{ width: "100%", padding: "10px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, fontSize: 14 }}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  ) : (
                    <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} disabled={!editing}
                      style={{ width: "100%", padding: "10px 12px", background: COLORS.surface, border: `1px solid ${editing ? COLORS.accent : COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, fontSize: 14, outline: "none" }} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {(activeTab === "settings" || activeTab === "notifications" || activeTab === "privacy") && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ marginBottom: 16 }}><Icon name="settings" size={48} color={COLORS.textSecondary} /></div>
          <h3 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 700 }}>Coming Soon</h3>
          <p style={{ color: COLORS.textSecondary }}>This section is under development.</p>
        </Card>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ArogyaMitra() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const handleSetUser = (u) => { setUser(u); };

  // On app load, if token exists, fetch current user
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    (async () => {
      try {
        const me = await apiFetch('/api/user/me');
        if (me) {
          // adapt backend response fields to frontend user shape
          const mapped = { name: me.full_name || me.username, username: me.username, email: me.email, age: me.age, gender: me.gender, height: me.height_cm, weight: me.weight_kg, fitness_level: me.fitness_level, fitness_goal: me.fitness_goal };
          setUser(mapped);
        }
      } catch (e) { console.warn('Failed to fetch current user', e); }
    })();
  }, []);

  const renderPage = () => {
    switch (page) {
      case "home": return <LandingPage setPage={setPage} />;
      case "login": return <AuthPage mode="login" setPage={setPage} setUser={handleSetUser} />;
      case "register": return <AuthPage mode="register" setPage={setPage} setUser={handleSetUser} />;
      case "dashboard": return user ? <Dashboard user={user} setPage={setPage} /> : <LandingPage setPage={setPage} />;
      case "assessment": return user ? <HealthAssessment setPage={setPage} /> : <LandingPage setPage={setPage} />;
      case "workouts": return user ? <WorkoutPlans /> : <LandingPage setPage={setPage} />;
      case "nutrition": return user ? <NutritionPlan /> : <LandingPage setPage={setPage} />;
      case "progress": return user ? <ProgressTracking user={user} /> : <LandingPage setPage={setPage} />;
      case "devices": return user ? <DeviceSettings user={user} /> : <LandingPage setPage={setPage} />;
      case "coach": return user ? <AICoachPage user={user} /> : <LandingPage setPage={setPage} />;
      case "profile": return user ? <ProfilePage user={user} setUser={setUser} /> : <LandingPage setPage={setPage} />;
      default: return <LandingPage setPage={setPage} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <Navbar page={page} setPage={setPage} user={user} darkMode={darkMode} setDarkMode={setDarkMode} setUser={setUser} />
      <main>{renderPage()}</main>
      {user && <AROMIWidget user={user} />}
    </>
  );
}