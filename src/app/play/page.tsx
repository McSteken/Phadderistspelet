"use client";

import { useRouter } from "next/navigation";
import CustomButton from "../components/customButton";
import Navbar from "../components/navbar";

export default function PlayMenu() {
  const router = useRouter();

 

  return (
    <main className="bg-gradient-to-r from-gray-800 to-gray-200">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
        
        <h1 className="text-3xl font-bold mb-6">Välj ett deck för att spela</h1>

        <CustomButton variant="nav" size="xlarge" onClick={() => router.push("/lobby")}>
          Create Lobby
        </CustomButton>
        

        <CustomButton variant="nav" size="xlarge" onClick={() => router.push("/join")}>
          Join
        </CustomButton>
      </div>
    </main>
  );
}
