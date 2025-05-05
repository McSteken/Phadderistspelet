// pages/join.tsx
"use client";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
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
        player2Deck: null, // Player2 Deck is initially null
        status: "waiting", // Keep the game status as waiting if Player 2 hasn't selected a deck
      });

      router.push(`/game/${gameId}`); // Navigate to the game page
    } catch (err) {
      console.error("Failed to join the game:", err);
      alert("Kunde inte gå med i spelet, försök igen.");
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      const gameRef = doc(db, "games", gameId);
      await deleteDoc(gameRef); // Delete the game document
      setGames((prevGames) => prevGames.filter((game) => game.id !== gameId)); // Update the local state
      alert("Spelet har raderats.");
    } catch (err) {
      console.error("Failed to delete the game:", err);
      alert("Kunde inte radera spelet, försök igen.");
    }
  };


  const deleteAllGames = async () => {
    try {
      const gamesQuery = query(collection(db, "games"));
      const querySnapshot = await getDocs(gamesQuery);

      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref)); // Delete all games
      await Promise.all(deletePromises);

      setGames([]); // Clear the local state
      alert("Alla spel har raderats.");
    } catch (err) {
      console.error("Failed to delete all games:", err);
      alert("Kunde inte radera alla spel, försök igen.");
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
              <button
                onClick={() => deleteGame(game.id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Radera spelet
              </button>

            </li>
          ))}
        </ul>
      )}
      <button
        onClick={deleteAllGames}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-4"
      >
        Radera alla spel
      </button>

    </div>
  );
}
