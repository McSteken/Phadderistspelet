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
  const router = useRouter();
  const rawParams = useParams();
  const gameId = Array.isArray(rawParams?.gameId) ? rawParams.gameId[0] : rawParams?.gameId;
  const { user } = useAuth(); // Make sure user is retrieved from context

  useEffect(() => {
    if (!gameId || !user) return;

    const fetchProfile = async () => {
      try {
        // Fetch the user's profile
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const decksList = (profile as any).decks || [];

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

          // Check if the user has selected a deck
          const player1HasDeck = gameData?.player1Deck;
          const player2HasDeck = gameData?.player2Deck;

          if (gameData.player1 === user.uid && player1HasDeck) {
            setPlayer1DeckSelected(true);
          }

          if (gameData.player2 === user.uid && player2HasDeck) {
            setPlayer2DeckSelected(true);
          }

          // Fetch the active deck from user's decks (for hand)
          if (gameData?.player1Deck === user.uid) {
            const activeDeck = decksList.find((deck: Deck) => deck.id === gameData?.player1Deck);
            if (activeDeck) {
              setHand(activeDeck.cards); // Set the user's hand based on the deck cards
            }
          }

          if (gameData.player1 === user.uid && gameData.player1Deck) {
            setHand(gameData.player1Deck.cards);
          }
          if (gameData.player2 === user.uid && gameData.player2Deck) {
            setHand(gameData.player2Deck.cards);
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
    setSelectedDeck(deck);

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
        if (game.player1 === user.uid) {
          setPlayer1DeckSelected(true);
        } else {
          setPlayer2DeckSelected(true);
        }
      })
      .catch((err) => console.error("Failed to update deck selection:", err));
  };

  const startGame = async () => {
    if (!gameId || !player1DeckSelected || !player2DeckSelected) return;

    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, { status: "in_progress" });
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  // Check if both players have selected their decks
  const isGameReady = player1DeckSelected && player2DeckSelected;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Spel: {game.name}</h2>
      <p>Player 1: {game.player1Name} </p>
      <p>Player 2: {game.player2Name || "Väntar på spelare..."}</p>
      <p>Status: {game.status}</p>

      {game.status === "in_progress" && (
        <div>
          <p>Spelet är igång!</p>
        </div>
      )}

      {game.status === "waiting" && !game.player2 && (
        <p>Vänta på att den andra spelaren går med…</p>
      )}

      <div className="flex flex-col items-center justify-between min-h-screen">
        {/* Deck selection */}
        {game.status === "waiting" && !player1DeckSelected && !player2DeckSelected && (
          <div>
            <h3 className="text-lg mb-4">Välj ett deck</h3>
            <div className="flex flex-col gap-4">
              {game.decks.map((deck: Deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleDeckSelection(deck)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  {deck.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Game button */}
        {game.status === "waiting" && isGameReady && (
          <button
            onClick={startGame}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}
