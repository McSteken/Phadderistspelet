"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Card from "../components/card";
import Navbar from "../components/navbar";

type UnlockedCard = {
  id: string;
  collection: "Legionen" | "Skurkeriet";
};

type Deck = {
  id: string;
  name: string;
  cards: UnlockedCard[];
};

type DeckManagerProps = {
  user: any;
  unlockedCards: UnlockedCard[];
  setViewMode: (mode: "cards" | "decks") => void;
};

export default function DeckManager({ user, unlockedCards, setViewMode }: DeckManagerProps) {
  const [selectedCards, setSelectedCards] = useState<UnlockedCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [deckMode, setDeckMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;
      const data = userSnap.data();
      setDecks(data.decks || []);
      setActiveDeckId(data.activeDeckId || null);
    };

    fetchDecks();
  }, [user]);

  const selectedDeck = decks.find((d) => d.id === activeDeckId);

  const toggleCardSelection = (card: UnlockedCard) => {
    if (!deckMode) return;
    const isSelected = selectedCards.some((c) => c.id === card.id && c.collection === card.collection);
    setSelectedCards((prev) =>
      isSelected ? prev.filter((c) => c.id !== card.id || c.collection !== card.collection) : [...prev, card]
    );
  };

  const saveDeck = async () => {
    if (!user || selectedCards.length === 0 || !newDeckName.trim()) return;

    const userRef = doc(db, "users", user.uid);
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: newDeckName,
      cards: selectedCards,
    };

    const updatedDecks = [...decks, newDeck];
    try {
      await updateDoc(userRef, { decks: updatedDecks });
      setDecks(updatedDecks);
      setSelectedCards([]);
      setNewDeckName("");
      setDeckMode(false);
      alert("Ditt deck har sparats!");
    } catch (error) {
      console.error("Failed to save deck:", error);
      alert("Något gick fel när decket skulle sparas.");
    }
  };

  const deleteActiveDeck = async () => {
    if (!user || !activeDeckId) return;

    const updatedDecks = decks.filter((d) => d.id !== activeDeckId);
    const userRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userRef, {
        decks: updatedDecks,
        activeDeckId: updatedDecks.length > 0 ? updatedDecks[0].id : null,
      });
      setDecks(updatedDecks);
      setActiveDeckId(updatedDecks[0]?.id || null);
      alert("Decket har raderats.");
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  };

  return (
    <div className="ml-[20%] w-4/5 px-8 pb-20">
        <h2 className="text-4xl font-bold mb-6 mx-auto">Mina decks</h2>

      <div className="flex gap-4 mb-2">

        {deckMode && (
            <>
            <input
                type="text"
                placeholder="Namn på deck"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="px-3 py-2 border rounded"
            />
            <button
                onClick={saveDeck}
                disabled={selectedCards.length === 0 || !newDeckName.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
                Spara Deck ({selectedCards.length}/10)
            </button>
            <button
                onClick={() => {
                    setDeckMode(false);
                    setSelectedCards([]);
                    setNewDeckName("");
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
            Avbryt
            </button>
            </>
        )}
      </div>

      {decks.length > 0 && !deckMode && (
        <div className="mb-8">
            <div className="flex flex-col mb-14 justify-between mr-8">
                <div className="grid grid-cols-5 gap-4 w-full">
                    {decks.map((deck) => (
                    <button
                        key={deck.id}
                        onClick={() => setActiveDeckId(deck.id)}
                        className={`px-4 py-2 rounded text-white h-16 ${
                        deck.id === activeDeckId ? "bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
                        }`}
                    >
                        {deck.name}
                    </button>
                    ))}
                </div>

                {selectedDeck && !deckMode && (
                    <div className="flex mt-12 justify-center gap-16 h-16">
                        <button
                            onClick={() => setDeckMode(true)}
                            className="bg-blue-600 text-white rounded hover:bg-blue-700 text-xl border-2 w-1/5 h-full" 
                        >
                            Skapa Nytt Deck
                        </button>

                        <button
                            onClick={deleteActiveDeck}
                            className="mb-2 bg-red-600 text-white rounded hover:bg-red-700 text-xl border-2 w-1/5 h-full"
                        >
                            Radera Deck
                        </button>

                    </div>
                )}
          </div>


          {selectedDeck && !deckMode && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">{selectedDeck.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedDeck.cards.map((card) => (
                  <Card key={card.id} cardId={card.id} collectionName={card.collection} locked={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {deckMode && (
        <>
        <div className="mt-16">
          <h2 className="text-xl font-bold my-4">Alla Upplåsta Kort</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {unlockedCards.map((card) => {
              const isSelected = selectedCards.some(
                (c) => c.id === card.id && c.collection === card.collection
              );

              return (
                <div
                  key={card.id}
                  onClick={() => toggleCardSelection(card)}
                  className={`relative cursor-pointer ${deckMode && "hover:scale-105 transition-transform"}`}
                >
                  <Card cardId={card.id} collectionName={card.collection} locked={false} />
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
