"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#E07B54","#5B8FE8","#4CAF72","#B06EC4","#E8B84B","#E85B7A"];

function EyeOpen() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PlayContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const myPlayerId = searchParams.get("playerId");
  const [players, setPlayers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [rows, setRows] = useState([{ name: "", identity: "" }]);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("play-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `game_id=eq.${id}` },
        () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${id}` },
        () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new.ended) router.push(`/game/${id}/winner?playerId=${myPlayerId}`);
        })
      .subscribe();

    const interval = setInterval(async () => {
      const { data } = await supabase.from("game").select("ended").eq("id", id).single();
      if (data?.ended) router.push(`/game/${id}/winner?playerId=${myPlayerId}`);
    }, 2000);

    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [id]);

  async function loadData() {
    const { data: p } = await supabase.from("players").select("*").eq("game_id", id);
    const { data: a } = await supabase.from("assignments").select("*").eq("game_id", id);
    if (p) {
      setPlayers(p);
      const me = p.find(pl => pl.id === myPlayerId);
      if (me) setIsHost(me.is_host);
    }
    if (a) setAssignments(a);
    setLoading(false);
  }

  function getIdentity(playerId) {
    return assignments.find(a => a.assigned_to_id === playerId)?.character_name ?? "???";
  }

  function getAssigner(playerId) {
    const assignment = assignments.find(a => a.assigned_to_id === playerId);
    if (!assignment) return null;
    return players.find(p => p.id === assignment.assigner_id)?.name ?? null;
  }

  function getMyAssigner() {
    const assignment = assignments.find(a => a.assigned_to_id === myPlayerId);
    if (!assignment) return null;
    return players.find(p => p.id === assignment.assigner_id)?.name ?? null;
  }

  async function submitManualPlayers() {
    const valid = rows.filter(r => r.name.trim() && r.identity.trim());
    if (!valid.length) return;

    const me = players.find(p => p.id === myPlayerId);

    for (const row of valid) {
      // Insert new player
      const { data: newPlayer } = await supabase.from("players")
        .insert([{ game_id: id, name: row.name.trim(), is_host: false }])
        .select().single();

      if (newPlayer) {
        // Insert assignment — assigner is current user, assigned_to is new player
        await supabase.from("assignments").insert([{
          game_id: id,
          assigner_id: myPlayerId,
          assigned_to_id: newPlayer.id,
          character_name: row.identity.trim()
        }]);
      }
    }

    setRows([{ name: "", identity: "" }]);
    setShowAddForm(false);
    loadData();
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A", color: "#444" }}>
      Loading...
    </div>
  );

  const others = players.filter(p => p.id !== myPlayerId);
  const myAssigner = getMyAssigner();

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
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#F5F0E8", fontWeight: "normal", marginBottom: 16 }}>
            Your Cheat Sheet
          </h1>
          <button
            onClick={() => setHidden(!hidden)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 16px", background: "#1C1A24", color: "#666",
              border: "1px solid #2A2730", borderRadius: 99, fontSize: 11,
              fontFamily: "'Outfit', sans-serif", letterSpacing: "0.1em", cursor: "pointer",
            }}
          >
            {hidden ? <EyeOpen /> : <EyeClosed />}
            {hidden ? "SHOW ANSWERS" : "HIDE ANSWERS"}
          </button>
        </div>

        <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444", marginBottom: 12, paddingLeft: 4 }}>
          Everyone else's identity
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {others.map((player, i) => {
            const identity = getIdentity(player.id);
            const assigner = getAssigner(player.id);
            const pending = identity === "???";
            return (
              <div key={player.id} style={{
                background: "#1C1A24", borderRadius: 16, padding: "16px 18px",
                borderLeft: `4px solid ${hidden || pending ? "#333" : COLORS[i % COLORS.length]}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>
                    {player.name}
                  </p>
                  {assigner && (
                    <p style={{ fontSize: 11, color: "#444" }}>
                      by <span style={{ color: "#666" }}>{assigner}</span>
                    </p>
                  )}
                </div>
                <p style={{
                  fontFamily: "Georgia, serif", fontSize: 26,
                  color: hidden ? "transparent" : pending ? "#333" : "#F5F0E8",
                  fontWeight: "normal", lineHeight: 1.2,
                  background: hidden ? "#2A2730" : "transparent",
                  borderRadius: hidden ? 6 : 0,
                  padding: hidden ? "2px 8px" : 0,
                  userSelect: "none",
                  fontStyle: (!hidden && pending) ? "italic" : "normal"
                }}>
                  {identity}
                </p>
              </div>
            );
          })}
        </div>

        {/* You are box */}
        <div style={{
          background: "#1C1A24", borderRadius: 16, padding: "16px 18px",
          marginBottom: 16, borderLeft: "4px solid #2A2730"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444" }}>
              You are <span style={{ color: "#333" }}>???</span>
            </p>
            {myAssigner && (
              <p style={{ fontSize: 11, color: "#333" }}>
                by <span style={{ color: "#444" }}>{myAssigner}</span>
              </p>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#333", letterSpacing: "0.1em" }}>
            UNKNOWN
          </p>
        </div>

        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#333", lineHeight: 1.7 }}>
            Answer questions out loud 🎤<br />
            First to guess their identity wins 🏆
          </p>
        </div>

        {/* Add players manually */}
        {!showAddForm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: "100%", padding: "13px",
                background: "transparent", color: "#444",
                border: "1px dashed #2A2730", borderRadius: 12,
                fontSize: 13, fontFamily: "'Outfit', sans-serif",
                cursor: "pointer", letterSpacing: "0.06em"
              }}
            >
              + Add players manually
            </button>

            {isHost && (
              <button
                onClick={() => router.push(`/game/${id}/end?playerId=${myPlayerId}`)}
                style={{
                  width: "100%", padding: "13px",
                  background: "transparent", color: "#444",
                  border: "1px solid #2A2730", borderRadius: 12,
                  fontSize: 13, fontFamily: "'Outfit', sans-serif",
                  cursor: "pointer", letterSpacing: "0.06em"
                }}
              >
                End Game →
              </button>
            )}
          </div>
        ) : (
          <div style={{
            background: "#1C1A24", borderRadius: 16,
            padding: "20px", border: "1px solid #2A2730",
            display: "flex", flexDirection: "column", gap: 12
          }}>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555" }}>
              Add Players
            </p>

            {rows.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input
                  value={row.name}
                  onChange={e => { const u = [...rows]; u[i].name = e.target.value; setRows(u); }}
                  placeholder="Name"
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13,
                    border: "1px solid #2A2730", background: "#13111A",
                    color: "#F5F0E8", fontFamily: "'Outfit', sans-serif", outline: "none"
                  }}
                />
                <input
                  value={row.identity}
                  onChange={e => { const u = [...rows]; u[i].identity = e.target.value; setRows(u); }}
                  placeholder="Secret Identity"
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13,
                    border: "1px solid #2A2730", background: "#13111A",
                    color: "#F5F0E8", fontFamily: "'Outfit', sans-serif", outline: "none"
                  }}
                />
              </div>
            ))}

            <button
              onClick={() => setRows([...rows, { name: "", identity: "" }])}
              style={{
                alignSelf: "flex-start", background: "none", border: "none",
                color: "#444", fontSize: 12, cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                display: "flex", alignItems: "center", gap: 6, padding: 0
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add another
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setShowAddForm(false); setRows([{ name: "", identity: "" }]); }}
                style={{
                  flex: 1, padding: "11px",
                  background: "transparent", color: "#444",
                  border: "1px solid #2A2730", borderRadius: 10,
                  fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitManualPlayers}
                style={{
                  flex: 2, padding: "11px",
                  background: "#F5F0E8", color: "#13111A",
                  border: "none", borderRadius: 10,
                  fontSize: 12, fontWeight: 500, fontFamily: "'Outfit', sans-serif", cursor: "pointer"
                }}
              >
                Add to cheat sheet →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#13111A" }}>Loading...</div>}>
      <PlayContent />
    </Suspense>
  );
}