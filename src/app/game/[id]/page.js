"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ["#E07B54","#5B8FE8","#4CAF72","#B06EC4","#E8B84B","#E85B7A"];

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4CAF72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("playerName-" + id)
          || localStorage.getItem("playerName-latest")
          || "";
    }
    return "";
  });
  const [joined, setJoined] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const joinedRef = useRef(false);
  const myPlayerIdRef = useRef(null);

  useEffect(() => {
    fetchPlayers();
    const channel = supabase
      .channel("lobby-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${id}` },
        () => fetchPlayers())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new.started) {
            const pid = myPlayerIdRef.current || localStorage.getItem("playerId-" + id);
            if (pid) router.push(`/game/${id}/assign?playerId=${pid}`);
          }
        })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("game").select("started").eq("id", id).single();
      if (data?.started) {
        const pid = myPlayerIdRef.current || localStorage.getItem("playerId-" + id);
        if (pid) router.push(`/game/${id}/assign?playerId=${pid}`);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [joined]);

  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("*").eq("game_id", id).order("created_at", { ascending: true });
    if (data) setPlayers(data);
  }

  async function joinGame() {
    if (!name.trim() || joinedRef.current) return;
    joinedRef.current = true;
    const { data: existing } = await supabase.from("players").select("id").eq("game_id", id);
    const isFirst = !existing || existing.length === 0;
    const { data, error } = await supabase.from("players")
      .insert([{ game_id: id, name: name.trim(), is_host: isFirst }])
      .select().single();
    if (error) { joinedRef.current = false; alert("Error: " + error.message); return; }
    localStorage.setItem("playerId-" + id, data.id);
    localStorage.setItem("playerName-" + id, data.name);
    localStorage.setItem("playerName-latest", data.name);
    myPlayerIdRef.current = data.id;
    setMyPlayerId(data.id);
    setIsHost(data.is_host);
    setJoined(true);
  }

  async function startGame() {
    if (players.length < 2) { alert("Need at least 2 players!"); return; }
    setStarting(true);
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const assignments = shuffled.map((p, i) => ({
      game_id: id, assigner_id: p.id,
      assigned_to_id: shuffled[(i + 1) % shuffled.length].id,
      character_name: null,
    }));
    const { error } = await supabase.from("assignments").insert(assignments);
    if (error) { alert("Error: " + error.message); setStarting(false); return; }
    await supabase.from("game").update({ started: true }).eq("id", id);
    router.push(`/game/${id}/assign?playerId=${myPlayerId}`);
  }

  function copyCode() {
    navigator.clipboard.writeText(id.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "48px 24px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)" }}>
              Game · {id.toUpperCase()}
            </p>
            <button
              onClick={copyCode}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: copied ? "#4CAF72" : "var(--muted)",
                padding: 0, display: "flex", alignItems: "center",
                transition: "color 0.2s ease"
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: "var(--ink)" }}>
            {joined ? "Waiting Room" : "Join Game"}
          </h1>
        </div>

        {!joined ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && joinGame()}
              placeholder="Your name"
              style={{
                padding: "14px 18px", borderRadius: 12, fontSize: 16,
                border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--ink)",
                fontFamily: "'Outfit', sans-serif", outline: "none",
                textAlign: "center"
              }}
            />
            <button onClick={joinGame} style={{
              padding: "15px", background: "var(--ink)", color: "var(--bg)",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500,
              letterSpacing: "0.08em", fontFamily: "'Outfit', sans-serif", cursor: "pointer"
            }}>JOIN GAME</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "var(--surface)", borderRadius: 12,
              padding: "12px 16px", textAlign: "center",
              border: "1px solid var(--border)"
            }}>
              <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                ✓ Joined as <span style={{ color: "var(--ink)" }}>{name}</span>
              </p>
            </div>

            <div style={{ background: "var(--surface)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>
                  Players ({players.length})
                </p>
              </div>
              {players.map((p, i) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px", borderBottom: "1px solid var(--border)"
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: COLORS[i % COLORS.length],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, color: "white", flexShrink: 0
                  }}>{p.name[0].toUpperCase()}</div>
                  <span style={{ fontSize: 15, color: "var(--ink)", flex: 1 }}>{p.name}</span>
                  {p.is_host && (
                    <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                onClick={startGame}
                disabled={starting || players.length < 2}
                style={{
                  padding: "15px", background: "var(--ink)", color: "var(--bg)",
                  border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500,
                  letterSpacing: "0.08em", fontFamily: "'Outfit', sans-serif",
                  cursor: players.length < 2 ? "not-allowed" : "pointer",
                  opacity: players.length < 2 ? 0.3 : 1
                }}
              >
                {starting ? "Starting..." : "START GAME →"}
              </button>
            ) : (
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, fontStyle: "italic" }}>
                Waiting for host to start...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}