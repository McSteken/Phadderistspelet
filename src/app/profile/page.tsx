"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../../../lib/firebase"; // adjust if needed
import Card from "../components/card"

export default function BoardPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null); // this replaces imageUrl

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCardId(null); // reset any previous card

    try {
      const q = query(
        collection(db, "Legionen"),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setCardId(doc.id); // Send the document ID to <Card />
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
      <h1 className="text-4xl font-bold">Profil</h1>


      {error && <p className="text-red-500">{error}</p>}

      
    </div>
  );
}