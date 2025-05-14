"use client";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../../lib/firebase"; 
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/navbar"; // 
import LoadingSpinner from "../components/loadingSpinner";

export default function Play() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gameName, setGameName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");

  const startGame = async () => {
    if (loading) {
      return alert("Laddar användare, försök igen om en sekund...");
    }

    if (!user || !user.uid) {
      return alert("Du måste vara inloggad!");
    }

    if (!gameName.trim()) {
      return alert("Ge ditt spel ett namn!");
    }

    setIsSubmitting(true);

    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const username = (profile as any).username || "Spelare 1";
    const profilePic = (profile as any).photoURL || null;

    try {
      const gameRef = await addDoc(collection(db, "games"), {
        name: gameName,
        player1: user.uid,
        player1Name: username,
        player1ProfilePic: profilePic,
        player1Deck: null, // Don't assign here, let them select
        player2: null,
        player2Name: null,
        player2Deck: null,
        player1Move: null,
        player2Move: null,
        status: "waiting",
        createdAt: serverTimestamp(),
      });
      

      router.push(`/game/${gameRef.id}`);
    } catch (err) {
      console.error("Något gick fel vid skapandet av spelet:", err);
      alert("Kunde inte skapa spelet, försök igen.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-gray-800 to-gray-200 overflow-hidden max-h-screen">
      <Navbar /> {/* Include Navbar component */}
      <div className="flex flex-col items-center p-4 bg-gray-300 rounded-lg shadow-md w-1/3 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 mt-2">Skapa ett nytt spel</h1>
        <h2 className="text-2xl text-gray-600">Välj ett namn för ditt spel</h2>
        <input
          type="text"
          placeholder="Namn"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          className="w-3/4 mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-800 bg-gray-200 text-gray-800"
        />
        {isSubmitting ? (
            <LoadingSpinner />
          ) : (
            <button
              onClick={startGame}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              Skapa Spel
            </button>          

            )}

      </div>
    </div>
  );
}
