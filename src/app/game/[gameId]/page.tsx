"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../components/card";
import CustomButton from "@/app/components/customButton";

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
  const [cardsOnBoard, setCardsOnBoard] = useState<
  ({ card: UnlockedCard; playedBy: string | null } | null)[]>(Array(6).fill(null));
  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [mobileSelectedCard, setMobileSelectedCard] = useState<UnlockedCard | null>(null);



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
          if (gameData?.board) {
            setCardsOnBoard(gameData.board);
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
    if (!gameId || !player1DeckSelected || !player2DeckSelected) return;
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, { status: "in_progress" });
      await updateDoc(gameRef, {
        status: "in_progress",
        board: [null, null, null], // ← empty slots
      });
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  // två bools
  const isGameReady = player1DeckSelected && player2DeckSelected;

  const handleCardDrop = async (card: UnlockedCard, slotIndex: number) => {
    if (cardsOnBoard[slotIndex] === null) {
      const updatedBoard = [...cardsOnBoard];
      updatedBoard[slotIndex] = {
        card,
        playedBy: user.uid
      };
      setCardsOnBoard(updatedBoard);
      setHand((prev) => prev.filter((c) => c.id !== card.id));

      // 🔥 Save to Firestore
      const gameRef = doc(db, "games", gameId as string);
      await updateDoc(gameRef, {
        board: updatedBoard,
      });
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
            <CustomButton variant="primary" onClick={startGame}>
              Start Game
            </CustomButton>
          )}
        </div>
      )}

      {/* Game board when in progress */}
      {game.status === "in_progress" && (
        <div className="flex flex-col items-center justify-between min-h-screen">
          {/* Game board */}
          <div className="flex flex-col justify-center items-center gap-y-10 w-[55vw] h-[80vh] mx-auto rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.3)] [transform:perspective(700px)_rotateX(30deg)] bg-[url('/images/table2.png')] bg-cover bg-center bg-no-repeat">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-16 justify-center">
                {[0, 1, 2].map((col) => {
                  const index = row * 3 + col;
                  const tile = cardsOnBoard[index];
                  
                  return (
                    <div
                      key={index}
                      className="w-[120px] h-[160px] border-2 border-dashed rounded-lg bg-white/20 flex items-center justify-center relative transition-transform transition-transform duration-300 hover:scale-110"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const cardId = e.dataTransfer.getData("cardId");
                        const card = hand.find((c) => c.id === cardId);
                        if (card) handleCardDrop(card, index);
                      }}
                      onClick={() => {
                        if (isMobile && mobileSelectedCard && cardsOnBoard[index] === null) {
                          handleCardDrop(mobileSelectedCard, index);
                          setMobileSelectedCard(null);
                          setFocusedCardId(null);
                        }
                      }}
                      
                    >
                      {tile?.card ? (
                        <Card
                          cardId={tile.card.id}
                          collectionName={tile.card.collection}
                        />
                      ) : (
                        <p className="text-gray-400">Place a card</p>
                      )}
                      <p className="mt-2 font-semibold text-sm text-gray-600">
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Player hand */}
          <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-0">
            {hand.map((card, index) => {
              const isFocused = focusedCardId === card.id;
              const isSelected = mobileSelectedCard?.id === card.id;
              const defaultRotation = `${(index - hand.length / 2 + 0.5) * 5}deg`;

              return (
                <div
                  key={card.id}
                  className={`relative w-40 h-56 cursor-pointer transition-transform duration-300 ${
                    !isMobile ? "hover:-translate-y-12 hover:scale-150" : ""
                  } ${isSelected ? "ring-4 ring-purple-500" : ""}`}
                  style={{
                    marginLeft: index > 0 ? "-1.5rem" : "0",
                    marginRight: index < hand.length - 1 ? "-1.5rem" : "0",
                    rotate: isMobile && isFocused ? "0deg" : defaultRotation,
                    zIndex: isMobile && isFocused ? 100 : index,
                    transform: isMobile && isFocused ? "translateY(-50%) scale(2)" : undefined,
                  }}
                  draggable={!isMobile}
                  onDragStart={
                    !isMobile
                      ? (e) => e.dataTransfer.setData("cardId", card.id)
                      : undefined
                  }
                  onMouseEnter={
                    !isMobile
                      ? (e) => {
                          e.currentTarget.style.rotate = "0deg";
                          e.currentTarget.style.zIndex = "100";
                        }
                      : undefined
                  }
                  onMouseLeave={
                    !isMobile
                      ? (e) => {
                          e.currentTarget.style.rotate = defaultRotation;
                          e.currentTarget.style.zIndex = `${index}`;
                        }
                      : undefined
                  }
                  onClick={() => {
                    if (isMobile) {
                      setMobileSelectedCard((prev) => (prev?.id === card.id ? null : card));
                      setFocusedCardId((prev) => (prev === card.id ? null : card.id));
                    }
                  }}
                >
                  <Card cardId={card.id} collectionName={card.collection} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
