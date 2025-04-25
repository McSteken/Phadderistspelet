"use client"

import React, { useEffect, useState, useRef, use } from "react";
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Import your Firestore instance
import { useRouter } from 'next/navigation';
import Card from "../components/card"; // Import the Card component
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/navbar"; // Import the Navbar component
import CustomButton from "../components/customButton";
import Icon from "./icon"


export default function Collection() {
    const [cards, setCards] = useState<{ id: string; name?: string; collection: "Legionen" | "Skurkeriet"}[]>([]); // State to hold all cards
    const [selectedCard, setSelectedCard] = useState<{ id: string, collection: "Legionen" | "Skurkeriet" } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cardId, setCardId] = useState<string | null>(null); // this replaces imageUrl
    const [password, setPassword] = useState("");
    const [foundCard, setFoundCard] = useState<{ id: string; collection: "Legionen" | "Skurkeriet" } | null>(null); // State to hold found card

    const [showUnlock, setShowUnlock] = useState(false); // State to manage unlock modal visibility
    const unlockRef = useRef<HTMLDivElement>(null); // Ref to manage unlock modal element
    const { user } = useAuth(); // Retrieve the authenticated user

    const router = useRouter(); // Use Next.js router for navigation
    const phadderier = ["Legionen", "Skurkeriet", "Familjen", "Kretsn", "NPhadderiet"] as const; // Define the phadderier collections

    const [unlockedCards, setUnlockedCards] = useState<Record<"Legionen" | "Skurkeriet", string[]>>({
        Legionen: [],
        Skurkeriet: []
      });

    useEffect(() => {
    const fetchUnlocked = async () => {
        if (!user) {
            console.error("User is null. Cannot fetch unlocked cards.");
            return;
        }
        const userDocRef = doc(db, "users", user.uid); 
        const userSnap = await getDoc(userDocRef);
    
        if (userSnap.exists()) {
        const data = userSnap.data();
        setUnlockedCards(data.unlockedCards || { Legionen: [], Skurkeriet: [] });
        }
    };
    if(user) fetchUnlocked();

}, [user]);

    const handleClickOutside = (event: { target: any; }) => {
        if (unlockRef.current && !unlockRef.current.contains(event.target)) {
            setShowUnlock(false); // Close unlock modal if clicked outside
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside); // Add event listener to close modal on outside click
        return () => {
            document.removeEventListener("mousedown", handleClickOutside); // Clean up event listener on unmount
        }
    }, []);


    const handleFindCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCardId(null); // Reset any previous card
    
        try {
            const collections = ["Legionen", "Skurkeriet"];
            let found = false;
        
            for (const collectionName of collections) {
              const q = query(
                collection(db, collectionName),
                where("password", "==", password)
              );
        
              const querySnapshot = await getDocs(q);
        
              if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                setCardId(doc.id);
                setFoundCard({ id: doc.id, collection: collectionName as "Legionen" | "Skurkeriet" });
                found = true;
                break;
              }
            }
        
            if (!found) {
              setError("Fel lösenord. Försök igen.");
            }
          } catch (err) {
            console.error("Error unlocking card:", err);
            setError("Något gick fel. Försök igen.");
          }    
        };
    
    const handleAddUnlockedCard = async () => {
        if (!user || !cardId) return;
    
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
    
            if (userSnap.exists()) {
                // Update the user's unlocked cards
                await updateDoc(userRef, {
                    [`unlockedCards.${foundCard?.collection}`]: arrayUnion(cardId),
                });
            } else {
                // Create a new user document with the unlocked card
                await setDoc(userRef, {
                    unlockedCards: {
                        Legionen: [cardId],
                    },
                });
            }    
            // update unlocked cards
            setUnlockedCards((prev) => ({
                ...prev,
                [foundCard?.collection as "Legionen" | "Skurkeriet"]: [...prev[foundCard?.collection as "Legionen" | "Skurkeriet"], cardId],
            }));
    
            setShowUnlock(false); // Optionally close modal after
        } catch (error) {
            console.error("Failed to add card:", error);
            setError("Något gick fel. Försök igen.");
        }
    };

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const legionenRef = collection(db, "Legionen");
                const skurkerietRef = collection(db, "Skurkeriet");

                const [legionenSnapshot, skurkerietSnapshot] = await Promise.all([
                    getDocs(legionenRef),
                    getDocs(skurkerietRef),
                ]);

                const legionenCards = legionenSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    collection: "Legionen" as "Legionen", 
                }));

                const skurkerietCards = skurkerietSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    collection: "Skurkeriet" as "Skurkeriet",
                }));

                const allCards = [...legionenCards, ...skurkerietCards]; // Combine both collections
                console.log(allCards); // Log all cards to the console

                setCards([...legionenCards, ...skurkerietCards]); // Combine both collections
            } catch (error) {
                console.error("Error fetching cards:", error);
            } 
        };

        fetchCards();
    }, [user]); 

    return (
        <main>
            <Navbar />
            <div className="flex min-h-screen">
                {/* Left-side menu */}
                <div className="w-1/5 bg-gray-900 text-white p-4 flex flex-col items-center">
                    <h1 className="text-2xl font-bold py-2">Meny</h1>
                    <button className="mb-4 p-2 bg-green-500 text-white rounded hover:bg-blue-600" onClick={() => setShowUnlock(true)}>Lås upp ett kort</button>

                    <div className="flex flex-col gap-2 bg-gray-800 p-4 rounded-lg w-full items-center justify-center">
                        <h2 className="text-lg font-bold self-center mb-4">Phadderier</h2>
                        
                        <div className="flex flex-wrap justify-center gap-4 mb-4 max-w-full">
                            {(phadderier).map((collectionName) => (
                                <div key={collectionName} className="w-[calc(50%-0.5rem)] max-w-[200px] aspect-square flex justify-center items-center"> {/*calc(50%-0.5rem) to make it responsive*/}
                                    <Icon collectionName={collectionName} />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Main content */}
                <div className="w-3/4 p-4 mx-auto flex flex-col">
                    <h1 className="text-2xl font-bold mb-4 p-8">Collection</h1>
                    {/* Buttons */}
                    <div className="flex justify-center mb-4 gap-2 pb-10">
                        <CustomButton variant="secondary" >Alla kort</CustomButton>
                        <CustomButton variant="secondary" onClick={() => router.push("/deck")} >Decks</CustomButton>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className={`transition flex flex-col items-center `}
                            >
                                <h2 className="text-lg font-bold">{card.name}</h2>
                                <Card   
                                    cardId={card.id}
                                    collectionName={card.collection}
                                    locked={!unlockedCards[card.collection]?.includes(card.id)} 
                                    onClick={() => {
                                        setSelectedCard({ id: card.id, collection: card.collection });
                                        console.log("Card clicked:", card.id);
                                    }}
                                    shadow={true} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {showUnlock && (
                    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }} // 50% transparent black
>
                        <div ref={unlockRef} className="bg-white p-6 rounded shadow-lg w-1/3 text-black flex flex-col items-center">
                            <h1 className="font-bold">Lås upp ett kort</h1>

                            <form onSubmit={handleFindCard} className="flex flex-col gap-4">
                                <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                    onClick={handleAddUnlockedCard}
                                    className="mt-4 p-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                Lägg till i min samling
                                </button>
                                </>
                            )}

                            <button onClick={() => setShowUnlock(false)} className="mt-4 p-2 bg-blue-500 text-white rounded">Close</button>
                        </div>
                    </div>  
                )}
            </div>
        </main>
    );

}