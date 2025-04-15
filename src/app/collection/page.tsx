"use client"

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Collection() {
    const router = useRouter();

    const goToHome = () => {
        router.push('/'); // Navigate to the home page
    };

    return (
        <div>
            <h1>Collection Page</h1>
            <button onClick={goToHome}>Go to Home</button>
        </div>
    );
}