"use client";

import React, { useRef } from "react";
import Card from "../components/card";

type UnlockCardProps = {
  show: boolean;
  unlockRef: React.RefObject<HTMLDivElement | null>;
  password: string;
  error: string | null;
  cardId: string | null;
  foundCard: { id: string; collection: "Legionen" | "Skurkeriet" } | null;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAdd: () => void;
  onClose: () => void;
};

export default function UnlockCard({
  show,
  unlockRef,
  password,
  error,
  cardId,
  foundCard,
  onPasswordChange,
  onSubmit,
  onAdd,
  onClose,
}: UnlockCardProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        ref={unlockRef}
        className="bg-white p-6 rounded shadow-lg w-1/3 text-black flex flex-col items-center"
      >
        <h1 className="font-bold">Lås upp ett kort</h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Skriv in lösenordet..."
            className="p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
          >
            Checka Lösenord
          </button>
        </form>

        {error && <p className="text-red-500">{error}</p>}

        {cardId && (
          <>
            <div className="flex items-center justify-center w-3/4">
              {foundCard?.collection && (
                <Card cardId={cardId} collectionName={foundCard.collection} />
              )}
            </div>

            <button
              onClick={onAdd}
              className="mt-4 p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Lägg till i min samling
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 p-2 bg-blue-500 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
