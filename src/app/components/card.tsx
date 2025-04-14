import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../../lib/firebase";
import { getDownloadURL, ref } from "firebase/storage"; // Import necessary Firebase Storage functions

export default function Card({ cardId }: { cardId: string }) {
    const [cardText, setCardText] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null); // State to hold the image URL  
  
    useEffect(() => {
      const fetchCard = async () => {
        const docRef = doc(db, "cards", cardId);
        const docSnap = await getDoc(docRef);
  
        console.log("docSnap.exists():", docSnap.exists()); // Log if the doc exists
        console.log("docSnap.data():", docSnap.data()); 
  
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCardText(data.name); // assuming the field is called "name"
  
          // fetch the image URL from Firebase Storage
          const imageRef = ref(storage, `cards/${data.image}.png`); // Adjust the path as necessary
          const url = await getDownloadURL(imageRef);
          setImageUrl(url); // Set the image URL in state
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
           {/* Display the image */}
           {imageUrl && (
            <div className="relative w-[200px] h-[200px]">
              <Image
                src={imageUrl}
                alt="Card Image"
                layout="fill" // Fills the container
                objectFit="contain" // Ensures the image scales properly
              />
            </div>
          )}
        </main>
      
      </div>
    ); 
} 