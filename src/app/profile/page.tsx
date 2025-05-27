"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc, setDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "../components/navbar";
import Card from "../components/card"; // Assuming Card component exists

export default function BoardPage() {
  const [profile, setProfile] = useState<{ username: string; email: string; photoURL?: string } | null>(null);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [unlockedCards, setUnlockedCards] = useState<Record<"Legionen" | "Skurkeriet", string[]>>({
    Legionen: [],
    Skurkeriet: [],
  });
  const [selectedCard, setSelectedCard] = useState<{ id: string; collection: "Legionen" | "Skurkeriet" } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

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
            setUnlockedCards(data.unlockedCards || { Legionen: [], Skurkeriet: [] });
            setSelectedCard(data.selectedCard || null); // Load previously selected card
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
    await updateProfile(auth.currentUser, { photoURL: downloadURL });

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
      // Update users collection
      await updateDoc(userDocRef, {
        username: newUsername,
        lowercaseUsername: newLower,
        email: editedEmail,
      });

      // Remove old entry in usernames collection
      if (oldUsername !== newUsername) {
        await deleteDoc(oldUsernameDocRef);
      }

      // Add new entry in usernames collection
      await setDoc(newUsernameDocRef, {
        email: editedEmail,
      });
      await updateProfile(auth.currentUser, {
        displayName: newUsername,
      });

      // Update local state
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

  const handleCardSelect = async (card: { id: string; collection: "Legionen" | "Skurkeriet" }) => {
    if (!auth.currentUser) return;

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { selectedCard: card });
      setSelectedCard(card);
      setShowCardModal(false);
    } catch (error) {
      console.error("Error saving selected card:", error);
    }
  };

  const unlockedCardsFlat = Object.entries(unlockedCards).flatMap(([collection, ids]) =>
    ids.map((id) => ({ id, collection: collection as "Legionen" | "Skurkeriet" }))
  );

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

            <div className="flex gap-8">
              <div className="flex flex-col gap-6 w-full max-w-md">
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
                  disabled={
                    saving || 
                    (editedUsername === profile?.username && editedEmail === profile?.email)
                  }
                  className={`py-3 rounded-lg font-semibold transition ${
                    saving || (editedUsername === profile?.username && editedEmail === profile?.email)
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                > 
                  {saving ? "Sparar..." : "Bekräfta ändring"}
                </button>
              </div>

              {/* Card Selection */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="w-70 h-70 rounded-lg  flex items-center justify-center cursor-pointer hover:scale-105 transition"
                  onClick={() => setShowCardModal(true)}
                >
                  {selectedCard ? (
                    <Card cardId={selectedCard.id} collectionName={selectedCard.collection} />
                  ) : (
                    <p className="text-white text-center text-lg">Välj ett kort</p>
                  )}
                </div>
                <p className="text-white mt-8 text-sm">Klicka för presentera ditt favoritkort</p>
              </div>
            </div>

            {/* Card Selection Modal */}
            {showCardModal && (
              <div
                className="fixed inset-0 bg-gray-1000 bg-opacity-95 flex items-center justify-center z-50"
                onClick={(e) => {
                  // Close modal if the user clicks outside the modal content
                  if (e.target === e.currentTarget) {
                    setShowCardModal(false);
                  }
                }}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
                  <h2 className="text-xl text-black font-bold mb-4">Välj ett kort</h2>
                  <div className="grid grid-cols-4 gap-4">
                    {unlockedCardsFlat.map((card) => (
                      <div
                        key={card.id}
                        className="cursor-pointer hover:scale-105 transition"
                        onClick={() => handleCardSelect(card)}
                      >
                        <Card cardId={card.id} collectionName={card.collection} />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Stäng
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
