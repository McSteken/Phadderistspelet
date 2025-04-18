"use client"
import { useAuth } from "./AuthContext"
import LoadingSpinner from "@/app/components/loadingSpinner"

// used to wrap the app to show loading spinner while loading auth state
export default function AuthLayout({ children }: { children: React.ReactNode }){
    const {loading} = useAuth(); 

    if (loading) return <LoadingSpinner />; // Show loading spinner while loading

    return <>{children}</>
}