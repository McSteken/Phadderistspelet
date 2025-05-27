// app/components/Chat.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  createdAt: any;
};

type ChatProps = {
  gameId: string;
  userId: string;
  senderName: string;
};

export default function Chat({ gameId, userId, senderName }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const chatRef = collection(db, "games", gameId, "chat");
    const q = query(chatRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(messages);

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsub();
  }, [gameId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const chatRef = collection(db, "games", gameId, "chat");

    const textToSend = newMessage.trim();
    setNewMessage("");

    try {
      await addDoc(chatRef, {
        text: textToSend,
        sender: userId,
        senderName,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col space-x-4 p-4 rounded-lg h-full">
      <h2 className="font-bold text-gray-100 text-4xl mb-2 mx-auto">Chat:</h2>
      <div className="bg-gray-200 rounded-lg shadow-md px-4 pt-2 h-[300px] overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm text-gray-800 break-words whitespace-pre-wrap">
            <strong>{msg.senderName || "Anonym"}:</strong> {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-grow p-2 rounded-l bg-white text-gray-800"
          placeholder="Skriv ett meddelande..."
        />
        <button
          onClick={sendMessage}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-r"
        >
          Skicka
        </button>
      </div>
    </div>
  );
}
