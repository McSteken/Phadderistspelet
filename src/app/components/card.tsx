import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../../lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";

type CardProps = {
  cardId: string;
  collectionName?: string; // allow override (e.g., "Legionen")
};

export default function Card({ cardId, collectionName="" }: CardProps) {
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

        const imageRef = ref(storage, `cards/${cardId}.png`);
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } else {
        setCardText("Kort hittades inte");
      }
    };

    fetchCard();
  }, [cardId, collectionName]);

  return (
    <div className="flex flex-col items-center gap-4">
      {cardText && <p className="text-lg font-medium">{cardText}</p>}

      {imageUrl && (
        <div className="relative w-[200px] h-[200px]">
          <Image
            src={imageUrl}
            alt="Card Image"
            layout="fill"
            objectFit="contain"
          />
        </div>
      )}
    </div>
  );
}
