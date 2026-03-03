"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createGame = async () => {
    if (loading) return;
    setLoading(true);
    const gameId = Math.random().toString(36).substring(2, 8);
    const { error } = await supabase.from("game").insert([{ id: gameId, started: false }]);
    if (error) { alert("Error: " + error.message); setLoading(false); return; }
    router.push(`/game/${gameId}`);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, marginBottom: 32,
      }}>🎭</div>

      <p style={{
        fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
        color: "var(--muted)", marginBottom: 12
      }}>A game of identity</p>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "clamp(52px, 12vw, 80px)",
        fontWeight: 600, lineHeight: 1, color: "var(--ink)",
        textAlign: "center", marginBottom: 16
      }}>Guess The<br />Person</h1>

      <p style={{
        color: "var(--muted)", fontSize: 15, lineHeight: 1.7,
        textAlign: "center", maxWidth: 280, marginBottom: 48
      }}>
        Everyone gets a secret identity. Ask yes/no questions. First to guess wins.
      </p>

      <button
        onClick={createGame}
        disabled={loading}
        style={{
          width: "100%", maxWidth: 320, padding: "16px",
          background: "var(--ink)", color: "var(--bg)",
          border: "none", borderRadius: 14, fontSize: 14,
          fontWeight: 500, letterSpacing: "0.08em",
          fontFamily: "'Outfit', sans-serif", cursor: "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? "Creating..." : "CREATE GAME"}
      </button>
    </div>
  );
}