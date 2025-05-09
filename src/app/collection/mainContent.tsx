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
  onDeckClick: () => void;
};

export default function MainContent({
  cards,
  unlockedCards,
  selectedPhadderi,
  onCardClick,
  onDeckClick,
}: MainContentProps) {
  const displayedCards = selectedPhadderi
    ? cards.filter((card) => card.collection === selectedPhadderi)
    : cards;

  return (
    <div className="w-4/5 ml-[20%] p-4 mx-auto flex flex-col">
      <h1 className="text-2xl font-bold mb-4 p-8">Collection</h1>
      <div className="flex justify-center mb-4 gap-2 pb-10">
        <CustomButton variant="secondary">Alla kort</CustomButton>
        <CustomButton variant="secondary" onClick={onDeckClick}>
          Decks
        </CustomButton>
      </div>
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
