"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Card from "../components/card";
import Navbar from "../components/navbar";

type UnlockedCard = {
  id: string;
  collection: "Legionen" | "Skurkeriet";
};

export default function UnlockedCollection() {
  const [unlockedCards, setUnlockedCards] = useState<UnlockedCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<UnlockedCard[]>([]);
  const [deck, setDeck] = useState<UnlockedCard[] | null>(null);
  const [deckVisible, setDeckVisible] = useState(false);
  const [deckMode, setDeckMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const data = userSnap.data();
        const unlocked = data.unlockedCards || {};
        const cardList: UnlockedCard[] = [];

        (["Legionen", "Skurkeriet"] as const).forEach((collectionName) => {
          const ids = unlocked[collectionName] || [];
          ids.forEach((id: string) => {
            cardList.push({ id, collection: collectionName });
          });
        });

        setUnlockedCards(cardList);
        setDeck(data.deck || null);
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
    if (!user || selectedCards.length === 0 || selectedCards.length > 10) return;

    const userRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userRef, {
        deck: selectedCards,
      });

      alert("Ditt deck har sparats!");
      setDeck(selectedCards);
      setSelectedCards([]);
      setDeckMode(false);
    } catch (error) {
      console.error("Failed to save deck:", error);
      alert("Något gick fel när decket skulle sparas.");
    }
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Laddar din samling...</p>
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
              <>
                <button
                  onClick={() => setDeckMode(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Skapa Deck
                </button>

                {deck && (
                  <button
                    onClick={() => setDeckVisible(!deckVisible)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    {deckVisible ? "Dölj mitt deck" : "Visa mitt deck"}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={saveDeck}
                  disabled={selectedCards.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Spara Deck ({selectedCards.length}/10)
                </button>
                <button
                  onClick={() => {
                    setDeckMode(false);
                    setSelectedCards([]);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Avbryt
                </button>
              </>
            )}
          </div>
        </div>

        {deckVisible && deck && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Mitt Deck</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {deck.map((card) => (
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

        <h2 className="text-xl font-bold mb-4">Alla Upplåsta Kort</h2>

        {unlockedCards.length === 0 ? (
          <p className="text-gray-500 text-lg">Du har inte låst upp några kort ännu.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {unlockedCards.map((card) => {
              const isSelected = selectedCards.some((c) => c.id === card.id && c.collection === card.collection);

              return (
                <div
                  key={card.id}
                  onClick={() => toggleCardSelection(card)}
                  className={`relative cursor-pointer ${deckMode && "hover:scale-105 transition-transform"}`}
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
