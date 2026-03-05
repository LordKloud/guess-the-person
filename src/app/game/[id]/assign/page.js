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

function AssignContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const myPlayerId = searchParams.get("playerId");
  const [myAssignment, setMyAssignment] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("assign-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `game_id=eq.${id}` },
        () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new.force_started) {
            router.push(`/game/${id}/play?playerId=${myPlayerId}`);
          }
        })
      .subscribe();

    const interval = setInterval(() => loadData(), 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [id]);

  async function loadData() {
    const { data: players } = await supabase.from("players").select("*").eq("game_id", id);
    if (players) {
      setAllPlayers(players);
      const me = players.find(p => p.id === myPlayerId);
      if (me) setIsHost(me.is_host);
    }

    const { data: assignments } = await supabase.from("assignments").select("*").eq("game_id", id);
    if (assignments) {
      setSubmissions(assignments.filter(a => a.character_name));
      const mine = assignments.find(a => a.assigner_id === myPlayerId);
      if (mine) setMyAssignment(mine);
      if (mine?.character_name) setSubmitted(true);
    }

    const { data: game } = await supabase.from("game").select("force_started").eq("id", id).single();
    if (game?.force_started) {
      router.push(`/game/${id}/play?playerId=${myPlayerId}`);
    }
  }

  async function submitCharacter() {
    if (!characterName.trim()) return;
    const { error } = await supabase.from("assignments")
      .update({ character_name: characterName.trim() })
      .eq("assigner_id", myPlayerId);
    if (error) { alert("Error: " + error.message); return; }
    setSubmitted(true);
  }

  async function forceStart() {
    await supabase.from("game").update({ force_started: true }).eq("id", id);
    router.push(`/game/${id}/play?playerId=${myPlayerId}`);
  }

  const assignedToPlayer = allPlayers.find(p => p.id === myAssignment?.assigned_to_id);
  const progress = allPlayers.length > 0 ? (submissions.length / allPlayers.length) * 100 : 0;
  const submittedAssignerIds = submissions.map(s => s.assigner_id);

  useEffect(() => {
    if (submissions.length > 0 && allPlayers.length > 0 && submissions.length === allPlayers.length) {
      router.push(`/game/${id}/play?playerId=${myPlayerId}`);
    }
  }, [submissions, allPlayers]);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "48px 24px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <HomeButton />
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Step 1 · Assignment
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: "var(--ink)" }}>
            {submitted ? "Submitted!" : "Pick an identity"}
          </h1>
        </div>

        {!submitted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "var(--surface)", borderRadius: 16,
              padding: "24px", textAlign: "center",
              border: "1px solid var(--border)"
            }}>
              <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                You are assigning for
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: "var(--ink)" }}>
                {assignedToPlayer?.name ?? "..."}
              </p>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
              Pick anyone — real, fictional, alive or dead.<br />They won't see this. Everyone else will.
            </p>

            <input
              placeholder="e.g. Napoleon, Beyoncé, Batman..."
              value={characterName}
              onChange={e => setCharacterName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitCharacter()}
              style={{
                padding: "14px 18px", borderRadius: 12, fontSize: 16,
                border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--ink)",
                fontFamily: "'Outfit', sans-serif", outline: "none",
                textAlign: "center"
              }}
            />
            <button onClick={submitCharacter} style={{
              padding: "15px", background: "var(--ink)", color: "var(--bg)",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500,
              letterSpacing: "0.08em", fontFamily: "'Outfit', sans-serif", cursor: "pointer"
            }}>SUBMIT →</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--surface)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, color: "var(--ink)"
              }}>✓</div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Submissions</p>
                <p style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500 }}>
                  {submissions.length} / {allPlayers.length}
                </p>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: 99, height: 4, overflow: "hidden", marginBottom: 16 }}>
                <div style={{
                  height: "100%", borderRadius: 99, background: "var(--ink)",
                  width: `${progress}%`, transition: "width 0.4s ease"
                }} />
              </div>
            </div>

            <div style={{ background: "var(--surface)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              {allPlayers.map((p, i) => {
                const done = submittedAssignerIds.includes(p.id);
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 18px", borderBottom: "1px solid var(--border)"
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: COLORS[i % COLORS.length],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600, color: "white", flexShrink: 0
                    }}>{p.name[0].toUpperCase()}</div>
                    <span style={{ fontSize: 14, color: done ? "var(--ink)" : "var(--muted)", flex: 1 }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: 13 }}>{done ? "✓" : "⏳"}</span>
                  </div>
                );
              })}
            </div>

            {isHost && (
              <button onClick={forceStart} style={{
                padding: "13px", background: "transparent", color: "var(--muted)",
                border: "1px solid var(--border)", borderRadius: 12,
                fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer",
                letterSpacing: "0.06em"
              }}>
                Force start anyway →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A" }}>
        Loading...
      </div>
    }>
      <AssignContent />
    </Suspense>
  );
}