'use client';

import React from 'react';
import Icon from './icon';

type PhadderiType = "Legionen" | "Skurkeriet" | "Familjen" | "Kretsn" | "NPhadderiet";

type MenuProps = {
  phadderier: readonly PhadderiType[];
  selectedPhadderi: PhadderiType | null;
  setSelectedPhadderi: React.Dispatch<React.SetStateAction<PhadderiType | null>>; 
  onUnlockClick: () => void;
};

export default function Menu({
  phadderier,
  selectedPhadderi,
  setSelectedPhadderi,
  onUnlockClick,
}: MenuProps) {
    
  return (
    <div className="w-1/5 fixed top-12 left-0 bottom-0 bg-gray-900 text-white p-4 pt-8 flex flex-col items-center overflow-y-auto">
      <h1 className="text-2xl font-bold py-2">Meny</h1>
      <button
        className="mb-4 p-2 bg-green-500 text-white rounded hover:bg-blue-600"
        onClick={onUnlockClick}
      >
        Lås upp ett kort
      </button>

      <div className="flex flex-col gap-2 bg-gray-800 p-4 rounded-lg w-full items-center justify-center">
        <h2 className="text-2xl font-bold self-center mb-4">Phadderier</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-4 max-w-full">
          {phadderier.map((collectionName) => (
            <div
              key={collectionName}
              className="w-[calc(50%-0.5rem)] max-w-[200px]"
            >
              <Icon
                collectionName={collectionName as any}
                selected={selectedPhadderi === collectionName}
                onClick={() => setSelectedPhadderi(selectedPhadderi === collectionName ? null : collectionName
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
