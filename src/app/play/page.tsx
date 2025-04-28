"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import CustomButton from "../components/customButton";

type Deck = {
  id: string;
  name: string;
};

export default function PlayMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const fetchedDecks = data.decks || [];
          setDecks(fetchedDecks);
        }
      } catch (err) {
        console.error("Error fetching decks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [user]);

  const handlePlay = () => {
    if (!selectedDeckId) return;
    router.push(`/lobby?deckId=${selectedDeckId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Välj ett deck för att spela</h1>

      {loading ? (
        <p>Laddar dina decks...</p>
      ) : decks.length === 0 ? (
        <p>Inga decks hittades. Skapa ett först.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`w-full px-4 py-2 rounded ${
                selectedDeckId === deck.id
                  ? "bg-purple-700 text-white"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }`}
            >
              {deck.name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handlePlay}
        disabled={!selectedDeckId}
        className="mt-6 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Play
      </button>
      <CustomButton variant="primary" onClick={() => router.push("/join")} >Join</CustomButton>
    </div>
  );
}
