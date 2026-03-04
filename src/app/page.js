"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const createGame = async () => {
    if (loading) return;
    setLoading(true);
    const gameId = Math.random().toString(36).substring(2, 8);
    const { error } = await supabase.from("game").insert([{ id: gameId, started: false }]);
    if (error) { alert("Error: " + error.message); setLoading(false); return; }
    router.push(`/game/${gameId}`);
  };

  const joinGame = async () => {
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    const { data, error } = await supabase
      .from("game")
      .select("id")
      .eq("id", joinCode.trim().toLowerCase())
      .single();
    if (error || !data) {
      alert("Game not found! Check the code and try again.");
      setJoining(false);
      return;
    }
    router.push(`/game/${joinCode.trim().toLowerCase()}`);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center" }}>

        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "var(--surface2)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, marginBottom: 32,
        }}>🎭</div>

        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
          A game of identity
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(52px, 12vw, 72px)",
          fontWeight: 600, lineHeight: 1, color: "var(--ink)",
          textAlign: "center", marginBottom: 16
        }}>Guess The<br />Person</h1>

        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, textAlign: "center", maxWidth: 260, marginBottom: 48 }}>
          Everyone gets a secret identity. Ask yes/no questions. First to guess wins.
        </p>

        <button
          onClick={createGame}
          disabled={loading}
          style={{
            width: "100%", padding: "15px",
            background: "var(--ink)", color: "var(--bg)",
            border: "none", borderRadius: 12, fontSize: 13,
            fontWeight: 500, letterSpacing: "0.08em",
            fontFamily: "'Outfit', sans-serif", cursor: "pointer",
            opacity: loading ? 0.5 : 1, marginBottom: 14
          }}
        >
          {loading ? "Creating..." : "CREATE GAME"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>OR JOIN</p>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toLowerCase())}
          onKeyDown={e => e.key === "Enter" && joinGame()}
          placeholder="Enter game code"
          style={{
            width: "100%", padding: "14px 18px",
            borderRadius: 12, fontSize: 15,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--ink)",
            fontFamily: "'Outfit', sans-serif", outline: "none",
            textAlign: "center", marginBottom: 10,
            boxSizing: "border-box", letterSpacing: "0.12em"
          }}
        />
        <button
          onClick={joinGame}
          disabled={joining || !joinCode.trim()}
          style={{
            width: "100%", padding: "15px",
            background: "transparent", color: "var(--ink)",
            border: "1px solid var(--border)", borderRadius: 12,
            fontSize: 13, fontWeight: 500, letterSpacing: "0.08em",
            fontFamily: "'Outfit', sans-serif", cursor: "pointer",
            opacity: !joinCode.trim() ? 0.3 : 1
          }}
        >
          {joining ? "Joining..." : "JOIN GAME"}
        </button>

      </div>
    </div>
  );
}