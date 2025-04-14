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


  if(loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <ImSpinner2 className="animate-spin text-4xl w-17 h-17 " />
      </div>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      router.push("/login"); // Redirect to login page after sign out
    }
    catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const goToLogin = () => {
    router.push("/login");
  }


  return(     
    <main>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">

        {user ? (

          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">Välkommen, {username}.</h1>
            <button onClick={handleSignOut} className="p-2 bg-red-500 text-white rounded">Logout</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">Vänligen logga in</h1>
            <button onClick={goToLogin} className="p-2 bg-blue-500 text-white rounded">Login</button>
          </div>
        )}




      </div>

    <Card cardId="Legionen" />

    </main>


  )
}
