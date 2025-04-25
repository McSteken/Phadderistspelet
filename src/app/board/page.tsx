"use client";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../../lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Play() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const startGame = async () => {
    if (loading) {
      return alert("Laddar användare, försök igen om en sekund...");
    }

    if (!user || !user.uid) {
      return alert("Du måste vara inloggad!");
    }

    try {
      const gameRef = await addDoc(collection(db, "games"), {
        player1: user.uid,
        player2: null,
        player1Move: null,
        player2Move: null,
        status: "waiting",
        createdAt: serverTimestamp(),
      });

      router.push(`/game`);
    } catch (err) {
      console.error("Något gick fel vid skapandet av spelet:", err);
      alert("Kunde inte skapa spelet, försök igen.");
    }
  };

  return (
    <div className="p-4">
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
