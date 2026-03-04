"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#E07B54","#5B8FE8","#4CAF72","#B06EC4","#E8B84B","#E85B7A"];

function EndContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const myPlayerId = searchParams.get("playerId");
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [id]);

  async function loadPlayers() {
    const { data } = await supabase.from("players").select("*").eq("game_id", id).order("created_at", { ascending: true });
    if (data) setPlayers(data);
  }

  async function confirmWinner() {
    if (!selected || confirming) return;
    setConfirming(true);
    await supabase.from("game").update({ ended: true, winner_id: selected }).eq("id", id);
    router.push(`/game/${id}/winner?playerId=${myPlayerId}`);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#13111A",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "48px 24px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>
            End Game
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#F5F0E8", fontWeight: "normal", marginBottom: 8 }}>
            Who won?
          </h1>
          <p style={{ fontSize: 13, color: "#555" }}>Select the player who guessed their identity first</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {players.map((p, i) => {
            const isSelected = selected === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{
                  background: "#1C1A24", borderRadius: 16, padding: "16px 18px",
                  border: isSelected ? `1.5px solid ${COLORS[i % COLORS.length]}` : "1.5px solid #2A2730",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: COLORS[i % COLORS.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, color: "white", flexShrink: 0
                }}>{p.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 15, color: isSelected ? "#F5F0E8" : "#666", flex: 1 }}>{p.name}</span>
                {isSelected && <span style={{ fontSize: 18 }}>🏆</span>}
              </div>
            );
          })}
        </div>

        <div style={{
          background: "#1C1A24", borderRadius: 12, padding: "12px 16px", marginBottom: 12,
          border: "1px solid #2A2730", display: "flex", alignItems: "flex-start", gap: 10
        }}>
          <span style={{ fontSize: 14, marginTop: 1 }}>⚠️</span>
          <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
            This will reveal everyone's secret identity to all players. Are you sure you want to proceed?
          </p>
        </div>

        <button
          onClick={confirmWinner}
          disabled={!selected || confirming}
          style={{
            width: "100%", padding: "15px",
            background: selected ? "#F5F0E8" : "#1C1A24",
            color: selected ? "#13111A" : "#333",
            border: "1px solid #2A2730", borderRadius: 12,
            fontSize: 13, fontWeight: 500, letterSpacing: "0.08em",
            fontFamily: "'Outfit', sans-serif",
            cursor: selected ? "pointer" : "not-allowed",
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