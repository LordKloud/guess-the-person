"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("home");
  const [hostName, setHostName] = useState("");

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    const code = joinCode.trim().toLowerCase();

    const savedPlayerId = localStorage.getItem("playerId-" + code);

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

    router.push(`/game/${code}`);
  }

  async function createGame() {
    if (!hostName.trim() || loading) return;
    setLoading(true);

    const newGameId = Math.random().toString(36).substring(2, 8);

    const { error: gameError } = await supabase
      .from("game")
      .insert([{ id: newGameId, started: false }]);

    if (gameError) {
      alert("Error creating game: " + gameError.message);
      setLoading(false);
      return;
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert([{ game_id: newGameId, name: hostName.trim(), is_host: true }])
      .select()
      .single();

    if (playerError) {
      alert("Error joining game: " + playerError.message);
      setLoading(false);
      return;
    }

    localStorage.setItem("playerId-" + newGameId, player.id);
    router.push(`/game/${newGameId}?playerId=${player.id}`);
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
          <p style={{ fontSize: 64, marginBottom: 12 }}>&#127917;</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
            Guess The Person
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
            A game of secret identities
          </p>
        </div>

        {step === "home" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <button
              onClick={() => setStep("creating")}
              style={{
                width: "100%", padding: "15px",
                background: "transparent", color: "var(--muted)",
                border: "1px solid var(--border)", borderRadius: 12,
                fontSize: 14, letterSpacing: "0.08em",
                fontFamily: "'Outfit', sans-serif", cursor: "pointer"
              }}
            >
              Create New Game →
            </button>
          </>
        )}

        {step === "creating" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createGame()}
              placeholder="Your name"
              autoFocus
              style={{
                padding: "14px 18px", borderRadius: 12, fontSize: 16,
                border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--ink)",
                fontFamily: "'Outfit', sans-serif", outline: "none",
                textAlign: "center"
              }}
            />
            <button
              onClick={createGame}
              disabled={loading || !hostName.trim()}
              style={{
                padding: "15px",
                background: hostName.trim() ? "var(--ink)" : "var(--surface)",
                color: hostName.trim() ? "var(--bg)" : "#333",
                border: "1px solid var(--border)", borderRadius: 12,
                fontSize: 14, fontWeight: 500, letterSpacing: "0.08em",
                fontFamily: "'Outfit', sans-serif",
                cursor: hostName.trim() ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Creating..." : "CREATE & HOST →"}
            </button>

            <button
              onClick={() => { setStep("home"); setHostName(""); }}
              style={{
                padding: "10px", background: "transparent", color: "var(--muted)",
                border: "none", fontSize: 12,
                fontFamily: "'Outfit', sans-serif", cursor: "pointer"
              }}
            >
              ← back
            </button>
          </div>
        )}

      </div>
    </div>
  );
}