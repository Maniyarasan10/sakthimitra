import React, { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

const COLORS = {
  bg: "#0a0a10",
  surface: "#12121c",
  card: "#1a1a28",
  border: "#2a2a42",
  accent: "#7c3aed",
  accentLight: "#9f5ff1",
  textPrimary: "#f0f0ff",
  textSecondary: "#8888aa",
};

const Btn = ({ children, onClick, variant = "primary", size = "md", style = {} }) => (
  <button onClick={onClick} style={{ padding: 8, borderRadius: 8, background: variant === 'ghost' ? 'transparent' : COLORS.accent, color: '#fff', border: 'none', cursor: 'pointer', ...style }}>{children}</button>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, ...style }}>{children}</div>
);

const Icon = ({ name, size = 16 }) => {
  const paths = {
    bluetooth: <path d="M7 7l10 5-10 5V7z" />,
    chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name] || null}</svg>
  );
};

// Minimal Tracker + Chart (copy of lightweight tracker used in App.jsx)
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

const Tracker = ({ exercise = null, small = false }) => {
  const [view, setView] = useState("week");
  const seed = (exercise && (exercise.id || exercise.name?.length)) || 7;
  const makeData = (n, seedVal) => {
    const arr = Array.from({ length: n }, (_, i) => {
      const base = Math.abs(Math.sin((i + seedVal) * 12.9898) * 43758.5453) % 1;
      return Math.round((base * 60) + (seedVal % 10));
    });
    return arr;
  };
  let data, labels;
  if (view === "day") { data = makeData(24, seed); labels = ["00h", "04h", "08h", "12h", "16h", "20h", "24h"]; }
  else if (view === "month") { data = makeData(30, seed + 3); labels = ["W1", "W2", "W3", "W4", "W5"]; }
  else { data = makeData(7, seed + 1); labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; }
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

// DeviceSettings handles Bluetooth connections and plan generation.
export default function DeviceSettings({ user }) {
  const [btStatus, setBtStatus] = useState("No device connected");
  const [deviceName, setDeviceName] = useState(null);
  const [collectedData, setCollectedData] = useState({});
  const [serviceUUID, setServiceUUID] = useState("");
  const [charUUID, setCharUUID] = useState("");

  useEffect(() => {
    let hrChar = null;
    let stepChar = null;
    let device = null;

    async function connectBluetooth() {
      if (!navigator.bluetooth) {
        setBtStatus("Web Bluetooth not supported in this browser");
        return;
      }
      try {
        setBtStatus("Requesting device...");
        const filters = serviceUUID ? [{ services: [serviceUUID] }] : [{ services: ["heart_rate"] }];
        device = await navigator.bluetooth.requestDevice({ filters, optionalServices: ["battery_service", serviceUUID].filter(Boolean) });
        setDeviceName(device.name || device.id);
        setBtStatus(`Connecting to ${device.name || device.id}...`);
        const server = await device.gatt.connect();

        // Heart rate
        try {
          const hrService = await server.getPrimaryService("heart_rate");
          hrChar = await hrService.getCharacteristic("heart_rate_measurement");
          await hrChar.startNotifications();
          hrChar.addEventListener("characteristicvaluechanged", e => {
            const value = e.target.value;
            const flags = value.getUint8(0);
            let offset = 1;
            let hr = null;
            if (flags & 0x01) { hr = value.getUint16(offset, true); offset += 2; } else { hr = value.getUint8(offset); offset += 1; }
            setCollectedData(d => ({ ...d, heart_rate: hr }));
            setBtStatus(`Connected: ${device.name || device.id} — HR ${hr} bpm`);
          });
        } catch (e) {
          // ignore if device doesn't expose HR
        }

        // Optional: custom steps characteristic
        if (charUUID) {
          try {
            const svc = await server.getPrimaryService(serviceUUID);
            stepChar = await svc.getCharacteristic(charUUID);
            // try notifications, else read once
            try {
              await stepChar.startNotifications();
              stepChar.addEventListener("characteristicvaluechanged", ev => {
                const v = ev.target.value.getUint32(0, true);
                setCollectedData(d => ({ ...d, steps: v }));
              });
            } catch (nerr) {
              const val = await stepChar.readValue();
              setCollectedData(d => ({ ...d, steps: val.getUint32(0, true) }));
            }
          } catch (e) {
            // could not read custom char
          }
        }

        device.addEventListener('gattserverdisconnected', () => {
          setBtStatus('Device disconnected');
          setDeviceName(null);
        });
      } catch (err) {
        setBtStatus('Bluetooth error: ' + (err.message || err));
      }
    }

    async function generatePlan() {
      setBtStatus(prev => prev + ' · Generating plan...');
      const payload = {
        age: user?.age || 30,
        gender: user?.gender || 'Male',
        height: user?.height || 170,
        weight: user?.weight || 70,
        fitness_level: user?.fitness_level || 'beginner',
        fitness_goal: user?.fitness_goal || 'general_fitness',
        heart_rate_rest: collectedData.heart_rate || null,
        steps: collectedData.steps || null,
        device: deviceName || null,
      };
      try {
        const res = await apiFetch('/api/workouts/generate', { method: 'POST', body: JSON.stringify(payload) });
        if (res && res.plan) setBtStatus('Plan generated and saved');
        else setBtStatus('Plan generation: ' + (res.message || 'ok'));
      } catch (e) {
        setBtStatus('Plan generation failed: ' + (e.message || e));
      }
    }

    function onConnect() { connectBluetooth(); }
    function onGen() { generatePlan(); }

    window.addEventListener('connect-bluetooth', onConnect);
    window.addEventListener('generate-plan', onGen);

    return () => {
      window.removeEventListener('connect-bluetooth', onConnect);
      window.removeEventListener('generate-plan', onGen);
      try { if (hrChar) hrChar.stopNotifications(); } catch (e) {}
      try { if (stepChar) stepChar.stopNotifications(); } catch (e) {}
    };
  }, [serviceUUID, charUUID, collectedData, deviceName, user]);

  return (
    <div style={{ padding: 80, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Device Settings</h1>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>Connect Health Device</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Choose device and optionally provide custom service/char UUIDs for steps or other metrics.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size='sm' onClick={() => window.dispatchEvent(new Event('connect-bluetooth'))}><Icon name='bluetooth' size={14} /> Connect</Btn>
            <Btn variant='ghost' size='sm' onClick={() => window.dispatchEvent(new Event('generate-plan'))}>Generate Plan</Btn>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input placeholder='Custom service UUID (optional)' value={serviceUUID} onChange={e => setServiceUUID(e.target.value)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.textPrimary, flex: 1 }} />
          <input placeholder='Characteristic UUID for steps (optional)' value={charUUID} onChange={e => setCharUUID(e.target.value)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.textPrimary, width: 320 }} />
        </div>
        <div style={{ marginTop: 10, color: COLORS.textSecondary }}>{btStatus}</div>
      </Card>

      <Card>
        <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Collected Metrics</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160, padding: 12, background: COLORS.surface, borderRadius: 10 }}><div style={{ fontSize: 12, color: COLORS.textSecondary }}>Device</div><div style={{ fontWeight: 700 }}>{deviceName || '—'}</div></div>
          <div style={{ minWidth: 160, padding: 12, background: COLORS.surface, borderRadius: 10 }}><div style={{ fontSize: 12, color: COLORS.textSecondary }}>Heart Rate</div><div style={{ fontWeight: 700 }}>{collectedData.heart_rate ? `${collectedData.heart_rate} bpm` : '—'}</div></div>
          <div style={{ minWidth: 160, padding: 12, background: COLORS.surface, borderRadius: 10 }}><div style={{ fontSize: 12, color: COLORS.textSecondary }}>Steps</div><div style={{ fontWeight: 700 }}>{collectedData.steps || '—'}</div></div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>Suggestions</h3>
          <Suggestions collected={collectedData} onQuickAction={() => window.dispatchEvent(new Event('generate-plan'))} />
        </div>

        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>Smart Tracking</h3>
          <Tracker exercise={{ id: 1, name: 'Device Activity' }} />
        </div>
      </Card>
    </div>
  );
}

// Suggestions component: derive actionable tips from collected metrics
const Suggestions = ({ collected = {}, onQuickAction = () => {} }) => {
  const hr = collected.heart_rate ?? null;
  const steps = collected.steps ?? null;

  const hrSuggestion = () => {
    if (!hr) return { title: 'No resting heart rate', text: 'Connect a device or allow heart rate reading to get personalized cardio suggestions.' };
    if (hr < 50) return { title: 'Low resting HR', text: `Resting HR ${hr} bpm — usually seen in fit individuals. Good cardiovascular fitness; if you feel dizzy or unwell, consult a doctor.` };
    if (hr < 61) return { title: 'Excellent resting HR', text: `Resting HR ${hr} bpm — great! Maintain regular cardio and recovery.` };
    if (hr < 81) return { title: 'Normal resting HR', text: `Resting HR ${hr} bpm — try adding 20–30 min moderate cardio 3x/week.` };
    if (hr < 101) return { title: 'Elevated resting HR', text: `Resting HR ${hr} bpm — consider light activity, hydration and rest today. If persistent, get medical advice.` };
    return { title: 'High resting HR', text: `Resting HR ${hr} bpm — rest, hydrate and avoid intense exercise until values normalize. Seek medical help if symptoms occur.` };
  };

  const stepsSuggestion = () => {
    if (!steps && steps !== 0) return { title: 'No step data', text: 'No steps recorded — try carrying your phone or connect a step-tracking device.' };
    if (steps < 2000) return { title: 'Very low activity', text: `Only ${steps} steps — try a 10–20 minute walk now to get moving.` };
    if (steps < 5000) return { title: 'Low activity', text: `${steps} steps so far — a short walk or standing breaks will help reach 5k.` };
    if (steps < 7500) return { title: 'Good activity', text: `${steps} steps — good progress. Aim for 7.5–10k for more benefit.` };
    return { title: 'Great activity', text: `${steps} steps — excellent! Keep this up.` };
  };

  const hrTip = hrSuggestion();
  const stepsTip = stepsSuggestion();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ padding: 12, background: COLORS.surface, borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>Heart Rate Insight</div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{hrTip.title}</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 }}>{hrTip.text}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn size='sm' onClick={() => { navigator.clipboard?.writeText(hrTip.text); }}>{'Copy Tip'}</Btn>
          <Btn variant='ghost' size='sm' onClick={() => onQuickAction()}>{'Generate Plan'}</Btn>
        </div>
      </div>
      <div style={{ padding: 12, background: COLORS.surface, borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>Activity Suggestion</div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{stepsTip.title}</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 }}>{stepsTip.text}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn size='sm' onClick={() => { alert('Start a 10-minute walking timer (placeholder)'); }}>{'Start Walk'}</Btn>
          <Btn variant='ghost' size='sm' onClick={() => onQuickAction()}>{'Create Plan'}</Btn>
        </div>
      </div>
    </div>
  );
};
