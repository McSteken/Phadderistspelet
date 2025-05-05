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
          console.log("Player 1 ID:", gameData?.player1);
          console.log("Player 2 ID:", gameData?.player2);
          console.log("Current User ID:", user?.uid);

          // Filter available decks based on the current user's ID
          if (gameData?.player1 === user.uid) {
            setAvailableDecks(decksList);
          }
          if (gameData?.player2 === user.uid) {
            setAvailableDecks(decksList);
          }

          // Check if the user has selected a deck
          const player1HasDeck = gameData?.player1Deck;
          const player2HasDeck = gameData?.player2Deck;

          setPlayer1DeckSelected(!!gameData?.player1Deck);
          setPlayer2DeckSelected(!!gameData?.player2Deck);

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

      <div className="flex flex-col gap-4 mt-8">
        <h3>Välj ett deck:</h3>
        {availableDecks && availableDecks.map((deck: Deck) => (
          <button key={deck.id} onClick={() => handleDeckSelection(deck)} className="btn">
            {deck.name}
          </button>
        ))}
      </div>

      {isGameReady && (
        <button onClick={startGame} className="btn-start">
          Starta Spelet
        </button>
      )}
    </div>
  );
}
