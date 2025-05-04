"use client";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../../lib/firebase"; 
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Play() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gameName, setGameName] = useState<string>("");
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
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const username = (profile as any).username || "Spelare 1";
    const decksList = (profile as any). decks || "";
    


    try {
      const gameRef = await addDoc(collection(db, "games"), {
        name: gameName,
        player1: user.uid,
        player1Name: username,
        player1Deck: null, // Don't assign here, let them select
        player2: null,
        player2Name: null,
        player2Deck: null,
        player1Move: null,
        player2Move: null,
        decks: decksList, // 👈 Add all user's decks here
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
    <div className="p-4">
      <input
        type="text"
        placeholder="Spelets namn"
        value={gameName}
        onChange={e => setGameName(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
     />
      
      <button
        onClick={startGame}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Laddar..." : "Starta spel"}
      </button>
    </div>
  );
}
