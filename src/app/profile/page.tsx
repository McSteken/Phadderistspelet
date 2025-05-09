"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteDoc, setDoc } from "firebase/firestore";
import Navbar from "../components/navbar";

export default function BoardPage() {
  const [profile, setProfile] = useState<{ username: string; email: string; photoURL?: string } | null>(null);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              username: data.username,
              email: data.email,
              photoURL: data.photoURL || null,
            });
            setEditedUsername(data.username);
            setEditedEmail(data.email);
          } else {
            setError("Profil hittades inte.");
          }
        } catch (err: any) {
          setError("Fel vid hämtning av profil: " + err.message);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const goToLogin = () => router.push("/login");

  const handleProfileClick = () => fileInputRef.current?.click();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDocRef, { photoURL: downloadURL });

    setProfile((prev) => prev && { ...prev, photoURL: downloadURL });
  };

  const handleSaveChanges = async () => {
    if (!auth.currentUser || !profile) return;
    setSaving(true);
  
    const newUsername = editedUsername;
    const newLower = newUsername.toLowerCase();
    const oldUsername = profile.username;
  
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const oldUsernameDocRef = doc(db, "usernames", oldUsername);
    const newUsernameDocRef = doc(db, "usernames", newUsername);
  
    try {
      // 1. Update users collection
      await updateDoc(userDocRef, {
        username: newUsername,
        lowercaseUsername: newLower,
        email: editedEmail,
      });
  
      // 2. Remove old entry in usernames collection
      if (oldUsername !== newUsername) {
        await deleteDoc(oldUsernameDocRef);
      }
  
      // 3. Add new entry in usernames collection
      await setDoc(newUsernameDocRef, {
        email: editedEmail,
      });
  
      // 4. Update local state
      setProfile({
        ...profile,
        username: newUsername,
        email: editedEmail,
      });
    } catch (err: any) {
      setError("Fel vid uppdatering: " + err.message);
    }
  
    setSaving(false);
  };
  
  

  return (
    <main className="bg-gradient-to-r from-gray-800 to-gray-200 min-h-screen relative">
      <div className="absolute top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-4">
        {loading && <p className="text-white text-lg">Laddar...</p>}

        {!loading && !profile && (
          <button
            onClick={goToLogin}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Logga in
          </button>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {profile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="flex flex-col gap-6 mt-12 w-full max-w-md">
              {/* Profile Image */}
              <div className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl p-6 flex flex-col items-center border border-white/20">
                <div
                  className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-md cursor-pointer transition hover:scale-105"
                  onClick={handleProfileClick}
                >
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                      Ingen bild
                    </div>
                  )}
                </div>
                <p className="text-white mt-4 text-sm">Klicka för att ändra bild</p>
              </div>

              {/* Username Field */}
              <div className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl p-6 border border-white/20">
                <label className="block text-white mb-2 font-semibold">Användarnamn</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="w-full p-2 rounded-md bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Email Field */}
              <div className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl p-6 border border-white/20">
                <label className="block text-white mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="w-full p-2 rounded-md bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Sparar..." : "Bekräfta ändring"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
