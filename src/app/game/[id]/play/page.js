"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#E07B54","#5B8FE8","#4CAF72","#B06EC4","#E8B84B","#E85B7A"];

function PlayContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const myPlayerId = searchParams.get("playerId");
  const [players, setPlayers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("play-" + id)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "assignments", filter: `game_id=eq.${id}`
      }, () => loadData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  async function loadData() {
    const { data: p } = await supabase.from("players").select("*").eq("game_id", id);
    const { data: a } = await supabase.from("assignments").select("*").eq("game_id", id);
    if (p) setPlayers(p);
    if (a) setAssignments(a);
    setLoading(false);
  }

  function getIdentity(playerId) {
    return assignments.find(a => a.assigned_to_id === playerId)?.character_name ?? "???";
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A", color: "#444" }}>
      Loading...
    </div>
  );

  const others = players.filter(p => p.id !== myPlayerId);

  return (
    <div style={{
      minHeight: "100vh", background: "#13111A",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "48px 24px 64px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: 6 }}>
            Game is live
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#F5F0E8", fontWeight: "normal" }}>
            Your Cheat Sheet
          </h1>
        </div>

        <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444", marginBottom: 12, paddingLeft: 4 }}>
          Everyone else's identity
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {others.map((player, i) => {
            const identity = getIdentity(player.id);
            const pending = identity === "???";
            return (
              <div key={player.id} style={{
                background: "#1C1A24", borderRadius: 16,
                padding: "18px 22px",
                borderLeft: `4px solid ${pending ? "#333" : COLORS[i % COLORS.length]}`
              }}>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
                  {player.name}
                </p>
                <p style={{
                  fontFamily: "Georgia, serif", fontSize: 26,
                  color: pending ? "#333" : "#F5F0E8",
                  fontWeight: "normal", lineHeight: 1.2,
                  fontStyle: pending ? "italic" : "normal"
                }}>
                  {identity}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{
          background: "#1C1A24", borderRadius: 16,
          padding: "16px 22px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <p style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>
            You are <span style={{ color: "#333" }}>???</span>
          </p>
          <span style={{ fontSize: 13, color: "#333", letterSpacing: "0.1em" }}>UNKNOWN</span>
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#333", lineHeight: 1.7 }}>
            Answer questions out loud 🎤<br />
            First to guess their identity wins 🏆
          </p>
        </div>

      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A" }}>
        Loading...
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}