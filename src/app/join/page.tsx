"use client";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar"; // Import Navbar component

export default function JoinGame() {
  const { user, loading } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const router = useRouter();

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
        player2Name: username,
        player2Deck: null,
        status: "waiting",
      });

      router.push(`/game/${gameId}`);
    } catch (err) {
      console.error("Failed to join the game:", err);
      alert("Kunde inte gå med i spelet, försök igen.");
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      await deleteDoc(doc(db, "games", gameId));
      setGames((prev) => prev.filter((game) => game.id !== gameId));
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
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setGames([]);
      alert("Alla spel har raderats.");
    } catch (err) {
      console.error("Failed to delete all games:", err);
      alert("Kunde inte radera alla spel, försök igen.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg">
         <Navbar /> {/* Include Navbar component */}
        <h2 className="text-2xl font-semibold mb-6 text-center text-black">Tillgängliga spel</h2>

        {games.length === 0 ? (
          <p className="text-center text-black">Inga spel att gå med i just nu...</p>
        ) : (
          <ul className="space-y-4">
            {games.map((game) => (
              <li key={game.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-2 text-black">Match: {game.name}</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => joinGame(game.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto"
                  >
                    Gå med i spelet
                  </button>
                  <button
                    onClick={() => deleteGame(game.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full sm:w-auto"
                  >
                    Radera spelet
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {games.length > 0 && (
          <button
            onClick={deleteAllGames}
            className="mt-6 w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Radera alla spel
          </button>
        )}
      </div>
    </div>
  );
}
