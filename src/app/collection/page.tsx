"use client"

import React, { useEffect, useState, useRef, use } from "react";
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase"; 
import { useRouter } from 'next/navigation';
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/navbar"; 
import Menu from "./menu";
import MainContent from "./mainContent";
import UnlockCard from "./unlockCard";
import CustomButton from "../components/customButton";
import DeckManager from "./deckManager";


export default function Collection() {
    const [cards, setCards] = useState<{ 
        id: string; name?: 
        string; collection: "Legionen" | "Skurkeriet"; 
        power1Str?: string; 
        power2Str?: string; 
        power3Str?: string 
    }[]>([]); 
    const [selectedCard, setSelectedCard] = useState<{ id: string, collection: "Legionen" | "Skurkeriet" } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cardId, setCardId] = useState<string | null>(null); // this replaces imageUrl
    const [password, setPassword] = useState("");
    const [foundCard, setFoundCard] = useState<{ id: string; collection: "Legionen" | "Skurkeriet" } | null>(null); // State to hold found card
    const [selectedPhadderi, setSelectedPhadderi] = useState<"Legionen" | "Skurkeriet" | "Familjen" | "Kretsn" | "NPhadderiet" | null>(null); 
    const [viewMode, setViewMode] = useState<"cards" | "decks">("cards");



    const [showUnlock, setShowUnlock] = useState(false); // State to manage unlock modal visibility
    const unlockRef = useRef<HTMLDivElement>(null); // Ref to manage unlock modal element
    const { user } = useAuth(); // Retrieve the authenticated user

    const phadderier = ["Legionen", "Skurkeriet", "Familjen", "Kretsn", "NPhadderiet"] as const; // Define the phadderier collections

    const [unlockedCards, setUnlockedCards] = useState<Record<"Legionen" | "Skurkeriet", string[]>>({
        Legionen: [],
        Skurkeriet: []
      });

    const [powerFilter, setPowerFilter] = useState({
        power1: 0,
        power2: 0,
        power3: 0,
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

    const unlockedCardsFlat = Object.entries(unlockedCards).flatMap(([collection, ids]) =>
        ids.map((id) => ({
        id,
        collection: collection as "Legionen" | "Skurkeriet",
        }))
    );
  

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
            
            <div className="flex flex-col min-h-screen pt-16">
                <div className="flex flex-col justify-center items-center ml-[20%]">
                    <h1 className="text-2xl font-bold mb-4 p-8 pb-2">
                        {viewMode === 'cards' ? 'Samling' : 'Decks'}
                    </h1>
                    <div className="flex justify-center mb-4 gap-2 pb-10">
                        <CustomButton variant="secondary" onClick={() => setViewMode('cards')}>Alla kort</CustomButton>
                        <CustomButton variant="secondary" onClick={() => setViewMode('decks')}>Decks</CustomButton>
                    </div>
                </div>
                


                    <Menu
                        phadderier={phadderier}
                        selectedPhadderi={selectedPhadderi}
                        setSelectedPhadderi={setSelectedPhadderi}
                        onUnlockClick={() => setShowUnlock(true)}
                        powerFilter={powerFilter}
                        setPowerFilter={setPowerFilter}
                    />

                    {viewMode === "cards" ? (
                    <MainContent
                        cards={cards}
                        unlockedCards={unlockedCards}
                        selectedPhadderi={selectedPhadderi}
                        onCardClick={(card) => {
                            setSelectedCard(card); // Set the selected card
                            const selectedCardDetails = cards.find((c) => c.id === card.id); // Find the full card details
                            if (selectedCardDetails) {
                            console.log(
                                `Selected Card: ${selectedCardDetails.name}, Power1: ${selectedCardDetails.power1Str}, Power2: ${selectedCardDetails.power2Str}, Power3: ${selectedCardDetails.power3Str}`
                            );
                            }
                        } }                       
                        powerFilter={powerFilter}
                    />
                    ) : (
                    <DeckManager
                        user={user}
                        unlockedCards={unlockedCardsFlat}
                        setViewMode={setViewMode}
                    />
                    )}

                    <UnlockCard
                        show={showUnlock}
                        unlockRef={unlockRef}
                        password={password}
                        error={error}
                        cardId={cardId}
                        foundCard={foundCard}
                        onPasswordChange={setPassword}
                        onSubmit={handleFindCard}
                        onAdd={handleAddUnlockedCard}
                        onClose={() => setShowUnlock(false)}
                    />
            </div>
            
        </main>
    );

}