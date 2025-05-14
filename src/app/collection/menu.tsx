'use client';

import React from 'react';
import Icon from './icon';

type PhadderiType = "Legionen" | "Skurkeriet" | "Familjen" | "Kretsn" | "NPhadderiet";

type MenuProps = {
  phadderier: readonly PhadderiType[];
  selectedPhadderi: PhadderiType | null;
  setSelectedPhadderi: React.Dispatch<React.SetStateAction<PhadderiType | null>>; 
  onUnlockClick: () => void;
  powerFilter: {
    power1: number;
    power2: number;
    power3: number;
  };
  setPowerFilter: React.Dispatch<React.SetStateAction<{
    power1: number;
    power2: number;
    power3: number;
  }>>;
};

export default function Menu({
  phadderier,
  selectedPhadderi,
  setSelectedPhadderi,
  onUnlockClick,
  powerFilter,
  setPowerFilter,
}: MenuProps) {
    
  return (
    <div className="w-1/5 fixed top-12 left-0 bottom-0 bg-gray-900 text-white p-4 pt-8 flex flex-col items-center overflow-y-auto custom-scrollbar">
      <h1 className="text-2xl font-bold py-2">Meny</h1>
      <button
        className="mb-8 p-2 bg-green-500 text-white rounded hover:bg-blue-600"
        onClick={onUnlockClick}
      >
        Lås upp ett kort
      </button>

      <h2 className="text-2xl font-bold self-center mb-4 font-bold text-3xl
      ">Filter</h2>

      {/* Phadderier */}
      <div className="flex flex-col gap-2 bg-gray-800 p-4 rounded-lg w-full items-center justify-center mb-4">
        <h2 className="text-2xl font-bold self-center mb-4">Phadderier</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-4 max-w-full">
          {phadderier.map((collectionName) => (
            <div
              key={collectionName}
              className="w-[calc(45%-0.5rem)] max-w-[200px]"
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

      {/* Krafter poäng */}
      <div className="flex flex-col gap-2 bg-gray-800 p-4 rounded-lg w-full items-center justify-center">
        <h2 className="text-2xl font-bold self-center mb-4">Krafter</h2>
        {["power1", "power2", "power3"].map((slot, i) => (
          <div key={slot} className="flex flex-col items-center w-full">
            <p className="text-sm mb-1 text-white">Kraft {i + 1}</p>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((val) => (
                <button
                  key={val}
                  className={`px-3 py-1 rounded ${
                    powerFilter[slot as keyof typeof powerFilter] === val
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                  onClick={() =>
                    setPowerFilter(prev => ({
                      ...prev,
                      [slot]: prev[slot as keyof typeof powerFilter] === val ? 0 : val,
                    }))
                  }
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
