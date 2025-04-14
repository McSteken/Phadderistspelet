"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../lib/firebase";
import { getDownloadURL, ref } from "firebase/storage"; // Import necessary Firebase Storage functions
import { useRouter } from "next/navigation";

import Card from "./components/card";

export default function Home() {
  const router = useRouter();

  const goToLogin = () => {
    router.push("/login");
  }

  return(     
    <main>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-2xl font-bold">Welcome to the game!</h1>
        <button onClick={goToLogin} className="p-2 bg-blue-500 text-white rounded">Login</button>
      </div>

    <Card cardId="Legionen" />
    
    </main>


  )
}
