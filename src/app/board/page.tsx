"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Card from "../components/card";

// Types
type UnlockedCard = {
  id: string;
  collection: "Legionen" | "Skurkeriet";
};

type Deck = {
  id: string;
  name: string;
  cards: UnlockedCard[];
};

const BoardPage = () => {
  const { user } = useAuth();
  const [cardsOnBoard, setCardsOnBoard] = useState<(UnlockedCard | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  // Load from first saved deck
  useEffect(() => {
    const fetchDeck = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const data = userSnap.data();
        const decks: Deck[] = data.decks || [];

        if (decks.length > 0) {
          const firstDeck = decks[0];
          const selectedCards = firstDeck.cards.slice(0, 3);
          const filledSlots = [0, 1, 2].map((i) => selectedCards[i] || null);
          setCardsOnBoard(filledSlots);
        }
      } catch (err) {
        console.error("Error loading deck:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [user]);

  const handleCardDrop = (card: UnlockedCard, slotIndex: number) => {
    setCardsOnBoard((prev) => {
      const updated = [...prev];
      updated[slotIndex] = card;
      return updated;
    });
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Laddar ditt deck...</p>
      </main>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="playboard flex gap-8">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="card-slot border-2 border-dashed rounded-xl p-4 w-40 h-64 flex flex-col items-center justify-center bg-white shadow-md"
            
          >
            {cardsOnBoard[index] ? (
              <Card
                cardId={cardsOnBoard[index]!.id}
                collectionName={cardsOnBoard[index]!.collection}
              />
            ) : (
              <p className="text-gray-400">Tom</p>
            )}
            <p className="mt-2 font-semibold text-sm text-gray-600">
              {index + 1}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardPage;
