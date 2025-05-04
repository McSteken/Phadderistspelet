"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";


const AuthContext = createContext<{
  [x: string]: any; user: User | null; loading: boolean 
}>({
    user: null,
    loading: true,
})

export const AuthProvider = ({ children }: {children: React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        // unsubscribe from the listener when the component unmounts
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Provide the context value to children components
    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
