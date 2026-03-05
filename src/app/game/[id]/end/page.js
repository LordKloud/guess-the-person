"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#E07B54","#5B8FE8","#4CAF72","#B06EC4","#E8B84B","#E85B7A"];

function HomeButton() {
  return (
    <a href="https://mystery-me.vercel.app/" style={{
      position: "fixed", top: 16, left: 16, zIndex: 100,
      display: "flex", alignItems: "center",
      padding: "10px", background: "#1C1A24", color: "#555",
      border: "1px solid #2A2730", borderRadius: 99,
      textDecoration: "none", cursor: "pointer"
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </a>
  );
}

function EndContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const myPlayerId = searchParams.get("playerId");
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(null); // player id OR "no-winner"
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { loadPlayers(); }, [id]);

  async function loadPlayers() {
    const { data } = await supabase.from("players").select("*").eq("game_id", id).order("created_at", { ascending: true });
    if (data) setPlayers(data);
  }

  async function confirmAndReveal() {
    if (!selected || confirming) return;
    setConfirming(true);
    const winnerId = selected === "no-winner" ? null : selected;
    await supabase.from("game").update({ ended: true, winner_id: winnerId }).eq("id", id);
    router.push(`/game/${id}/winner?playerId=${myPlayerId}`);
  }

  const isReady = !!selected;

  return (
    <div style={{ minHeight: "100vh", background: "#13111A", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", fontFamily: "'Outfit', sans-serif" }}>
      <HomeButton />
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>End Game</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#F5F0E8", fontWeight: "normal", marginBottom: 8 }}>Who won?</h1>
          <p style={{ fontSize: 13, color: "#555" }}>Select the player who guessed their identity first</p>
        </div>

        {/* Players */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {players.map((p, i) => {
            const isSelected = selected === p.id;
            return (
              <div key={p.id} onClick={() => setSelected(p.id)} style={{
                background: "#1C1A24", borderRadius: 16, padding: "16px 18px",
                border: isSelected ? `1.5px solid ${COLORS[i % COLORS.length]}` : "1.5px solid #2A2730",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 14
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "white", flexShrink: 0 }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 15, color: isSelected ? "#F5F0E8" : "#666", flex: 1 }}>{p.name}</span>
                {isSelected && <span style={{ fontSize: 18 }}>🏆</span>}
              </div>
            );
          })}
        </div>

        {/* No winner option — acts like a selection */}
        <div
          onClick={() => setSelected("no-winner")}
          style={{
            width: "100%", padding: "13px", marginBottom: 16,
            background: selected === "no-winner" ? "#1C1A24" : "transparent",
            color: selected === "no-winner" ? "#F5F0E8" : "#444",
            border: selected === "no-winner" ? "1.5px solid #555" : "1px dashed #2A2730",
            borderRadius: 12, fontSize: 13, fontFamily: "'Outfit', sans-serif",
            cursor: "pointer", letterSpacing: "0.06em",
            textAlign: "center", boxSizing: "border-box"
          }}
        >
          No winner this time {selected === "no-winner" ? "✓" : "→"}
        </div>

        {/* Warning */}
        <div style={{ background: "#1C1A24", borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: "1px solid #2A2730", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 14, marginTop: 1 }}>⚠️</span>
          <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>This will reveal everyone's secret identity to all players. Are you sure you want to proceed?</p>
        </div>

        {/* Confirm button — active only when something is selected */}
        <button
          onClick={confirmAndReveal}
          disabled={!isReady || confirming}
          style={{
            width: "100%", padding: "15px",
            background: isReady ? "#F5F0E8" : "#1C1A24",
            color: isReady ? "#13111A" : "#333",
            border: "1px solid #2A2730", borderRadius: 12,
            fontSize: 13, fontWeight: 500, letterSpacing: "0.08em",
            fontFamily: "'Outfit', sans-serif",
            cursor: isReady ? "pointer" : "not-allowed"
          }}
        >
          {confirming ? "Confirming..." : "CONFIRM & REVEAL →"}
        </button>
      </div>
    </div>
  );
}

export default function EndPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A" }}>Loading...</div>}>
      <EndContent />
    </Suspense>
  );
}