"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc, } from "firebase/firestore";
import { db, storage } from "../../lib/firebase";
import { getDownloadURL, ref } from "firebase/storage"; // Import necessary Firebase Storage functions
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";


import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase"; // Import the auth object from firebase

import { ImSpinner2 } from "react-icons/im"; // Import spinner icon
import { FaSignInAlt } from "react-icons/fa"; // Import sign in icon

import Navbar from "./components/navbar"; // Import Navbar component
import CustomButton from "./components/customButton";
import Card from "./components/card";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Use the useAuth to use AuthProvider
  const [ username, setUsername] = useState<string | null>(null); 

    
    useEffect(() => {
      const fetchUsername = async () => {
        if (user) {
          try{
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              setUsername(data.username); // assuming the field is called "username"
            } 
            else {
              console.log("No username found!");
            }
          }
          catch (error) {
            console.error("Error fetching username:", error);
          }
        };
      };


      fetchUsername();
    }, [user]); // Run this effect when the user changes

    const [backgroundCards, setBackgroundCards] = useState<{ id: string, collection: "Legionen" | "Skurkeriet" }[]>([]);

    // Fetch a few cards for background
    useEffect(() => {
      const fetchRandomCards = async () => {
        const col1 = await getDocs(collection(db, "Legionen"));
        const col2 = await getDocs(collection(db, "Skurkeriet"));

        const allCards = [
          ...col1.docs.map(doc => ({ id: doc.id, collection: "Legionen" as const })),
          ...col2.docs.map(doc => ({ id: doc.id, collection: "Skurkeriet" as const })),
        ];

        // Shuffle and take first 5
        const shuffled = allCards.sort(() => 0.5 - Math.random()).slice(0, 20);
        setBackgroundCards(shuffled);
      };

      fetchRandomCards();
    }, []);

  const goToLogin = () => {
    router.push("/login");
  }


  return(     
    <main className="bg-gradient-to-r from-gray-800 to-gray-200 relative" >
      <div className="absolute top-0 left-0 w-full z-50 z-10">
        <Navbar />
      </div>

      <div className="absolute top left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {backgroundCards.map((card, index) => (
          <motion.div
            key={card.id}
            className="absolute w-45 pointer-events-none"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight* 0.9,
              rotate: Math.random() * 360,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight*0.9,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "linear",
            }}
          >
            <Card
              cardId={card.id}
              collectionName={card.collection}
              showText={false}
              shadow={false}
              locked={false}
            />
          </motion.div>
        ))}
      </div>
      <div className="relative z-10 h-screen flex items-center justify-center px-10">
        <div className="bg-black/70 p-8 rounded-xl shadow-lg text-white text-center max-w-lg w-full">
          <h1 className="text-4xl font-extrabold mb-6 font-[Cinzel] text-white">
            Phadderistspelet
          </h1>

          {user ? (
            <>
              <h1
                className="font-extrabold mb-6 font-[Cinzel]"
                style={{ fontSize: "26px" }}
              >
                Nämen Heeej {username}.
              </h1>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <CustomButton variant="nav" onClick={() => router.push("/deck")}>
                  Deck
                </CustomButton>
                <CustomButton variant="nav" size="xlarge" onClick={() => router.push("/play")}>
                  Play
                </CustomButton>
                <CustomButton variant="nav" onClick={() => router.push("/collection")}>
                  Cards
                </CustomButton>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-bold">Vänligen logga in</h1>
              <button onClick={goToLogin} className="p-2 bg-blue-500 text-white rounded">
                Login
              </button>
            </div>
          )}
        </div>
      </div>

    </main>
  )
}
