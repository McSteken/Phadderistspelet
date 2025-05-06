"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../components/card";
import CustomButton from "@/app/components/customButton";

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
    ({ card: UnlockedCard; playedBy: string | null } | null)[]
  >(Array(6).fill(null));
  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [mobileSelectedCard, setMobileSelectedCard] = useState<UnlockedCard | null>(null);
  

  useEffect(() => {
    if (!gameId || !user) return;

    const fetchProfile = async () => {
      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const decksList = (profile as any).decks || [];

        const matchRef = doc(db, "games", gameId as string);
        const unsub = onSnapshot(matchRef, (snapshot) => {
          if (!snapshot.exists()) {
            console.error("Game not found!");
            router.push("/");
            return;
          }

          const gameData = snapshot.data();
          setGame(gameData);

          if (gameData?.player1 === user.uid || gameData?.player2 === user.uid) {
            setAvailableDecks(decksList);
          }

          setPlayer1DeckSelected(!!gameData?.player1Deck);
          setPlayer2DeckSelected(!!gameData?.player2Deck);

          if (gameData?.status === "in_progress") {
            const deckId =
              gameData.player1 === user.uid ? gameData.player1Deck : gameData.player2Deck;
            const selected = decksList.find((deck: Deck) => deck.id === deckId);
          
            if (selected) {
              setSelectedDeck((prev) => {
                // Only set hand if we haven't already
                if (!prev) {
                  const random3Cards = selected.cards.sort(() => 0.5 - Math.random()).slice(0, 3);
                  setHand(random3Cards);
                }
                return selected;
              });
            }
          }
          

          if (gameData?.board) {
            setCardsOnBoard(gameData.board);
          }

          setLoading(false);
        });

        return unsub;
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchProfile();
  }, [gameId, user, router]);

  if (loading || !user) {
    return <div className="p-4">Laddar spel…</div>;
  }

  const isPlayer1 = game.player1 === user.uid;
  const allowedSlots = isPlayer1 ? [3, 4, 5] : [0, 1, 2];

  const handleDeckSelection = (deck: Deck) => {
    setSelectedDeck(deck);

    const updatedGameData = {
      ...game,
      [isPlayer1 ? "player1Deck" : "player2Deck"]: deck.id,
    };

    const gameRef = doc(db, "games", gameId!);
    updateDoc(gameRef, updatedGameData)
      .then(() => {
        if (isPlayer1) setPlayer1DeckSelected(true);
        else setPlayer2DeckSelected(true);
      })
      .catch((err) => console.error("Failed to update deck selection:", err));
  };

  const startGame = async () => {
    if (!gameId || !player1DeckSelected || !player2DeckSelected) return;
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        status: "in_progress",
        board: Array(6).fill(null),
      });
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const handleCardDrop = async (card: UnlockedCard, slotIndex: number) => {
    const realIndex = isPlayer1 ? slotIndex : 5 - slotIndex;

    if (!allowedSlots.includes(realIndex)) return;
    if (cardsOnBoard[realIndex] !== null) return;

    const updatedBoard = [...cardsOnBoard];
    updatedBoard[realIndex] = {
      card,
      playedBy: user.uid,
    };

    setHand((prev) => prev.filter((c) => c.id !== card.id));
    setCardsOnBoard(updatedBoard);
    
   

    const gameRef = doc(db, "games", gameId!);
    await updateDoc(gameRef, { board: updatedBoard });
  };

  const isGameReady = player1DeckSelected && player2DeckSelected;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Spel: {game.name}</h2>
      <p>Player 1: {game.player1Name}</p>
      <p>Player 2: {game.player2Name || "Väntar på spelare..."}</p>
      <p>Status: {game.status}</p>

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
          {isGameReady && (
            <CustomButton variant="primary" onClick={startGame}>
              Start Game
            </CustomButton>
          )}
        </div>
      )}

      {game.status === "in_progress" && (
        <div className="flex flex-col items-center justify-between min-h-screen">
          <div className="flex flex-col justify-center items-center gap-y-10 w-[55vw] h-[80vh] mx-auto rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.3)] [transform:perspective(700px)_rotateX(30deg)] bg-[url('/images/table2.png')] bg-cover bg-center bg-no-repeat">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-16 justify-center">
                {[0, 1, 2].map((col) => {
                  const index = row * 3 + col;
                  const boardIndex = isPlayer1 ? index : 5 - index;
                  const tile = cardsOnBoard[boardIndex];
                  const isAllowed = allowedSlots.includes(boardIndex);

                  return (
                    <div
                      key={index}
                      className={`w-[120px] h-[160px] border-2 rounded-lg flex items-center justify-center relative transition-transform duration-300
                        ${isAllowed ? "border-purple-500 border-dashed bg-white/30" : "border-gray-300 bg-white/10"}
                        ${!tile ? "hover:scale-110 cursor-pointer" : ""}
                      `}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const cardId = e.dataTransfer.getData("cardId");
                        const card = hand.find((c) => c.id === cardId);
                        if (card) handleCardDrop(card, index);
                      }}
                      onClick={() => {
                        if (isMobile && mobileSelectedCard && !tile) {
                          handleCardDrop(mobileSelectedCard, index);
                          setMobileSelectedCard(null);
                          setFocusedCardId(null);
                        }
                      }}
                    >
                      {tile?.card ? (
                        <Card cardId={tile.card.id} collectionName={tile.card.collection} />
                      ) : (
                        <p className="text-gray-400 text-sm">Place card</p>
                      )}
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
