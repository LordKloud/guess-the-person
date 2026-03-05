"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    const code = joinCode.trim().toLowerCase();

    // Check localStorage for existing session
    const savedPlayerId = localStorage.getItem("playerId-" + code);

    // Fetch game state
    const { data: game, error } = await supabase
      .from("game")
      .select("id, started, ended")
      .eq("id", code)
      .single();

    if (error || !game) {
      alert("Game not found!");
      setLoading(false);
      return;
    }

    // If we have a saved session, skip lobby and go straight to right screen
    if (savedPlayerId) {
      if (game.ended) {
        router.push(`/game/${code}/winner?playerId=${savedPlayerId}`);
      } else if (game.started) {
        router.push(`/game/${code}/play?playerId=${savedPlayerId}`);
      } else {
        router.push(`/game/${code}?playerId=${savedPlayerId}`);
      }
      return;
    }

    // No saved session — go to lobby as normal
    router.push(`/game/${code}`);
  }

  async function createGame() {
    setLoading(true);
    const newGameId = Math.random().toString(36).substring(2, 8);
    const { error } = await supabase.from("game").insert([{ id: newGameId, started: false }]);
    if (error) { alert("Error creating game: " + error.message); setLoading(false); return; }
    router.push(`/game/${newGameId}`);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "48px 24px", fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>&#127917;</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
            Guess The Person
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
            A party game of secret identities
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            placeholder="Enter game code"
            style={{
              padding: "14px 18px", borderRadius: 12, fontSize: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--ink)",
              fontFamily: "'Outfit', sans-serif", outline: "none",
              textAlign: "center", letterSpacing: "0.1em"
            }}
          />
          <button
            onClick={handleJoin}
            disabled={loading || !joinCode.trim()}
            style={{
              padding: "15px", background: "var(--ink)", color: "var(--bg)",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500,
              letterSpacing: "0.08em", fontFamily: "'Outfit', sans-serif",
              cursor: joinCode.trim() ? "pointer" : "not-allowed",
              opacity: joinCode.trim() ? 1 : 0.3
            }}
          >
            {loading ? "Loading..." : "JOIN GAME"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          onClick={createGame}
          disabled={loading}
          style={{
            width: "100%", padding: "15px",
            background: "transparent", color: "var(--muted)",
            border: "1px solid var(--border)", borderRadius: 12,
            fontSize: 14, letterSpacing: "0.08em",
            fontFamily: "'Outfit', sans-serif", cursor: "pointer"
          }}
        >
          Create New Game
        </button>

      </div>
    </div>
  );
}