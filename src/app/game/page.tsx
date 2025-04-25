// app/game/[gameId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../lib/firebase";  // Adjust path to your firebase config
import { doc, getDoc } from "firebase/firestore";

export default function GamePage() {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { gameId } = useParams(); // Getting the dynamic part from the URL

  useEffect(() => {
    if (!gameId) return;

    const fetchGameData = async () => {
      try {
        const gameDocRef = doc(db, "games", gameId as string);
        const gameDoc = await getDoc(gameDocRef);
        if (gameDoc.exists()) {
          setGame(gameDoc.data());
        } else {
          console.error("Game not found!");
          router.push("/"); // Redirect if the game does not exist
        }
      } catch (error) {
        console.error("Error fetching game data: ", error);
        router.push("/"); // Redirect if there was an error
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  if (loading) return <div>Laddar spelet...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Spel: {gameId}</h2>
      <p>Player 1: {game.player1}</p>
      <p>Player 2: {game.player2 || "Väntar på spelare..."}</p>
      <p>Status: {game.status}</p>

      {/* Display game moves or interaction */}
      {game.status === "in_progress" && (
        <div>
          <p>Spelet är i gång!</p>
          {/* Here you can add further logic for choosing moves */}
        </div>
      )}

      {game.status === "waiting" && !game.player2 && (
        <p>Vänta på att den andra spelaren går med...</p>
      )}
    </div>
  );
}
