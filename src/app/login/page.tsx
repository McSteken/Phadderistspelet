"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { collection, getDocs, query, where } from "firebase/firestore"; // Import Firestore functions
import { sendPasswordResetEmail } from "firebase/auth";

import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";


export default function LoginPage() {
    const router = useRouter(); // Initialize router
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // State to hold the confirm password
    const [username, setUserName] = useState(""); // State to hold the username
    const [identifier , setIdentifier] = useState(""); // State to hold the identifier (username or email)

    const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false); // State to hold the checked username

    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetStatus, setResetStatus] = useState("");

    const [error, setError] = useState(""); // State to hold error messages
    const [loading, setLoading] = useState(false); // State to manage loading state
    const [success, setSuccess] = useState(""); // State to hold success messages

    // Booleans to check input
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isSubmitDisabled = isLogin ?
        loading || !identifier || !password 
            : // else signup
        loading || !email || !password || !confirmPassword || !username || 
        password !== confirmPassword || usernameAvailable != true;

    const checkUsernameAvailability = async (username: string) => {
        if(!username) {
            setUsernameAvailable(null); // Reset availability check if username is empty
            setCheckingUsername(false); // Reset checking state
            //return;
        }
        try{
            setCheckingUsername(true); // Set checking state to true
            const normalizedUsername = username.toLowerCase(); // Normalize to lowercase

            const usernamesRef = collection(db, "users");
            const q = query(usernamesRef, where("lowercaseUsername", "==", normalizedUsername));
            const querySnapshot = await getDocs(q);
            console.log("Docs found:", querySnapshot.size);

            querySnapshot.forEach((doc) => {
                console.log("Document data:", doc.data()); // Log the document data
            })
        
            if (!querySnapshot.empty) {
              setUsernameAvailable(false);
              console.log("Username is taken:", username);
            } else {
              setUsernameAvailable(true);
              console.log("Username is available:", username);
            }
        } catch (error) {
            console.error("Error checking username availability:", error);
            setUsernameAvailable(false);
          } finally {
            setCheckingUsername(false);
          }
    }

    const handlePasswordReset = async () => {
        setResetStatus("");
        if (!resetEmail) {
            setResetStatus("Ange en giltig e-postadress.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetStatus("✔ Länk för återställning skickad!");
        } catch (error: any) {
            setResetStatus(error.message);
        }
    };

    // Function to handle authentication (login/signup)
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Set loading to true when starting the authentication process
        setError(""); // Reset error message
        setSuccess(""); // Reset success message

        try {
            if (isLogin) {
                let loginEmail = identifier;
                let isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
                console.log("isValidEmail:", isValidEmail); // Log the validity of the email
                // If it is a username, get the associated email
                if (!isValidEmail) {
                    const userNameRef = doc(db, "usernames", identifier);
                    const existing = await getDoc(userNameRef);

                    if(!existing.exists()) {
                        setError("Användarnamnet finns inte"); // Set error message if username does not exist
                        return;
                    }
                    loginEmail = existing.data()?.email; // Get the email associated with the username
                }

                await signInWithEmailAndPassword(auth, loginEmail, password);
                setSuccess("Inloggad!"); // Set success message on successful login
                router.push("/"); // Redirect to home page after login

            } 
            else {                
                const userNameRef = doc(db, "usernames", username);
                const existing = await getDoc(userNameRef);
                if(existing.exists()) {
                    setError("Användarnamnet är upptaget"); // Set error message if username is taken
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await new Promise<void>((resolve) => {
                    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
                      if (firebaseUser && firebaseUser.uid === user.uid) { // Check if the user is the same
                        unsubscribe(); // cleanup
                        resolve();
                      }
                    });
                  });
                  

                // Save the username and email in Firestore
                try
                {await setDoc(doc(db, 'users', user.uid), {
                  username: username,
                  lowercaseUsername: username.toLowerCase(), // Store the lowercase version of the username for case-insensitive queries
                  email: user.email,
                  createdAt: new Date(),
                });}
                catch (err) {
                    console.error("🔥 Failed to write to /users:", err);
                    setError("Error writing user profile: " + (err instanceof Error ? err.message : "Unknown error"));
                    return;
                                  }

                // save to usernames collection for easy lookup
                try{
                    await setDoc(doc(db, 'usernames', username), {
                    uid: user.uid,
                    email: user.email,
                    createdAt: new Date(),
                });
                } catch (err) {
                    console.error("🔥 Failed to write to /usernames:", err);
                    setError("Error writing username index: " + (err instanceof Error ? err.message : "Unknown error"));
                    return;
                }
                  
              
                setSuccess("Kontot skapat!"); // Set success message on successful signup
                router.push("/"); // Redirect to home page after signup
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
                {/* Username or email login */}

                {isLogin && (
                    <div className="relative w-full" >
                        <input 
                            type="text"
                            placeholder="Användarnamn / Email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="p-2 border rounded"
                            required
                            />
                    </div>
                )}

                {/* Username */}
                {!isLogin && (
                    <div className="relative w-full" >
                        <input
                            type="text"
                            placeholder="Användarnamn"
                            value={username}
                            onChange={(e) => {setUserName(e.target.value);
                                setUsernameAvailable(null); // Reset availability check on change
                            }}
                            className="p-2 border rounded"
                            required
                            onBlur={() => checkUsernameAvailability(username)} // Check username availability on blur
                        />
                    
                        {/*icons*/}
                        {checkingUsername && 
                            <ImSpinner2 className="absolute right-2 top-1/2 animate-spin -translate-y-1/2 text-gray-500" />
                        }
                        {username && usernameAvailable === false && usernameAvailable !== null && (
                            <FaTimesCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" /> 
                        )}
                        {username && usernameAvailable === true && (
                            <FaCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" /> 
                        )}

                    </div>
                )}
                
                {/* Email */}
                {!isLogin && (
                    <div className="relative w-full" >
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`p-2 border rounded ${email && !isValidEmail ? "border-red-500 focus:border-red-800" : "border-gray-300 focus:border-blue-500"}`}
                            required
                        />
                        {email && !isValidEmail && (
                            <FaTimesCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" /> 
                        )}
                        {email && isValidEmail && (
                            <FaCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" /> 
                        )}
                    </div>
                )}
                

                {/* Password available for both login and signup*/}
                <div className="relative w-full" >
                    <input
                        type="password"
                        placeholder="Lösenord"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-2 border rounded"
                        required
                    />
                    

                    {!isLogin && (
                        // icons
                        <>
                        {password && password.length < 6 && (
                            <FaTimesCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                        )}
                        {password && password.length >= 6 && (
                            <FaCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />
                        )}
                        </>
                    )}
                </div>

                
                {/* Confirm Password */}
                
                <div className="relative w-full" >
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

                    {/*icons*/}
                    {confirmPassword && password!=confirmPassword && (
                        <p className="text-red-500">Lösenord matchar ej.</p> 
                    )}
                    {confirmPassword && password === confirmPassword && (
                        <FaCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                </div>

                {!isLogin && (
                    <div className="relative w-full" >
                        {password.length < 6 && (
                            <p className="text-gray-400">• Lösenord minst 6 tecken.</p>
                        )}
                    </div>
                )}
                {isLogin && (
                <>
                    {showResetPassword ? (
                    <div className="flex flex-col gap-2">
                        <input
                        type="email"
                        placeholder="Din e-post"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="p-2 border rounded"
                        />
                        <button
                        type="button"
                        onClick={handlePasswordReset}
                        className="p-2 bg-yellow-500 text-white rounded"
                        >
                        Skicka återställningslänk
                        </button>
                        {resetStatus && <p className="text-sm text-gray-600">{resetStatus}</p>}
                        <button
                        type="button"
                        onClick={() => setShowResetPassword(false)}
                        className="text-blue-500 underline"
                        >
                        Tillbaka till inloggning
                        </button>
                    </div>
                    ) : (
                    <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-blue-500 underline"
                    >
                        Glömt lösenord?
                    </button>
                    )}
                </>
                )}
                {/* If password and confirmpassword dont match, dont light up button */}
                <button
                    type="submit"
                    className={`p-2 bg-blue-500 text-white rounded ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    // Disable button if loading or passwords don't match or all fields are not filled
                    disabled={isSubmitDisabled}
                >
                    {isLogin ? "Logga in" : "Skapa Konto"}
                </button>
                <div className="flex justify-center items-center">
                    {loading ? 
                        <ImSpinner2 className="animate-spin text-blue-500 w-14 h-14" />
                        : null
                    } 
                    {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                    {success && <p className="text-green-500">{success}</p>} {/* Display success message */}
                </div> 

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