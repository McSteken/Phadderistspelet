import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../../lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { LockClosedIcon } from '@heroicons/react/24/solid';

type CardProps = {
  cardId: string;
  collectionName: "Legionen" | "Skurkeriet"; 
  onClick?: () => void; 
  locked?: boolean; 
  showText?: boolean;
  shadow?: boolean;
};

export default function Card({ cardId, collectionName, onClick, locked, showText = false, shadow = false }: CardProps) {
  const [cardText, setCardText] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      if (!cardId) return;

      const docRef = doc(db, collectionName, cardId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCardText(data.name || cardId);

        const imageRef = ref(storage, `cards/${collectionName}/${cardId}.png`);
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } else {
        setCardText("Kort hittades inte");
      }
    };

    fetchCard();
  }, [cardId, collectionName]);

  return (
    <div onClick={onClick} className="flex flex-col items-center hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg rounded-lg mb-4 w-3/4 m-auto mt-4">
      {cardText && showText && <p className="text-lg font-bold">{cardText}</p>}

      {imageUrl && (
        <div         
          className={`relative w-full h-70 mt-1 transition hover:shadow-xl ${
            !locked && shadow && collectionName === "Legionen"
            ? "hover:shadow-red-500"
            : !locked && shadow && collectionName === "Skurkeriet"
            ? "hover:shadow-yellow-500"
            : ""
          } `
          }
        >
          <Image
            src={locked ? "/cards/LTAB.png" : imageUrl}
            alt="Card Image"
            layout="fill"
            objectFit="contain"
          />
          {locked && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <LockClosedIcon className="w-10 h-10 text-white" />
          </div>
          )}
        </div>
      )}
    </div>
  );
}
