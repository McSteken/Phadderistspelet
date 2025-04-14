"use client";
import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { collection, getDocs, query, where } from "firebase/firestore"; // Import Firestore functions

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // State to hold the confirm password
    const [username, setUserName] = useState(""); // State to hold the username

    const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);


    const [error, setError] = useState(""); // State to hold error messages
    const [loading, setLoading] = useState(false); // State to manage loading state
    const [success, setSuccess] = useState(""); // State to hold success messages

    // Booleans to check input
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isButtonDisabled =
    loading ||
    !email ||
    !password ||
    (!isLogin && (!confirmPassword || !username || password !== confirmPassword));


    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Set loading to true when starting the authentication process
        setError(""); // Reset error message

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setSuccess("Inloggad!"); // Set success message on successful login
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
              
                // Save the username and email in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                  username: username,
                  email: user.email,
                  createdAt: new Date(),
                });
              
                setSuccess("Kontot skapat!"); // Set success message on successful signup
            }
        } catch (err: any) {
            setError(err.message); // Set error message on failure
        } finally {
            setLoading(false); // Reset loading state
        }
    }
    return (

        <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-2xl font-bold">{isLogin ? "Logga in" : "Skapa Konto"}</h1>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Användarnamn"
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                        className="p-2 border rounded"
                        required
                    />

                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`p-2 border rounded ${email && !isValidEmail ? "border-red-500 focus:border-red-800" : "border-gray-300 focus:border-blue-500"}`}
                    required
                />
                {email && !isValidEmail && (
                    <p className="text-red-500">Ogiltig emailadress</p> 
                )}
                <input
                    type="password"
                    placeholder="Lösenord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-2 border rounded"
                    required
                />
                {!isLogin && (
                    <input
                        type="password"
                        placeholder="Bekräfta Lösenord"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="p-2 border rounded"
                        required
                    />
                    
                )}
                {confirmPassword && password!=confirmPassword && (
                    <p className="text-red-500">Lösenord matchar ej.</p> 
                )}
                {/* If password and confirmpassword dont match, dont light up button */}
                <button
                    type="submit"
                    className={`p-2 bg-blue-500 text-white rounded ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    // Disable button if loading or passwords don't match or all fields are not filled
                    disabled={isButtonDisabled}
                >
                    {isLogin ? "Logga in" : "Skapa Konto"}
                </button>
                {loading ? "Loading..." : null} {/* Display loading state */}
                {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                {success && <p className="text-green-500">{success}</p>} {/* Display success message */}
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-500 underline"
                >
                {isLogin ? "Har du inget konto? Skapa här!" : "Har du redan ett konto? Logga in här!"}
            </button>
            </form>
        </div>
    );
}