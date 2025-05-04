"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Card from "../components/card";
import Navbar from "../components/navbar";

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

export default function UnlockedCollection() {
  const [unlockedCards, setUnlockedCards] = useState<UnlockedCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<UnlockedCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [deckMode, setDeckMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Set active deck
  const setActiveDeck = async (deckId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, { activeDeckId: deckId });
      setActiveDeckId(deckId);
    } catch (error) {
      console.error("Failed to set active deck:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const data = userSnap.data();
        const unlocked = data.unlockedCards || {};
        const userDecks = data.decks || [];
        const storedActiveDeckId = data.activeDeckId || null;

        const cardList: UnlockedCard[] = [];
        (['Legionen', 'Skurkeriet'] as const).forEach((collectionName) => {
          const ids = unlocked[collectionName] || [];
          ids.forEach((id: string) => {
            cardList.push({ id, collection: collectionName });
          });
        });

        setUnlockedCards(cardList);
        setDecks(userDecks);

        if (storedActiveDeckId) {
          setActiveDeckId(storedActiveDeckId);
        } else if (userDecks.length > 0) {
          setActiveDeck(userDecks[0].id); // set first deck as default
        }

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleCardSelection = (card: UnlockedCard) => {
    if (!deckMode) return;

    const isSelected = selectedCards.some((c) => c.id === card.id && c.collection === card.collection);

    if (isSelected) {
      setSelectedCards((prev) => prev.filter((c) => !(c.id === card.id && c.collection === card.collection)));
    } else {
      if (selectedCards.length >= 10) return;
      setSelectedCards((prev) => [...prev, card]);
    }
  };

  const saveDeck = async () => {
    if (!user || selectedCards.length === 0 || selectedCards.length > 10 || !newDeckName.trim()) return;

    const userRef = doc(db, "users", user.uid);
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: newDeckName,
      cards: selectedCards,
    };

    try {
      const updatedDecks = [...decks, newDeck];
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

    const userRef = doc(db, "users", user.uid);
    const updatedDecks = decks.filter((d) => d.id !== activeDeckId);

    try {
      await updateDoc(userRef, {
        decks: updatedDecks,
        activeDeckId: updatedDecks.length > 0 ? updatedDecks[0].id : null,
      });
      setDecks(updatedDecks);
      if (updatedDecks.length > 0) {
        setActiveDeckId(updatedDecks[0].id);
      } else {
        setActiveDeckId(null);
      }
      alert("Decket har raderats.");
    } catch (error) {
      console.error("Fel vid radering av deck:", error);
      alert("Något gick fel vid radering.");
    }
  };

  const selectedDeck = decks.find((d) => d.id === activeDeckId);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Laddar</p>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Min Samling</h1>
          <div className="flex gap-4">
            {!deckMode ? (
              <button
                onClick={() => setDeckMode(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Skapa Deck
              </button>
            ) : (
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
        </div>

        {decks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Mina Decks</h2>
            <div className="flex flex-wrap gap-4">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => {setActiveDeck(deck.id); }}
                  className={`px-4 py-2 rounded text-white ${
                    deck.id === activeDeckId
                      ? "bg-purple-700"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  {deck.name}
                </button>
              ))}
            </div>

            {selectedDeck && (
              <div className="mt-4">
                <button
                  onClick={deleteActiveDeck}
                  className="mb-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Radera Deck
                </button>
                <h3 className="text-xl font-semibold mb-2">{selectedDeck.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {selectedDeck.cards.map((card) => (
                    <Card
                      key={card.id}
                      cardId={card.id}
                      collectionName={card.collection}
                      locked={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">Alla Upplåsta Kort</h2>

        {unlockedCards.length === 0 ? (
          <p className="text-gray-500 text-lg">Du har inte låst upp några kort ännu.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {unlockedCards.map((card) => {
              const isSelected = selectedCards.some(
                (c) => c.id === card.id && c.collection === card.collection
              );

              return (
                <div
                  key={card.id}
                  onClick={() => toggleCardSelection(card)}
                  className={`relative cursor-pointer ${
                    deckMode && "hover:scale-105 transition-transform"
                  }`}
                >
                  <Card
                    cardId={card.id}
                    collectionName={card.collection}
                    locked={false}
                  />
                  {deckMode && isSelected && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
