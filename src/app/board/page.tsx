"use client";

import { useState } from "react";
import Card from "../components/card"; // Assuming Card component is available

const BoardPage = () => {
  // State to store the 3 slots
  const [cardsOnBoard, setCardsOnBoard] = useState<any[]>([]);

  const handleCardDrop = (cardId: string, slotIndex: number) => {
    // Update the card slots with selected cards
    setCardsOnBoard((prevCards) => {
      const newCards = [...prevCards];
      newCards[slotIndex] = cardId; // Drop card in the selected slot
      return newCards;
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="playboard">
        {/* Slot 1 */}
        <div className="card-slot">
          {cardsOnBoard[0] && <Card cardId={cardsOnBoard[0]} />}
          <p>1</p>
        </div>

        {/* Slot 2 */}
        <div className="card-slot">
          {cardsOnBoard[1] && <Card cardId={cardsOnBoard[1]} />}
          <p>2</p>
        </div>

        {/* Slot 3 */}
        <div className="card-slot">
          {cardsOnBoard[2] && <Card cardId={cardsOnBoard[2]} />}
          <p>3</p>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
