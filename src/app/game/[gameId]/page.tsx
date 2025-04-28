// app/game/[gameId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";  // Adjust path to your firebase config
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext"; // Adjust path to your AuthContext
import Card from "../../components/card";

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

export default function GamePage() {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { gameId } = useParams();
  const { user } = useAuth();
  const [cardsOnBoard, setCardsOnBoard] = useState<(UnlockedCard | null)[]>([null, null, null]);
  const [hand, setHand] = useState<UnlockedCard[]>([]);


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

  const handleCardDrop = (card: UnlockedCard, slotIndex: number) => {
    if (cardsOnBoard[slotIndex] === null) {
      setCardsOnBoard((prev) => {
        const updated = [...prev];
        updated[slotIndex] = card;
        return updated;
      });

      setHand((prev) => prev.filter((c) => c.id !== card.id)); // Remove card from hand
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Spel: {game.name}</h2>
      <p>Player 1: {game.player1Name} </p>
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
      <div className="flex flex-col items-center justify-between min-h-screen">
      {/* Table */}
      <div className="playboard flex gap-8 mt-10">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="card-slot border-2 border-dashed rounded-xl p-4 w-40 h-64 flex flex-col items-center justify-center bg-white shadow-md"
            onDragOver={(e) => e.preventDefault()} // Allow dropping
            onDrop={(e) => {
              const cardId = e.dataTransfer.getData("cardId");
              const card = hand.find((c) => c.id === cardId);
              if (card) handleCardDrop(card, index);
            }}
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

      {/* Hand */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-0">
        {hand.map((card, index) => (
          <div
            key={card.id}
            className={`relative w-50 h-48 cursor-pointer transform transition-transform duration-300 hover:-translate-y-6`}
            style={{
              marginLeft: index > 0 ? '-2rem' : '0', // Overlap cards
              marginRight: index < hand.length - 1 ? '-2rem' : '0', // Overlap cards
              rotate: `${index * 5}deg`, // Slight rotation for effect
              zIndex: index, // Ensure proper stacking
            }}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
          >
            <Card cardId={card.id} collectionName={card.collection} />
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
