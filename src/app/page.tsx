"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../lib/firebase";
import { getDownloadURL, ref } from "firebase/storage"; // Import necessary Firebase Storage functions
import { useRouter } from "next/navigation";

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


  const goToLogin = () => {
    router.push("/login");
  }


  return(     
    <main >
      <Navbar /> {/* Include Navbar component */}

      <div className="flex flex-col items-center mt-48 h-full px-8 pt-20 ">
        {user ? (
          <>
            <h1 className="text-2xl font-bold text-center">
              Välkommen, {username}.
            </h1>

            {/* Button row is absolutely positioned near the bottom */}
            <div className="flex items-center absolute bottom-36 flex gap-2">
              <CustomButton variant="secondary" onClick={() => router.push("/deck")} >Deck</CustomButton>
              <CustomButton size="xlarge" onClick={() => router.push("/play")} >Play</CustomButton>
              <CustomButton variant="secondary" onClick={() => router.push("/collection")} >Cards</CustomButton>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 justify-center h-full">
            <h1 className="text-2xl font-bold">Vänligen logga in</h1>
            <button onClick={goToLogin} className="p-2 bg-blue-500 text-white rounded">Login</button>
          </div>
        )}
      </div>
    </main>
  )
}
