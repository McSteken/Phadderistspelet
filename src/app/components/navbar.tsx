import React from 'react'
import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebase"; // Import the auth object from firebase
import { useRouter } from 'next/navigation';

export default function Navbar() {

    const router = useRouter();

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

  return (
    <div>

        <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
            <div className="text-lg font-bold"></div>
            <div className="flex space-x-4">
                <a href="/" className="hover:text-gray-400 flex items-center">Hem</a>
                <a href="/collection" className="hover:text-gray-400 flex items-center">Collection</a>
                <a href="/about" className="hover:text-gray-400 flex items-center">Regler</a>
                <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Sign Out</button>
            </div>
        </nav>
    </div>
  )
}

