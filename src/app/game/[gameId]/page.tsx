"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, onSnapshot, getDoc, updateDoc, deleteDoc, collection, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../components/card";
import CustomButton from "@/app/components/customButton";
import UserBox from "./userBox";
import { FaCheck } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { stat } from "fs";
import Chat from "./chat"; 
import ReadyButton from "./ReadyButton";

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

  const [menuOpen, setMenuOpen] = useState(false);


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
  const [remainingDeckCards, setRemainingDeckCards] = useState<UnlockedCard[]>([]);
  const [handInitialized, setHandInitialized] = useState(false);
  

  useEffect(() => {
    if (!gameId || !user) return;
    
    const fetchProfile = async () => {
      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const decksList = (profile as any).decks || [];
        
    
        const matchRef = doc(db, "games", gameId as string);
        const unsub = onSnapshot(matchRef, async (snapshot) => {
          if (!snapshot.exists()) {
            console.error("Game not found!");
            router.push("/");
            return;
          }

          const gameData = snapshot.data();
          const isPlayer1 = gameData.player1 === user.uid;


          if (!gameData.player1 && !gameData.player2) {
            try {
              await deleteDoc(matchRef);
              console.log("Game deleted because both players left.");
              return; // exit early to prevent setting state for a deleted game
            } catch (err) {
              console.error("Failed to delete game:", err);
            }
          }
        

          setGame(gameData);
    
          if (gameData?.player1 === user.uid || gameData?.player2 === user.uid) {
            setAvailableDecks(decksList);
          }
    
          setPlayer1DeckSelected(!!gameData?.player1Deck);
          setPlayer2DeckSelected(!!gameData?.player2Deck);
    
          if (gameData?.status === "in_progress") {
            const handKey = isPlayer1 ? "player1Hand" : "player2Hand";
            const remainingKey = isPlayer1 ? "player1Remaining" : "player2Remaining";
            setHand(gameData[handKey] || []);
            setRemainingDeckCards(gameData[remainingKey] || []);
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
const getPowerFromCard = (card: any, index: number): number => {
  switch (index) {
    case 0: return card.power1Str ?? 0;
    case 1: return card.power2Str ?? 0;
    case 2: return card.power3Str ?? 0;
    default: return 0;
  }
};

const isEffective = (a: number, b: number) =>
  (a === 0 && b === 1) || (a === 1 && b === 2) || (a === 2 && b === 0);


const resolveTurn = async () => {
  const board = game.board;
  const gameRef = doc(db, "games", gameId!);

  const slot1 = game.player1SelectedSlot;
  const slot2 = game.player2SelectedSlot;

  const tile1 = board[slot1];
  const tile2 = board[slot2];

  if (!tile1?.card || !tile2?.card) return;

  const card1Snap = await getDoc(doc(db, tile1.card.collection, tile1.card.id));
  const card2Snap = await getDoc(doc(db, tile2.card.collection, tile2.card.id));
  if (!card1Snap.exists() || !card2Snap.exists()) return;

  const card1 = card1Snap.data();
  const card2 = card2Snap.data();

  const powerIndex1 = getPowerIndexFromSlot(slot1, true);
  const powerIndex2 = getPowerIndexFromSlot(slot2, false);

  const power1 = getPowerFromCard(card1, powerIndex1);
  const power2 = getPowerFromCard(card2, powerIndex2);

  const bonus1 = isEffective(powerIndex1, powerIndex2) ? 2 : 0;
  const bonus2 = isEffective(powerIndex2, powerIndex1) ? 2 : 0;

  const total1 = power1 + bonus1;
  const total2 = power2 + bonus2;

  let updatedScores = { ...game.scores };

  if (total1 > total2) {
    updatedScores.player1 += 1;
  } else if (total2 > total1) {
    updatedScores.player2 += 1;
  } // draw = no points

  // Check for win
  const winner = updatedScores.player1 >= 5
    ? game.player1Name
    : updatedScores.player2 >= 5
    ? game.player2Name
    : null;

  await updateDoc(gameRef, {
    board: Array(6).fill(null),
    player1Ready: false,
    player2Ready: false,
    player1Played: false,
    player2Played: false,
    player1SelectedSlot: null,
    player2SelectedSlot: null,
    scores: updatedScores,
    ...(winner && { status: "finished", winner }),
  });

  if (winner) {
    alert(`${winner} vinner matchen!`);
  }
};


// Ready funktioner

const handleReadyClick = async () => {
  const gameRef = doc(db, "games", gameId!);
  const field = isPlayer1 ? "player1Ready" : "player2Ready";
  await updateDoc(gameRef, { [field]: true });
};

useEffect(() => {
  if (game?.player1Ready && game?.player2Ready) {
    resolveTurn();
  }
}, [game]);



  if (loading || !user) {
    return <div className="p-4">Laddar spel…</div>;
  }

   const isPlayer1 = game.player1 === user.uid;
  const allowedSlots = isPlayer1 ? [3, 4, 5] : [0, 1, 2];

  const handleDeckSelection = (deck: Deck) => {
  const isSameDeck = selectedDeck?.id === deck.id;
  const playerPrefix = isPlayer1 ? "player1" : "player2";

  const gameRef = doc(db, "games", gameId!);

  if (isSameDeck) {
    setSelectedDeck(null);
    updateDoc(gameRef, {
      [`${playerPrefix}Deck`]: null,
      [`${playerPrefix}DeckCards`]: null,
    }).then(() => {
      if (isPlayer1) setPlayer1DeckSelected(false);
      else setPlayer2DeckSelected(false);
    }).catch((err) => console.error("Failed to update deck deselection:", err));
  } else {
    setSelectedDeck(deck);
    updateDoc(gameRef, {
      [`${playerPrefix}Deck`]: deck.id,
      [`${playerPrefix}DeckCards`]: deck.cards, // 🟢 Store full card list
    }).then(() => {
      if (isPlayer1) setPlayer1DeckSelected(true);
      else setPlayer2DeckSelected(true);
    }).catch((err) => console.error("Failed to update deck selection:", err));
  }
};


  const startGame = async () => {
  if (!gameId || !player1DeckSelected || !player2DeckSelected) return;

  const player1Deck = game.player1DeckCards;
  const player2Deck = game.player2DeckCards;

  if (!player1Deck || !player2Deck) return;

  const shuffled1 = [...player1Deck].sort(() => 0.5 - Math.random());
  const shuffled2 = [...player2Deck].sort(() => 0.5 - Math.random());

  const player1Hand = shuffled1.slice(0, 3);
  const player1Remaining = shuffled1.slice(3);

  const player2Hand = shuffled2.slice(0, 3);
  const player2Remaining = shuffled2.slice(3);

  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    status: "in_progress",
    board: Array(6).fill(null),
    player1Hand,
    player1Remaining,
    player2Hand,
    player2Remaining,
    
    player1SelectedSlot: null,
    player2SelectedSlot: null,
    player1Ready: false,
    player2Ready: false,
    player1Played: false,
    player2Played: false,
    scores: {
      player1: 0,
      player2: 0,
    },
    winner: null,
  });
};




  const leaveGame = async () => {
// if player leave game reset that player's deck and name
    if (!gameId) return;
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        [isPlayer1 ? "player1Deck" : "player2Deck"]: null,
        [isPlayer1 ? "player1Name" : "player2Name"]: null,
        [isPlayer1 ? "player1" : "player2"]: null,
        status: "waiting",
      });
      router.push("/play");
    } catch (error) {
      console.error("Failed to leave game:", error);
    }
  }
  
  const handleCardDrop = async (card: UnlockedCard, slotIndex: number) => {
  
  // only allow if player hasnt played yet
  if (game[isPlayer1 ? "player1Played" : "player2Played"]) {
    console.warn("Du har redan spelat denna runda.");
    return;
  }
  const realIndex = isPlayer1 ? slotIndex : 5 - slotIndex;


  if (!allowedSlots.includes(realIndex)) return;
  if (cardsOnBoard[realIndex] !== null) return;

  const updatedBoard = [...cardsOnBoard];
  updatedBoard[realIndex] = {
    card,
    playedBy: user.uid,
  };

  console.log(card.id, "dropped on slot", realIndex);

  try {
    const cardDocRef = doc(db, card.collection, card.id);
    const cardSnap = await getDoc(cardDocRef);

    if (cardSnap.exists()) {
      const cardData = cardSnap.data();

        const slotIndexForPlayer = allowedSlots.indexOf(realIndex);

  let powerIndex = slotIndexForPlayer;

  // Flip the order for player 2
  if (!isPlayer1) {
    powerIndex = 2 - slotIndexForPlayer;
  }

  switch (powerIndex) {
    case 0:
      console.log("Power 1:", cardData.power1Name, "-", cardData.power1Str);
      break;
    case 1:
      console.log("Power 2:", cardData.power2Name, "-", cardData.power2Str);
      break;
    case 2:
      console.log("Power 3:", cardData.power3Name, "-", cardData.power3Str);
      break;
    default:
      console.log("Dropped in invalid slot index for powers.");
  }

    } else {
      console.warn("Card data not found in collection:", card.collection, "with id:", card.id);
    }
  } catch (err) {
    console.error("Error fetching card details:", err);
  }

  const cardIndex = hand.findIndex((c) => c.id === card.id);
  if (cardIndex === -1) return;

  let newHand = [...hand];
  let newRemaining = [...remainingDeckCards];

  if (newRemaining.length > 0) {
    const [nextCard, ...rest] = newRemaining;
    newHand[cardIndex] = nextCard;
    newRemaining = rest;
  } else {
    newHand.splice(cardIndex, 1);
  }

  setCardsOnBoard(updatedBoard);
  setHand(newHand);
  setRemainingDeckCards(newRemaining);

  const gameRef = doc(db, "games", gameId!);
  const handKey = isPlayer1 ? "player1Hand" : "player2Hand";
  const remainingKey = isPlayer1 ? "player1Remaining" : "player2Remaining";

  await updateDoc(gameRef, {
    board: updatedBoard,
    [handKey]: newHand,
    [remainingKey]: newRemaining,
    [`${isPlayer1 ? "player1" : "player2"}Played`]: true,
    [`${isPlayer1 ? "player1" : "player2"}SelectedSlot`]: realIndex,
    [`${isPlayer1 ? "player1" : "player2"}Ready`]: true,

  });

  console.log("Player", isPlayer1 ? "1" : "2", "played status:", game[isPlayer1 ? "player1Played" : "player2Played"]);
  console.log("Player", isPlayer1 ? "1" : "2", "selected slot:", realIndex);
    console.log("Player", isPlayer1 ? "1" : "2", "ready status:", game[isPlayer1 ? "player1Ready" : "player2Ready"]);

};

const getPowerIndexFromSlot = (slot: number, isPlayer1: boolean) => {
  if (isPlayer1) return slot - 3;
  else return 2 - slot;
};


  

const isGameReady = player1DeckSelected && player2DeckSelected;

return (
  <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-gray-800 to-gray-200 overflow-hidden max-h-screen">
    {/*       
    <h2 className="text-2xl mb-4">Spel: {game.name}</h2>
    <p>Player 1: {game.player1Name}</p>
    <p>Player 2: {game.player2Name || "Väntar på spelare..."}</p>
    <p>Status: {game.status}</p> 
    */}
    {game.status === "in_progress" ? (
      <div className="flex justify-between w-full px-4 py-2 items-end bg-black bg-opacity-40">
        <p className="text-white text-sm mt-8">{game.player1Name}</p>
        <p className="text-white text-sm mt-8">{game.player2Name}</p>
      </div>
    ) : (
      <div className="flex justify-between w-screen px-4 mt-12 h-1/2">
        <UserBox
          name={game.player1Name || "Väntar på spelare..."}
          profilePicture={game.player1ProfilePic}
          isReady={player1DeckSelected}
        />
        <UserBox
          name={game.player2Name || "Väntar på spelare..."}
          profilePicture={game.player2ProfilePic}
          isReady={player2DeckSelected}
        />
      </div>
      )}

    {game.status !== "in_progress" && (
      <div className="flex justify-between w-screen px-4 mt-12 h-1/3">

        {/* decks */}
        <div className="grid grid-cols-3 grid-rows-4 gap-3 p-4 rounded-lg w-1/3 mx-auto  place-items-start items-start">
          <h2 className="font-bold text-gray-100 text-4xl mx-auto col-span-3">Välj ett deck:</h2>
          {availableDecks.map((deck: Deck) => (
            <button
              key={deck.id}
              onClick={() => handleDeckSelection(deck)}
              className={`bg-blue-600 text-white w-full h-12 rounded hover:bg-purple-700 flex items-center justify-center mx-auto hover:bg-purple-800 ${
                selectedDeck?.id === deck.id ? "ring-2 ring-gray-100 bg-purple-900" : ""}`}
            >
              <h2 className="text-sm">{deck.name}</h2>
              {selectedDeck?.id === deck.id && <FaCheck className="ml-2 text-green-400" />}
            </button>
          ))}
        </div>  

        <div className="absolute bottom-0 flex flex-col justify-center p-4 w-1/7 h-1/4 left-1/2 transform -translate-x-1/2 mb-7 gap-4 pb-8">
        {/* buttons */}
          <div className="">
          {isPlayer1 ? (

            <button
              onClick={startGame}
              disabled={!isGameReady}
              className={`bg-green-600 text-white px-4 py-2 rounded ${isGameReady ? "hover:bg-green-800 hover:border-gray-400 shadow-sm hover:shadow-md active:scale-95" : "opacity-50 cursor-wait"} transition duration-300 border-2 border-gray-300 w-full`}
            >
              Starta spelet 
            </button>
            ) : (
              <h2 className="text-gray-200 text-base text-center fade-in-out">
                {!player1DeckSelected || !player2DeckSelected
                  ? "Väntar på att alla spelare är redo..."
                  : `Väntar på att ${game.player1Name || "spelare 1"} ska starta spelet...`}
              </h2>
            )
            }
          </div>

          <div className="">
            <button
              onClick={leaveGame}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-300 border-2 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md active:scale-95 w-full"
            >
              Lämna spelet
            </button>
          </div>
        </div>



        {/* chat */}
        {game.status !== "in_progress" && (
          <div className=" w-1/3 mx-auto ">
            <Chat
              gameId={gameId!}
              userId={user.uid}
              senderName={game?.player1 === user.uid ? game.player1Name : game.player2Name}
            />
            </div>
        )}

    </div>

    )}

    {game.status === "in_progress" && (

      
      <>
      <div className="mt-6 flex items-center justify-center gap-10">
        <div className="bg-white rounded px-4 py-2 shadow-md text-center min-w-[100px]">
          <p className="text-gray-700 font-semibold">{game.player1Name}</p>
          <p className="text-2xl font-bold text-purple-700">{game.scores?.player1 ?? 0}</p>
        </div>
        <div className="text-white font-bold text-xl">VS</div>
        <div className="bg-white rounded px-4 py-2 shadow-md text-center min-w-[100px]">
          <p className="text-gray-700 font-semibold">{game.player2Name}</p>
          <p className="text-2xl font-bold text-purple-700">{game.scores?.player2 ?? 0}</p>
        </div>
      </div>



      <div className="flex flex-col items-center justify-between min-h-screen">
        <div className="flex flex-col justify-center items-center gap-y-10 w-[55vw] h-[80vh] mx-auto -mt-10 rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.3)] [transform:perspective(700px)_rotateX(25deg)] bg-[url('/images/table2.png')] bg-cover bg-center bg-no-repeat">
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

      {/* Ready knapp */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <ReadyButton
          isReady={game[isPlayer1 ? "player1Ready" : "player2Ready"]}
          onClick={handleReadyClick}
        />
        <p className="text-white text-sm">
          {game[isPlayer1 ? "player2Ready" : "player1Ready"]
            ? "Motståndaren är redo!"
            : "Motståndaren väntar..."}
        </p>
      </div>


      {/* Menu Button */}
      <div className="absolute bottom-4 left-24 z-50">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-gray-400 text-white p-3 rounded-full shadow-lg hover:bg-purple-600"
        >
          <FaBars size={40} className="text-purple-600"/>
        </button>

        {/* Dropdown Menu */}
        <div
          className={`transition-all duration-300 origin-bottom-left transform ${
            menuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
          } mt-2 bg-white rounded-lg shadow-md overflow-hidden`}
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              alert("Visa regler här (eller öppna modal)");
            }}
            className="block px-4 py-2 text-left text-gray-800 hover:bg-gray-100 w-full"
          >
            Regler
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              leaveGame(); // assuming you already have a leaveGame() function
            }}
            className="block px-4 py-2 text-left text-red-600 hover:bg-red-100 w-full"
          >
            Ge upp
          </button>
        </div>
      </div>


      <div className="absolute bottom-0 right-0 p-4 h-2/6 w-2/7 ">
      
        <div className="relative w-full h-full">
          {/* Background Layer */}
          <div className="absolute inset-0 bg-gray-800 opacity-50 rounded-lg z-0" />

          {/* Foreground: Chat */}
          <div className="relative z-10 h-full">
            <Chat
              gameId={gameId!}
              userId={user.uid}
              senderName={game?.player1 === user.uid ? game.player1Name : game.player2Name}
            />
          </div>

        </div>

      </div>
      </>
      )}
      
    </div>
  );
}
