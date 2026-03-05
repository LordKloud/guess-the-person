"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#E07B54","#5B8FE8","#4CAF72","#B06EC4","#E8B84B","#E85B7A"];

function HomeButton() {
  return (
    <a href="https://guess-the-person.vercel.app/" style={{
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

function WinnerContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const myPlayerId = searchParams.get("playerId");
  const [players, setPlayers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [winnerId, setWinnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingAgain, setPlayingAgain] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const { data: g } = await supabase.from("game").select("winner_id").eq("id", id).single();
    const { data: p } = await supabase.from("players").select("*").eq("game_id", id).order("created_at", { ascending: true });
    const { data: a } = await supabase.from("assignments").select("*").eq("game_id", id);
    if (g) setWinnerId(g.winner_id);
    if (p) setPlayers(p);
    if (a) setAssignments(a);
    setLoading(false);
  }

  function getIdentity(playerId) { return assignments.find(a => a.assigned_to_id === playerId)?.character_name ?? "???"; }
  function getAssigner(playerId) {
    const assignment = assignments.find(a => a.assigned_to_id === playerId);
    if (!assignment) return null;
    return players.find(p => p.id === assignment.assigner_id)?.name ?? null;
  }

  async function playAgain() {
    if (playingAgain) return;
    setPlayingAgain(true);
    const newGameId = Math.random().toString(36).substring(2, 8);
    await supabase.from("game").insert([{ id: newGameId, started: false }]);
    await supabase.from("game").update({ next_game_id: newGameId }).eq("id", id);
    router.push(`/game/${newGameId}`);
  }

  useEffect(() => {
    const channel = supabase
      .channel("winner-" + id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game", filter: `id=eq.${id}` },
        (payload) => { if (payload.new.next_game_id) router.push(`/game/${payload.new.next_game_id}`); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  const winner = players.find(p => p.id === winnerId);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A", color: "#444" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#13111A", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 64px", fontFamily: "'Outfit', sans-serif" }}>
      <HomeButton />
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32, background: "#1C1A24", borderRadius: 20, padding: "32px 24px", border: "1px solid #2A2730" }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏆</p>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Winner</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, color: "#F5F0E8", fontWeight: "normal" }}>{winner?.name ?? "???"}</h1>
        </div>

        <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444", marginBottom: 12, paddingLeft: 4 }}>Everyone's identity</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {players.map((p, i) => {
            const assigner = getAssigner(p.id);
            return (
              <div key={p.id} style={{ background: "#1C1A24", borderRadius: 16, padding: "16px 18px", borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>
                    {p.name} {p.id === winnerId ? "🏆" : ""}
                  </p>
                  {assigner && <p style={{ fontSize: 11, color: "#444" }}>by <span style={{ color: "#666" }}>{assigner}</span></p>}
                </div>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#F5F0E8", fontWeight: "normal" }}>{getIdentity(p.id)}</p>
              </div>
            );
          })}
        </div>

        <button onClick={playAgain} disabled={playingAgain} style={{ width: "100%", padding: "15px", background: "#F5F0E8", color: "#13111A", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 500, letterSpacing: "0.08em", fontFamily: "'Outfit', sans-serif", cursor: "pointer", opacity: playingAgain ? 0.5 : 1 }}>
          {playingAgain ? "Creating new game..." : "PLAY AGAIN →"}
        </button>
      </div>
    </div>
  );
}

export default function WinnerPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A" }}>Loading...</div>}>
      <WinnerContent />
    </Suspense>
  );
}