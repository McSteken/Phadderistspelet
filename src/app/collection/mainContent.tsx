'use client';

import React from 'react';
import CustomButton from '../components/customButton';
import Card from '../components/card';

type CardType = {
  id: string;
  name?: string;
  collection: 'Legionen' | 'Skurkeriet';
  power1Str?: string;
  power2Str?: string;
  power3Str?: string;
};

type MainContentProps = {
  cards: CardType[];
  unlockedCards: Record<'Legionen' | 'Skurkeriet', string[]>;
  selectedPhadderi: string | null;
  onCardClick: (card: { id: string; collection: 'Legionen' | 'Skurkeriet' }) => void;
  powerFilter: {
    power1: number;
    power2: number;
    power3: number;
  };
};

export default function MainContent({
  cards,
  unlockedCards,
  selectedPhadderi,
  onCardClick,
  powerFilter,

}: MainContentProps) {
    const displayedCards = cards.filter(card => {
      const matchesPhadderi = selectedPhadderi ? card.collection === selectedPhadderi : true;

      const power1 = Number(card.power1Str ?? 0);
      const power2 = Number(card.power2Str ?? 0);
      const power3 = Number(card.power3Str ?? 0);

      const matchesPower =
          power1 >= powerFilter.power1 &&
          power2 >= powerFilter.power2 &&
          power3 >= powerFilter.power3;

      return matchesPhadderi && matchesPower;
    });

  return (
    <div className="w-4/5 ml-[20%] p-4 mx-auto flex flex-col">
      <div className="grid grid-cols-4 gap-4">
        {displayedCards.map((card) => (
          <div key={card.id} className="transition flex flex-col items-center">
            <h2 className="text-lg font-bold">{card.name}</h2>
            <Card
              cardId={card.id}
              collectionName={card.collection}
              locked={!unlockedCards[card.collection]?.includes(card.id)}
              onClick={() => onCardClick({ id: card.id, collection: card.collection })}
              shadow
            />
          </div>
        ))}
      </div>
    </div>
  );
}
