"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
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
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [hand, setHand] = useState<UnlockedCard[]>([]);
  const [player1DeckSelected, setPlayer1DeckSelected] = useState(false);
  const [player2DeckSelected, setPlayer2DeckSelected] = useState(false);
  const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
  const router = useRouter();
  const rawParams = useParams();
  const gameId = Array.isArray(rawParams?.gameId) ? rawParams.gameId[0] : rawParams?.gameId;
  const { user } = useAuth();
  const [cardsOnBoard, setCardsOnBoard] = useState<(UnlockedCard | null)[]>([null, null, null]);

  useEffect(() => {
    if (!gameId || !user) return;

    const fetchProfile = async () => {
      try {
        // Fetch the user's profile
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const decksList = (profile as any).decks || [];

        console.log("User's Decks:", decksList); // Log decks

        // Fetch the game data
        const matchRef = doc(db, "games", gameId as string);
        const unsub = onSnapshot(matchRef, (snapshot) => {
          if (!snapshot.exists()) {
            console.error("Game not found!");
            router.push("/");
            return;
          }

          const gameData = snapshot.data();
          setGame(gameData);
        
          // Filter available decks based on the current user's ID
          if (gameData?.player1 === user.uid) {
            setAvailableDecks(decksList);
          }
          if (gameData?.player2 === user.uid) {
            setAvailableDecks(decksList);
          }

          setPlayer1DeckSelected(!!gameData?.player1Deck);
          setPlayer2DeckSelected(!!gameData?.player2Deck);

          if (gameData?.status === "in_progress") {
            const deckId = gameData.player1 === user.uid
              ? gameData.player1Deck
              : gameData.player2Deck;
  
            const selected = decksList.find((deck: Deck) => deck.id === deckId);
            if (selected) {
              setSelectedDeck(selected);
              setHand(selected.cards); // Set hand to deck's cards
            }
          }

          setLoading(false);
        }, (err) => {
          console.error(err);
          router.push("/");
        });

        return unsub;

      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchProfile();
  }, [gameId, user, router]);

  // ← EARLY RETURN if loading or user is null
  if (loading || !user) {
    return <div className="p-4">Laddar spel…</div>;
  }

  const handleDeckSelection = (deck: Deck) => {
    console.log("Deck selected:", deck);
    setSelectedDeck(deck);
    console.log("Deck selected:", deck);

    const updatedGameData = {
      ...game,
      [game.player1 === user.uid ? "player1Deck" : "player2Deck"]: deck.id,
    };

    const gameRef = gameId ? doc(db, "games", gameId) : null;

    if (!gameRef) {
      console.error("Invalid gameId:", gameId);
      return;
    }

    // Proceed with Firestore update if gameRef is valid
    updateDoc(gameRef, updatedGameData)
    
      .then(() => {
        console.log("hej2")
        if (game.player1 === user.uid) {
          console.log("hej")
          setPlayer1DeckSelected(true);
        } else {
          setPlayer2DeckSelected(true);
        }
      })
      .catch((err) => console.error("Failed to update deck selection:", err));
  };

  const startGame = async () => {
    console.log("1");
    if (!gameId || !player1DeckSelected || !player2DeckSelected) return;
    console.log("2");
    try {
      console.log("3");
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, { status: "in_progress" });
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  // Check if both players have selected their decks
  const isGameReady = player1DeckSelected && player2DeckSelected;
  console.log("player1 deck ready?", player2DeckSelected);

  const handleCardDrop = (card: UnlockedCard, slotIndex: number) => {
    if (cardsOnBoard[slotIndex] === null) {
      setCardsOnBoard((prev) => {
        const updated = [...prev];
        updated[slotIndex] = card;
        return updated;
      });
  
      setHand((prev) => prev.filter((c) => c.id !== card.id));
    }
  };


  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Spel: {game.name}</h2>
      <p>Player 1: {game.player1Name}</p>
      <p>Player 2: {game.player2Name || "Väntar på spelare..."}</p>
      <p>Status: {game.status}</p>
  
      {game.status === "waiting" && !game.player2 && (
        <p>Väntar på att den andra spelaren går med…</p>
      )}
  
      {/* Deck selection when game hasn't started */}
      {game.status !== "in_progress" && (
        <div className="flex flex-col gap-4 mt-8">
          <h3>Välj ett deck:</h3>
          {availableDecks.map((deck: Deck) => (
            <button
              key={deck.id}
              onClick={() => handleDeckSelection(deck)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              {deck.name}
            </button>
          ))}
  
          {/* Start game button */}
          {isGameReady && (
            <button
              onClick={startGame}
              className="mt-6 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Starta Spelet
            </button>
          )}
        </div>
      )}
  
      {/* Game board when in progress */}
      {game.status === "in_progress" && (
        <div className="flex flex-col items-center justify-between min-h-screen">
          <div className="playboard flex gap-8 mt-10">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="card-slot border-2 border-dashed rounded-xl p-4 w-40 h-64 flex flex-col items-center justify-center bg-white shadow-md"
                onDragOver={(e) => e.preventDefault()}
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
  
          {/* Player hand */}
          <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-0">
            {hand.map((card, index) => (
              <div
                key={card.id}
                className="relative w-40 h-56 cursor-pointer transform transition-transform duration-300 hover:-translate-y-6"
                style={{
                  marginLeft: index > 0 ? "-2rem" : "0",
                  marginRight: index < hand.length - 1 ? "-2rem" : "0",
                  rotate: `${index * 5}deg`,
                  zIndex: index,
                }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
              >
                <Card cardId={card.id} collectionName={card.collection} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
}
