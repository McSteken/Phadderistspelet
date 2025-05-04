// pages/join.tsx
"use client";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function JoinGame() {
  const { user, loading } = useAuth();
  const [games, setGames] = useState<any[]>([]); // to store the list of waiting games
  const router = useRouter();

  // Fetch games that are in the "waiting" status and don't have a player2
  useEffect(() => {
    if (loading) return;
    const fetchGames = async () => {
      const gamesQuery = query(
        collection(db, "games"),
        where("status", "==", "waiting"),
        where("player2", "==", null)
      );

      const querySnapshot = await getDocs(gamesQuery);
      const gamesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGames(gamesList);
    };

    fetchGames();
  }, [loading]);

  // Function to join a game
  const joinGame = async (gameId: string) => {
    if (!user || !user.uid) {
      alert("Du måste vara inloggad!");
      return;
    }

    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const username = (profile as any).username || "Spelare 2";
  
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        player2: user.uid,
        player2Name: username || "Spelare 2",
        //status: "in_progress", // Update the game status once two players have joined
      });

      router.push(`/game/${gameId}`); // Navigate to the game page
    } catch (err) {
      console.error("Failed to join the game:", err);
      alert("Kunde inte gå med i spelet, försök igen.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Tillgängliga spel</h2>
      {games.length === 0 ? (
        <p>Inga spel att gå med i just nu...</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game.id} className="mb-4">
              <h2>Match: {game.name}</h2>
              <button
                onClick={() => joinGame(game.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Gå med i spelet
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
