'use client';

import React from 'react';
import CustomButton from '../components/customButton';
import Card from '../components/card';

type CardType = {
  id: string;
  name?: string;
  collection: 'Legionen' | 'Skurkeriet';
};

type MainContentProps = {
  cards: CardType[];
  unlockedCards: Record<'Legionen' | 'Skurkeriet', string[]>;
  selectedPhadderi: string | null;
  onCardClick: (card: { id: string; collection: 'Legionen' | 'Skurkeriet' }) => void;
};

export default function MainContent({
  cards,
  unlockedCards,
  selectedPhadderi,
  onCardClick,
}: MainContentProps) {
  const displayedCards = selectedPhadderi
    ? cards.filter((card) => card.collection === selectedPhadderi)
    : cards;

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
