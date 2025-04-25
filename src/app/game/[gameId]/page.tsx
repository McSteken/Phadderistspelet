// app/game/[gameId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";  // Adjust path to your firebase config
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext"; // Adjust path to your AuthContext


export default function GamePage() {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { gameId } = useParams();


  useEffect(() => {
    if (!gameId) return;

    const matchRef = doc(db, "games", gameId as string);
    console.log("Fetching game data for ID:", gameId);
    const unsub = onSnapshot(matchRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.error("Game not found!");
        router.push("/");
        return;
      }
      setGame(snapshot.data());
      setLoading(false);
      console.log("Game data:", snapshot.data());
    }, (err) => {
      console.error(err);
      router.push("/");
    });
  
    return () => unsub();
  }, [gameId]);

    // ← EARLY RETURN
  if (loading) {
    return <div className="p-4">Laddar spel…</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Spel: {game.name}</h2>
      <p>Player 1: {game.player1Name}</p>
      <p>Player 2: {game.player2Name || "Väntar på spelare..."}</p>
      <p>Status: {game.status}</p>

      {game.status === "in_progress" && (
        <div>
          <p>Spelet är igång!</p>
          {/* move UI here */}
        </div>
      )}
      {game.status === "waiting" && !game.player2 && (
        <p>Vänta på att den andra spelaren går med…</p>
      )}
    </div>
  );
}
