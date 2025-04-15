"use client"
import { useRouter } from "next/navigation";

export default function playMenu() {
    const router = useRouter();
    return (
      <div className="flex justify-center flex-col items-center min-h-screen">
        <h1 className="text-3xl font-bold">Lets play a game!</h1>
        <button onClick={() => router.push("/board")} className="p-2 bg-green-500 text-white rounded">play</button>
      </div>
    );
  }
  