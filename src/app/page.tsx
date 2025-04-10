"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db} from "../../lib/firebase";

export default function Home() {
  const [cardText, setCardText] = useState<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      const docRef = doc(db, "cards", "test");
      const docSnap = await getDoc(docRef);

      console.log("docSnap.exists():", docSnap.exists()); // Log if the doc exists
      console.log("docSnap.data():", docSnap.data()); 

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCardText(data.text); // assuming the field is called "text"
      } else {
        setCardText("Card not found!");
      }
    };

    fetchCard();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        {cardText && (
          //<p className="text-center text-xl font-semibold">{cardText}</p>
          <p>{cardText}</p>
        )}
        <p>hej</p>

        
      </main>
      
    </div>
  );
}
