"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../../../lib/firebase"; // adjust if needed

export default function BoardPage() {
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImageUrl(null);

    try {
      const q = query(
        collection(db, "Legionen"),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        
        const doc = querySnapshot.docs[0];
        const docId = doc.id;

        const imageRef = ref(storage, `cards/${docId}.png`); // assumes jpg
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } else {
        setError("Fel lösenord. Försök igen.");
      }
    } catch (err) {
      console.error("Error unlocking card:", err);
      setError("Något gick fel. Försök igen.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-4xl font-bold">🔐 Lås upp ett kort</h1>

      <form onSubmit={handleUnlock} className="flex flex-col gap-4">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Skriv in lösenordet..."
          className="p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Visa kort
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {imageUrl && (
        <img src={imageUrl} alt="Card" className="max-w-xs rounded shadow-lg" />
      )}
    </div>
  );
}
