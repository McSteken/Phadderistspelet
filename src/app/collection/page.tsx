"use client"

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Import your Firestore instance
import { useRouter } from 'next/navigation';
import Card from "../components/card"; // Import the Card component
import Navbar from "../components/navbar"; // Import the Navbar component


export default function Collection() {
    const router = useRouter();

    const goToHome = () => {
        router.push('/'); // Navigate to the home page
    };
    const [cards, setCards] = useState<{ id: string; name?: string; collection: "Legionen" | "Skurkeriet"}[]>([]); // State to hold all cards
    const [loading, setLoading] = useState(true); // State to manage loading state

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
            } finally {
                setLoading(false); // Stop loading
            }
        };

        fetchCards();
    }, []);

    return (
        <main>
            <Navbar />
            <div className="flex min-h-screen">
                {/* Left-side menu */}
                <div className="w-1/4 bg-gray-900 text-white p-4">
                    <h2 className="text-xl font-bold mb-4">Menu</h2>
                    <ul>
                        <li className="mb-2 hover:text-gray-400 cursor-pointer">Legionen</li>
                        <li className="mb-2 hover:text-gray-400 cursor-pointer">Skurkeriet</li>
                    </ul>
                </div>

                {/* Main content */}
                <div className="w-3/4 p-4">
                    <h1 className="text-2xl font-bold mb-4">Collection</h1>
                    <div className="grid grid-cols-3 gap-4">
                        {cards.map((card) => (
                            <div key={card.id} className="border p-4 rounded shadow hover:shadow-lg transition flex flex-col items-center">
                            <Card cardId={card.id} collectionName={card.collection} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );

}